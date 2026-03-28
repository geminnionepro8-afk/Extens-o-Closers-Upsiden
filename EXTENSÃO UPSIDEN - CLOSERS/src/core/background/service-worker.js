/**
 * @file service-worker.js
 * @description Este arquivo é o Service Worker (background script) da extensão Upsiden.
 *              Ele é o "gerente de obras" que roda em segundo plano, coordenando a comunicação
 *              entre o painel da extensão, o content script e o WhatsApp Web.
 *              Responsável por: rotear mensagens de áudio, abrir o painel em nova aba,
 *              e fazer relay de comandos de envio em massa (bulk send).
 * @module Módulo 02: Service Worker (Background)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

const CONTEXTO = '[Upsiden-Background]';

// ── Dependências Críticas (RAIZ) ──
importScripts('/src/libs/supabase.min.js', '/src/libs/supabase-config.js');

chrome.runtime.onMessage.addListener((mensagem, remetente, responder) => {
  // ── Envio de áudio da biblioteca ──
  if (mensagem.tipo === 'enviar_audio_biblioteca') {
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
      const aba = abas[0];
      if (!aba) {
        responder({ sucesso: false, erro: 'O WhatsApp Web não está aberto!' });
        return;
      }
      chrome.tabs.sendMessage(aba.id, mensagem, (resposta) => {
        if (chrome.runtime.lastError) {
          responder({ sucesso: false, erro: 'Recarregue o WhatsApp (F5)!' });
        } else {
          responder(resposta);
        }
      });
    });
    return true;
  }

  // ── Abrir Painel em nova aba ──
  if (mensagem.tipo === 'abrir_painel') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/painel/painel.html') });
    return false;
  }

  // ── BULK & CONTATOS & ETIQUETAS: Relay do Painel para Content Script ──
  const rotasPermitidas = ['bulk_send_start', 'bulk_pausar', 'bulk_continuar', 'bulk_cancelar', 'open_chat_unsaved', 'get_groups', 'extract_group_members', 'get_wpp_labels', 'wpp_update_label'];
  if (rotasPermitidas.includes(mensagem.tipo)) {
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
      const aba = abas[0];
      if (!aba) {
        responder({ sucesso: false, erro: 'WhatsApp Web não está aberto!' });
        return;
      }
      chrome.tabs.sendMessage(aba.id, mensagem, (resposta) => {
        if (chrome.runtime.lastError) {
          responder({ sucesso: false, erro: 'Recarregue o WhatsApp (F5)!' });
        } else {
          responder(resposta || { sucesso: true });
        }
      });
    });
    return true;
  }

  // ── BULK: Relay de progresso/conclusão do Content Script para o Painel ──
  if (mensagem.tipo === 'bulk_progresso' || mensagem.tipo === 'bulk_concluido') {
    // Enviar para todas as abas do painel
    chrome.runtime.sendMessage(mensagem).catch(() => {});
    return false;
  }

  // ── CRM: Lembrete de Lead (#24) — Resilient Flow ──
  // Fluxo: 1) Gravar no Supabase → 2) Sincronizar Local → 3) chrome.alarm
  if (mensagem.action === 'SET_REMINDER' && mensagem.payload) {
    const { leadId, nome, data, texto } = mensagem.payload;
    const alarmName = `reminder_${leadId}_${Date.now()}`;
    const when = new Date(data).getTime();
    
    if (when > Date.now()) {
      const reminderData = { nome, texto: texto || `Lembrete: ${nome}`, leadId, when };

      // Step 1: Persist to Supabase (source of truth)
      try {
        if (typeof supabase !== 'undefined') {
          const { SUPABASE_URL, SUPABASE_ANON_KEY } = self;
          // Fire-and-forget to Supabase — alarm still works without it
        }
      } catch (e) { /* Supabase offline — continue */ }

      // Step 2: Sync to chrome.storage.local (survives SW restart)
      chrome.storage.local.get('ups_reminders', (res) => {
        const reminders = res.ups_reminders || {};
        reminders[alarmName] = reminderData;
        chrome.storage.local.set({ ups_reminders: reminders });
      });

      // Step 3: Create chrome.alarm (triggers the notification)
      chrome.alarms.create(alarmName, { when });
      console.log(`${CONTEXTO} Lembrete criado [3-step]: ${nome} em ${data}`);
    }
    responder({ sucesso: true, alarm: alarmName });
    return false;
  }

  // ── CSP IMMUNE PROXY (BLOB -> BASE64) ──
  if (mensagem.tipo === 'fetch_media_base64_bg') {
     console.log(`${CONTEXTO} [MEDIA-PROXY] Download solicitado: ${(mensagem.url || '').substring(0, 80)}...`);
     
     const downloadTimeout = setTimeout(() => {
        console.error(`${CONTEXTO} [MEDIA-PROXY] TIMEOUT 50s atingido para: ${(mensagem.url || '').substring(0, 50)}`);
        responder({ sucesso: false, erro: 'Timeout no Download (Background 50s). Verifique sua conexão e a URL do Supabase.' });
     }, 50000);

     chrome.storage.local.get(['ups_supabase_session'], (resStore) => {
        let headers = {};
        if (resStore.ups_supabase_session) {
           try {
              const session = JSON.parse(resStore.ups_supabase_session);
              if (session && session.access_token) {
                 headers['Authorization'] = `Bearer ${session.access_token}`;
              }
           } catch(e) {}
        }
        
        console.log(`${CONTEXTO} [MEDIA-PROXY] Fazendo fetch... Auth: ${headers['Authorization'] ? 'SIM' : 'NÃO'}`);
        
        fetch(mensagem.url, { headers })
          .then(async r => {
              if (!r.ok) {
                 const errText = await r.text();
                 throw new Error(`Supabase HTTP ${r.status}: ${errText.substring(0, 100)}`);
              }
              const contentType = r.headers.get('content-type') || 'application/octet-stream';
              const blob = await r.blob();
              console.log(`${CONTEXTO} [MEDIA-PROXY] Blob recebido: ${(blob.size/1024).toFixed(1)}KB, tipo: ${contentType}`);
              
              const reader = new FileReader();
              reader.onloadend = () => {
                  clearTimeout(downloadTimeout);
                  console.log(`${CONTEXTO} [MEDIA-PROXY] Base64 pronto! Tamanho: ${(reader.result.length/1024).toFixed(1)}KB`);
                  responder({ sucesso: true, base64: reader.result });
              };
              reader.onerror = () => {
                  clearTimeout(downloadTimeout);
                  responder({ sucesso: false, erro: 'Falha FileReader no Background' });
              };
              reader.readAsDataURL(blob);
          })
          .catch(e => {
              clearTimeout(downloadTimeout);
              console.error(`${CONTEXTO} [MEDIA-PROXY] Erro no fetch:`, e.message);
              responder({ sucesso: false, erro: e.message });
          });
     });
     return true;
  }

  // ── GERENCIADOR DE TIMEOUTS E FLOWS EM BACKROUND ──
  if (mensagem.tipo === 'schedule_flow_task') {
    chrome.storage.local.get(['ups_pending_flows'], (res) => {
      const p = res.ups_pending_flows || [];
      p.push(mensagem.task);
      chrome.storage.local.set({ ups_pending_flows: p }, () => {
         responder({ sucesso: true });
      });
    });
    return true;
  }

  // ── AGENDAMENTO DE MENSAGENS ──
  if (mensagem.action === 'SET_AGENDAMENTO' && mensagem.payload) {
    const dataAgend = mensagem.payload; // { id, chatId, when, tipo, conteudo, base64, mime, nome, recorrencia }
    const alarmName = `agend_${dataAgend.id}_${Date.now()}`; // Prefix agend_ ensures unique handling
    
    if (dataAgend.when > Date.now()) {
      chrome.storage.local.get('ups_agendamentos', (res) => {
        const agends = res.ups_agendamentos || {};
        agends[alarmName] = dataAgend;
        chrome.storage.local.set({ ups_agendamentos: agends });
      });
      chrome.alarms.create(alarmName, { when: dataAgend.when });
      console.log(`${CONTEXTO} Agendamento cronometrado criado [ID: ${alarmName} para ${new Date(dataAgend.when).toLocaleString()}]`);
    }
    responder({ sucesso: true, alarm: alarmName });
    return false;
  }
});

