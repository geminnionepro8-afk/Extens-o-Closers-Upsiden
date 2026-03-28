/**
 * @file painel-crm-core.js
 * @scope Estado global do CRM, constantes compartilhadas, dispatcher de renderizacao
 * @depends painel-helpers.js (renderSection, toast)
 * @extracted-from painel-templates-crm.js (Etapa 2 refatoracao)
 */
// === TEMPLATES ===
// CSS Centralizado Red Sun para Kanban (Compartilhado entre Modos)
const KANBAN_CORE_STYLE = `
  <style id="kanban-premium-styles">
     .ws-board-redsun { 
        display: flex; gap: 32px; padding: 24px; 
        overflow-x: auto; min-height: calc(100vh - 120px); width: 100%; 
        background: var(--bg-primary); font-family: 'Outfit', sans-serif; 
        box-sizing: border-box;
     }
     .ws-board-redsun::-webkit-scrollbar { height: 6px; }
     .ws-board-redsun::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
     
     .ws-col-rs { width: 320px; min-width: 320px; display: flex; flex-direction: column; max-height: 100%; }
     .ws-col-header-rs { padding-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
     
     .col-header-top { display: flex; justify-content: space-between; align-items: center; }
     .col-title-wrap { display: flex; align-items: center; gap: 10px; }
     .col-indicator { width: 3px; height: 18px; border-radius: 4px; background: var(--col-color, var(--accent)); }
     .ws-col-title-rs { font-size: 18px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
     
     .col-header-meta { display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 12px; font-weight: 500; }
     
     .col-actions-rs { display: flex; gap: 8px; }
     .col-btn-rs { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
     .col-btn-rs:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--text-muted); }

     .ws-cards-container-rs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; padding: 4px; min-height: 100px; }
     .ws-cards-container-rs::-webkit-scrollbar { width: 4px; }
     .ws-cards-container-rs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
     
     /* ── Premium RedSun Card — Reference-Accurate ── */
     .ws-card-premium { 
        background: var(--bg-secondary); 
        border-radius: 14px; 
        overflow: hidden; 
        cursor: grab; 
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
        position: relative; 
        box-shadow: 0 4px 18px rgba(0,0,0,0.25); 
        display: flex; 
        flex-direction: column; 
        border: 1px solid rgba(255,255,255,0.07); 
     }
     .ws-card-premium:hover { 
        transform: translateY(-4px); 
        box-shadow: 0 14px 32px rgba(0,0,0,0.45); 
        border-color: rgba(255,255,255,0.14); 
     }
     
     /* Priority banner: full-width, flush to top, rounded top corners matching card */
     .card-priority-banner { 
        width: 100%;
        padding: 7px 16px; 
        font-size: 10px; 
        font-weight: 600;
        text-align: center; 
        text-transform: uppercase; 
        letter-spacing: 1.5px; 
        color: rgba(0,0,0,0.80); 
        background: var(--urgency-color, #555);
        flex-shrink: 0;
     }
     
     /* Inner dashed box: reference-accurate — tight top margin, proper padding */
     .card-inner-box { 
        margin: 10px 10px 0; 
        padding: 14px 14px 10px;
        border: 1px dashed rgba(255,255,255,0.09); 
        border-radius: 10px; 
        display: flex; 
        flex-direction: column; 
        gap: 10px; 
        background: rgba(255,255,255,0.015);
     }
     
     /* Title: NOT bold per reference — weight 500 (medium) */
     .card-title-premium { 
        font-size: 16px; 
        font-weight: 500; 
        color: var(--text-primary); 
        margin: 0; 
        letter-spacing: -0.1px;
        line-height: 1.35;
     }
     
     .card-desc-premium { 
        font-size: 13px; 
        color: var(--text-muted); 
        line-height: 1.5; 
        display: -webkit-box; 
        -webkit-line-clamp: 2; 
        -webkit-box-orient: vertical; 
        overflow: hidden; 
        margin: 0;
     }
     
     .card-mid-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-top: 4px; 
     }
     
     .card-avatars-rs { display: flex; align-items: center; }
     .card-avatar-item { 
       width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--bg-secondary); 
       background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; 
       font-size: 11px; font-weight: 700; margin-left: -8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); overflow: hidden;
     }
     .card-avatar-item:first-child { margin-left: 0; }
     .card-avatar-item img { width: 100%; height: 100%; object-fit: cover; }
     
     /* Status badge: pill shape like reference */
     .card-status-badge-rs { 
       padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; 
       background: var(--status-bg, rgba(255,255,255,0.06)); 
       color: var(--status-color, var(--text-secondary));
       border: 1px solid rgba(255,255,255,0.08);
       white-space: nowrap;
     }
     
     /* Footer: reference has subtle separator + icon meta + date */
     .card-footer-premium { 
        padding: 10px 14px 12px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        color: var(--text-muted); 
        font-size: 11.5px; 
        font-weight: 500;
        border-top: 1px solid rgba(255,255,255,0.05);
        margin-top: 2px;
     }
     .card-date-premium { font-size: 11px; color: var(--text-muted); opacity: 0.55; }
     .card-actions-rs { display: flex; align-items: center; gap: 6px; }
     
     .card-meta-rs { display: flex; align-items: center; gap: 12px; }
     .meta-rs-item { display: flex; align-items: center; gap: 5px; opacity: 0.65; cursor: pointer; transition: opacity 0.15s; }
     .meta-rs-item:hover { opacity: 1; }
     .meta-rs-item svg { width: 13px; height: 13px; }

     .ws-cards-container-rs.drag-over { background: var(--accent-dim); border-radius: 12px; outline: 2px dashed var(--accent-glow); }
  </style>
`;
// === CRM DYNAMICS (Colunas e Tags) ===
let dynamicStages = [];
let dynamicTags = {};

