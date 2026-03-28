const CONTEXTO = '[Upsiden-Background]';

try {
  importScripts('src/libs/supabase.min.js', 'src/libs/supabase-config.js');
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

  // ── Abrir Painel em nova aba ──
  if (mensagem.tipo === 'abrir_painel') {
    chrome.tabs.create({ url: chrome.runtime.getURL('painel.html') });
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

  //   BULK: Relay de progresso/concluso do Content Script para o Painel  
  if (mensagem.tipo === 'bulk_progresso' || mensagem.tipo === 'bulk_concluido') {
    // Enviar para todas as abas do painel
    chrome.runtime.sendMessage(mensagem).catch(() => {});
    return false;
  }

  //   METRICS LOGGING: Rastreio silencioso pelo WhatsApp Web  
  if (mensagem.tipo === 'log_metric') {
    chrome.storage.local.get(['ups_user'], async (res) => {
      if (!res.ups_user || !res.ups_user.id) return;
      try {
        await supabaseClient.from('metrics').insert({
          user_id: res.ups_user.id,
          evento: mensagem.evento,
          metadata: mensagem.metadata || {}
        });
      } catch(e) { console.error('BG Metric Fail:', e); }
    });
    return false;
  }

  // ── CSP BYPASS: Fetch Media as Base64 ──
  if (mensagem.tipo === 'fetch_media_base64_bg') {
    const downloadTimeout = setTimeout(() => {
        responder({ sucesso: false, erro: 'Timeout no Download (Background Local)' });
    }, 25000);

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

      fetch(mensagem.url, { headers })
        .then(async (response) => {
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase Bloqueou o Download (HTTP ${response.status}): ${errText}`);
          }
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const blob = await response.blob();
          
          // Conversão robusta usando FileReader (estável para arquivos grandes)
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          clearTimeout(downloadTimeout);
          responder({ sucesso: true, base64: base64 });
        })
        .catch(err => {
          clearTimeout(downloadTimeout);
          console.error('Fetch Media Fail:', err);
          responder({ sucesso: false, erro: err.message });
        });
    });
    return true; // Mantém o canal aberto para resposta assíncrona
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log(`${CONTEXTO} Instalado/Atualizado — Engine v2.`);
});

// CRON JOB para Timeouts/Delays longos (Rodando a cada 1 minício)
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
