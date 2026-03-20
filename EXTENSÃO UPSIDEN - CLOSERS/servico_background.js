const CONTEXTO = '[Upsiden-Background]';

chrome.runtime.onMessage.addListener((mensagem, remetente, responder) => {
  if (mensagem.tipo === 'enviar_audio_biblioteca') {
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }).then((abas) => {
      const aba = abas[0];
      if (!aba) {
        responder({ sucesso: false, erro: 'O WhatsApp Web não está rolando em nenhuma aba. Abra o WhatsApp primeiro!' });
        return;
      }
      
      chrome.tabs.sendMessage(aba.id, mensagem, (resposta) => {
        if (chrome.runtime.lastError) {
          responder({ sucesso: false, erro: 'A extensão acabou de ser instalada/atualizada. Abra o WhatsApp e pressione F5!' });
        } else {
          responder(resposta); 
        }
      });
    });
    return true; 
  }

  if (mensagem.tipo === 'abrir_painel') {
    chrome.tabs.create({ url: chrome.runtime.getURL('painel.html') });
    return false;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log(`${CONTEXTO} Instalado/Atualizado para envio instantâneo com WPP.`);
});