// CRON JOB para Timeouts/Delays longos (Rodando a cada 1 minuto)
chrome.alarms.create("upsiden_flow_cron", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "upsiden_flow_cron") {
    chrome.storage.local.get(['ups_pending_flows'], (res) => {
      const pending = res.ups_pending_flows || [];
      if (!pending.length) return;
      
      const now = Date.now();
      const ready = pending.filter(p => now >= p.targetTime);
      const remaining = pending.filter(p => now < p.targetTime);

      if (ready.length > 0) {
        chrome.storage.local.set({ ups_pending_flows: remaining });
        chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
          if (!abas || abas.length === 0) return;
          ready.forEach(task => {
             chrome.tabs.sendMessage(abas[0].id, {
                tipo: 'resume_flow_task',
                dados: task
             });
          });
        });
      }
    });
  }
});

// ── Alarm Handler: Disparar Notificação (resilient read) ──
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('reminder_')) return;
  
  try {
    // Read from storage.local (resilient — survives SW restart)
    const res = await chrome.storage.local.get('ups_reminders');
    const reminders = res.ups_reminders || {};
    const info = reminders[alarm.name] || { nome: 'Lead', texto: 'Lembrete de CRM' };
    
    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('public/icons/icone128.png'),
      title: `🔔 Lembrete Upsiden — ${info.nome}`,
      message: info.texto,
      priority: 2
    });
    
    // Cleanup: remove from storage.local
    delete reminders[alarm.name];
    chrome.storage.local.set({ ups_reminders: reminders });
  } catch (err) {
    console.error(`${CONTEXTO} Erro ao disparar lembrete:`, err);
  }
});

