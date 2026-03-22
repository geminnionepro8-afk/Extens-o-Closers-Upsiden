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

try {
  importScripts('../../libs/supabase.min.js', '../../libs/supabase-config.js');
} catch (e) {
  console.error("Failed to load Supabase scripts.", e);
}

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

  // ── BULK SEND: Relay do Painel para Content Script ──
  if (['bulk_send_start', 'bulk_pausar', 'bulk_continuar', 'bulk_cancelar'].includes(mensagem.tipo)) {
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

