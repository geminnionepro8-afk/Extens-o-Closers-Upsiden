/**
 * @file service-worker.js
 * @description Background script da extensão Upsiden.
 */

const CONTEXTO = '[Upsiden-Background]';

// ── Dependências Críticas ──
importScripts('/src/libs/supabase.min.js', '/src/libs/supabase-config.js');

chrome.runtime.onMessage.addListener((mensagem, remetente, responder) => {
  // ── Envio de áudio da biblioteca ──
  if (mensagem.tipo === 'enviar_audio_biblioteca') {
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
      const aba = abas[0];
      if (!aba) { responder({ sucesso: false, erro: 'O WhatsApp Web não está aberto!' }); return; }
      chrome.tabs.sendMessage(aba.id, mensagem, (resposta) => {
        if (chrome.runtime.lastError) responder({ sucesso: false, erro: 'Recarregue o WhatsApp (F5)!' });
        else responder(resposta);
      });
    });
    return true;
  }

  // ── Abrir Painel ──
  if (mensagem.tipo === 'abrir_painel') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/painel/painel.html') });
    return false;
  }

  // ── Roteamento de comandos para o WhatsApp Web ──
  const rotasWPP = ['bulk_send_start', 'bulk_pausar', 'bulk_continuar', 'bulk_cancelar', 'open_chat_unsaved', 'get_groups', 'extract_group_members', 'get_wpp_labels', 'wpp_update_label', 'reload_automation_config'];
  if (rotasWPP.includes(mensagem.tipo)) {
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
      const aba = abas[0];
      if (!aba) { responder({ sucesso: false, erro: 'WhatsApp Web não aberto!' }); return; }
      chrome.tabs.sendMessage(aba.id, mensagem, (resposta) => {
        if (chrome.runtime.lastError) responder({ sucesso: false, erro: 'F5 no WhatsApp!' });
        else responder(resposta || { sucesso: true });
      });
    });
    return true;
  }

  // ── CSP IMMUNE PROXY (Onde estava o erro de Auth) ──
  if (mensagem.tipo === 'fetch_media_base64_bg') {
     console.log(`${CONTEXTO} [MEDIA-PROXY] Solicitando download: ${mensagem.url?.substring(0, 50)}...`);
     
     const downloadTimeout = setTimeout(() => {
        responder({ sucesso: false, erro: 'Timeout 50s' });
     }, 45000);

     const callFetch = async () => {
         try {
             let headers = {};
             // NOVIDADE: Priorizar a sessão que vem diretamente da página (através da ponte)
             const rawSession = mensagem.session;
             
             if (!rawSession) {
                 const resStore = await chrome.storage.local.get(['ups_supabase_session']);
                 if (resStore.ups_supabase_session) {
                     try {
                         const session = JSON.parse(resStore.ups_supabase_session);
                         if (session && session.access_token) {
                             headers['Authorization'] = `Bearer ${session.access_token}`;
                         }
                     } catch(e) {}
                 }
             } else {
                 try {
                     const session = typeof rawSession === 'string' ? JSON.parse(rawSession) : rawSession;
                     if (session && session.access_token) {
                         headers['Authorization'] = `Bearer ${session.access_token}`;
                     }
                 } catch(e) {}
             }

             console.log(`${CONTEXTO} [MEDIA-PROXY] Iniciando Fetch. Auth: ${headers['Authorization'] ? 'SIM ✅' : 'NÃO ❌'}`);

             const r = await fetch(mensagem.url, { headers });
             if (!r.ok) {
                 const txt = await r.text();
                 throw new Error(`HTTP ${r.status}: ${txt.substring(0, 100)}`);
             }
             
             const contentType = r.headers.get('content-type') || 'application/octet-stream';
             const buffer = await r.arrayBuffer();
             const bytes = new Uint8Array(buffer);
             
             // Otimização Crítica: Previne Crash do Service Worker por Thread Locking em arquivos longos (Áudios MP3/OGG).
             const CHUNK_SIZE = 0x8000; // 32768 bytes por vez
             const chunks = [];
             for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
                 chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE)));
             }
             
             const b64 = btoa(chunks.join(''));
             const dataUrl = `data:${contentType};base64,${b64}`;
             
             clearTimeout(downloadTimeout);
             responder({ sucesso: true, base64: dataUrl });
         } catch (e) {
             clearTimeout(downloadTimeout);
             console.error(`${CONTEXTO} [MEDIA-PROXY] Erro:`, e.message);
             responder({ sucesso: false, erro: e.message });
         }
     };

     callFetch();
     return true; // Indicates the listener handles it asynchronously
  }

  // ── FLUXOS E ALARMES (Mantendo lógica original) ──
  if (mensagem.tipo === 'schedule_flow_task') {
    chrome.storage.local.get(['ups_pending_flows'], (res) => {
      const p = res.ups_pending_flows || [];
      p.push(mensagem.task);
      chrome.storage.local.set({ ups_pending_flows: p }, () => responder({ sucesso: true }));
    });
    return true;
  }

  // ── LEMBRETES ──
  if (mensagem.action === 'SET_REMINDER' && mensagem.payload) {
    const { leadId, nome, data, texto } = mensagem.payload;
    const alarmName = `reminder_${leadId}_${Date.now()}`;
    const when = new Date(data).getTime();
    if (when > Date.now()) {
      chrome.storage.local.get('ups_reminders', (res) => {
        const reminders = res.ups_reminders || {};
        reminders[alarmName] = { nome, texto: texto || `Lembrete: ${nome}`, leadId, when };
        chrome.storage.local.set({ ups_reminders: reminders });
      });
      chrome.alarms.create(alarmName, { when });
    }
    responder({ sucesso: true, alarm: alarmName });
    return false;
  }
});

// CRON JOB para Timeouts/Delays longos
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
          ready.forEach(task => chrome.tabs.sendMessage(abas[0].id, { tipo: 'resume_flow_task', dados: task }));
        });
      }
    });
  }
});