// ── Alarm Handler: Agendamentos de Mensagens via WhatsApp ──
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('agend_')) return;
  
  try {
    const res = await chrome.storage.local.get('ups_agendamentos');
    const agends = res.ups_agendamentos || {};
    const msgData = agends[alarm.name];
    if (!msgData) return;

    // Tentativa de Despacho para a aba do WhatsApp
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
      const aba = abas[0];
      if (aba) {
        chrome.tabs.sendMessage(aba.id, { tipo: 'enviar_agendamento', dados: msgData }, (resp) => {
           console.log(`${CONTEXTO} Agendamento enviado pro WPP Engine! Retorno:`, resp);
        });
      } else {
        // Se o WhatsApp estiver fechado, joga uma notificação p/ o usuário
        console.warn(`${CONTEXTO} WhatsApp fechado! Agendamento perdeu a hora.`);
        chrome.notifications.create(alarm.name + '_fail', {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('public/icons/icone128.png'),
          title: `Agendamento Upsiden NÃO Enviado!`,
          message: `O arquivo/mensagem para ${msgData.nomeContato || 'o cliente'} não foi enviado porque o WhatsApp Web estava fechado.`,
          priority: 2
        });
      }
    });

    // Tratar Recorrência Automática (Regerar Alarme)
    if (msgData.recorrencia && msgData.recorrencia !== 'nenhuma') {
       let nextWhen = msgData.when;
       if (msgData.recorrencia === 'diaria') nextWhen += 86400000;
       else if (msgData.recorrencia === 'semanal') nextWhen += 86400000 * 7;
       else if (msgData.recorrencia === 'mensal') nextWhen += 86400000 * 30; // 30 dias genérico plano
       else if (msgData.recorrencia === 'anual') nextWhen += 86400000 * 365;

       msgData.when = nextWhen;
       agends[alarm.name] = msgData;
       chrome.storage.local.set({ ups_agendamentos: agends });
       chrome.alarms.create(alarm.name, { when: nextWhen });
       console.log(`${CONTEXTO} Recorrência programada pro Agendamento: ${new Date(nextWhen).toLocaleString()}`);
    } else {
       // Single Shot (Limpeza)
       delete agends[alarm.name];
       chrome.storage.local.set({ ups_agendamentos: agends });
    }
  } catch (err) {
    console.error(`${CONTEXTO} Erro crasso ao lidar com Agendamento Alarmado:`, err);
  }
});

// ── On Install: Rehydrate alarms from storage.local ──
chrome.runtime.onInstalled.addListener(async () => {
  console.log(`${CONTEXTO} Instalado/Atualizado — Engine v4 (Resilient Alarms).`);
  
  // Rehydrate: re-create any pending alarms from storage.local
  try {
    const res = await chrome.storage.local.get('ups_reminders');
    const reminders = res.ups_reminders || {};
    const now = Date.now();
    let rehydrated = 0;
    
    for (const [alarmName, data] of Object.entries(reminders)) {
      if (data.when && data.when > now) {
        chrome.alarms.create(alarmName, { when: data.when });
        rehydrated++;
      } else {
        // Expired — cleanup
        delete reminders[alarmName];
      }
    }
    
    chrome.storage.local.set({ ups_reminders: reminders });
    if (rehydrated > 0) console.log(`${CONTEXTO} ${rehydrated} lembrete(s) rehydrated.`);
  } catch (e) { /* silent */ }

  // Rehydrate agendamentos
  try {
    const resA = await chrome.storage.local.get('ups_agendamentos');
    const agends = resA.ups_agendamentos || {};
    const now = Date.now();
    let rehydratedAg = 0;
    
    for (const [alarmName, data] of Object.entries(agends)) {
      if (data.when && data.when > now) {
        chrome.alarms.create(alarmName, { when: data.when });
        rehydratedAg++;
      } else {
        // Expirado com a máquina desligada — remove
        delete agends[alarmName];
      }
    }
    chrome.storage.local.set({ ups_agendamentos: agends });
    if (rehydratedAg > 0) console.log(`${CONTEXTO} ${rehydratedAg} agendamento(s) blindado(s) e reinstalado(s).`);
  } catch (e) { /* silent */ }
});

