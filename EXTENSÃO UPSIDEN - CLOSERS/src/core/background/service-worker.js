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
});

chrome.runtime.onInstalled.addListener(() => {
  console.log(`${CONTEXTO} Instalado/Atualizado — Engine v2.`);
});