// Urgency Levels (configurable priority)
const URGENCY_LEVELS_CRM = {
  normal:      { label: 'Normal',      color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' }, // Green
  importante:  { label: 'Importante',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' }, // Blue
  urgente:     { label: 'Urgente',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' }, // Orange
  critico:     { label: 'Cr\u00edtico',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' }, // Red
  vip:         { label: 'VIP',         color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' }  // Purple
};

async function loadCRMDynamics() {
  return new Promise(resolve => {
    chrome.storage.local.get(['ups_crm_colunas', 'ups_crm_tags'], (res) => {
      // 1. Colunas (Fases do Funil)
      if (res.ups_crm_colunas && res.ups_crm_colunas.length > 0) {
        dynamicStages = res.ups_crm_colunas;
      } else {
        dynamicStages = [
          { id: 'prospeccao', label: 'Prospecção', color: '#FFD666' },
          { id: 'negociacao', label: 'Negociação', color: '#66B2FF' },
          { id: 'fechado', label: 'Fechado', color: '#66FFB2' }
        ];
      }
      
      // 2. Multi-Tags Coloridas (Labels)
      if (res.ups_crm_tags && Object.keys(res.ups_crm_tags).length > 0) {
        dynamicTags = res.ups_crm_tags;
      } else {
        dynamicTags = {
          quente:  { bg: '#FFB4B4', cor: '#8B1A1A', emoji: '🔥' },
          morno:   { bg: '#FFE5B4', cor: '#8B6914', emoji: '☀️' },
          frio:    { bg: '#B4D7FF', cor: '#1A4B8B', emoji: '❄️' },
          vip:     { bg: '#E5B4FF', cor: '#5A1A8B', emoji: '⭐' },
          urgente: { bg: '#FFB4D7', cor: '#8B1A4B', emoji: '🚨' }
        };
      }
      resolve();
    });
  });
}

function fmtMoeda(v) { return (parseFloat(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

window.crmSyncModeActive = false;

window.toggleCRMSyncMode = function(checked) {
   window.crmSyncModeActive = checked;
   if (typeof renderSection === 'function') renderSection('crm');
};

async function renderCRM(c) {
   if (window.currentCRMTab === 'agenda') {
       await renderAgendaCRM(c);
       return;
   }

   if (window.crmSyncModeActive) {
       await renderSyncLabelsCRM(c);
   } else {
       await renderCustomCRM(c);
   }
}

// === CRM PERSONALIZADO (NOVA INTEGRAÇÃO WASPEED) ===
window.currentCRMViewMode = window.currentCRMViewMode || 'abas'; // 'abas' ou 'etiquetas'

// Funções globais para o sistema data-click do Painel (CSP compliant)
window.currentCRMTab = 'kanban'; // 'kanban', 'agenda'

window.setCRMTab = function(tab) {
  window.currentCRMTab = tab;
  renderSection('crm');
};

window.toggleCRMViewMode = function() {
  // Funil Kanban vs Etiquetas Sync
  window.crmSyncModeActive = !window.crmSyncModeActive;
  window.currentCRMTab = 'kanban'; 
  renderSection('crm');
};

window.activateSyncMode = function() {
  window.crmSyncModeActive = true;
  renderSection('crm');
};

window.openWppDirect = function(phone) {
  if (!phone) { typeof toast === 'function' && toast('Sem número de WhatsApp salvo.', 'error'); return; }
  window.open('https://web.whatsapp.com/send?phone=' + phone, '_blank');
};

// === EXPORTS (required for data-click delegation) ===
window.renderCRM = renderCRM;
