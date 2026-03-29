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
        display: flex; gap: 40px; padding: 24px; 
        overflow-x: auto; min-height: calc(100vh - 120px); width: 100%; 
        background: var(--bg-primary); font-family: 'Outfit', sans-serif; 
        box-sizing: border-box;
     }
     .ws-board-redsun::-webkit-scrollbar { height: 6px; }
     .ws-board-redsun::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
     
     .ws-col-rs { width: 340px; min-width: 340px; display: flex; flex-direction: column; max-height: 100%; }
     .ws-col-header-rs { padding-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
     
     .col-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
     .col-title-wrap { display: flex; align-items: center; gap: 12px; }
     .col-indicator { width: 4px; height: 18px; border-radius: 99px; background: var(--col-color, var(--accent)); }
     
     .ws-col-title-rs { 
        font-size: 15px; 
        font-weight: 500; 
        color: var(--text-primary); 
        text-transform: uppercase; 
        letter-spacing: 2.2px;
        opacity: 0.95;
     }
     
     .col-header-meta { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        color: var(--text-muted); 
        font-size: 11px; 
        font-weight: 400;
        opacity: 0.7;
        padding-left: 16px;
     }
     
     .col-actions-rs { display: flex; gap: 8px; }
     .col-btn-rs { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); width: 34px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.25s; }
     .col-btn-rs:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--text-muted); }

     .ws-cards-container-rs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; padding: 4px; min-height: 100px; }
     .ws-cards-container-rs::-webkit-scrollbar { width: 4px; }
     .ws-cards-container-rs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
     
     /* ── Premium RedSun Card ── */
     .ws-card-premium { 
        background: transparent;
        overflow: visible; 
        cursor: grab; 
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); 
        position: relative; 
        display: flex; 
        flex-direction: column; 
        border: none; 
        margin-bottom: 8px;
     }
     .ws-card-premium:hover { 
        transform: translateY(-4px); 
        box-shadow: 0 16px 36px rgba(0,0,0,0.5); 
        border-color: rgba(255,255,255,0.12); 
     }
     
     .card-priority-banner { 
        width: 100%;
        margin: 0;
        padding: 8px 16px 20px 16px; 
        font-size: 10px; 
        font-weight: 800;
        text-align: center; 
        text-transform: uppercase; 
        letter-spacing: 0.8px; 
        color: #FFFFFF !important; 
        background: var(--urgency-color, #555);
        border-radius: 14px 14px 0 0;
        position: relative;
        z-index: 1;
        flex-shrink: 0;
     }

     /* Inner dashed box: 'tracejado' accurate to reference */
     .card-inner-box { 
        margin: -14px 0 0 0; 
        padding: 16px;
        border: 1.5px dashed rgba(255,255,255,0.12); 
        border-radius: 12px; 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
        background: #1a1a1a;
        position: relative;
        z-index: 2;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
     }
     
     .card-title-premium { 
        font-size: 15px; 
        font-weight: 600; 
        color: #ffffff; 
        margin: 0; 
        letter-spacing: -0.2px;
        line-height: 1.35;
     }
     
     .card-desc-premium { 
        font-size: 12.5px; 
        color: rgba(255, 255, 255, 0.5); 
        line-height: 1.5; 
        display: -webkit-box; 
        -webkit-line-clamp: 2; 
        -webkit-box-orient: vertical; 
        overflow: hidden; 
        margin: 0;
        font-weight: 400;
     }
     
     .card-mid-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-top: 6px; 
     }
     
     .card-avatars-rs { display: flex; align-items: center; }
     .card-avatar-item { 
        width: 32px; height: 32px; border-radius: 50%; border: 2px solid #141414; 
        background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; 
        font-size: 12px; font-weight: 700; margin-left: -10px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); overflow: hidden;
     }
     .card-avatar-item:first-child { margin-left: 0; }
     .card-avatar-item img { width: 100%; height: 100%; object-fit: cover; }
     
     .card-status-badge-rs { 
        padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; 
        background: rgba(255,255,255,0.08); 
        color: rgba(255,255,255,0.9);
        border: none;
        white-space: nowrap;
     }
     
     .card-footer-premium { 
        padding-top: 10px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        color: rgba(255, 255, 255, 0.45); 
        font-size: 12px; 
        font-weight: 400;
        margin-top: 2px;
     }
     .card-date-premium { font-size: 12px; color: var(--text-muted); opacity: 0.6; font-weight: 600; }
     
     .card-meta-rs { display: flex; align-items: center; gap: 16px; }
     .meta-rs-item { display: flex; align-items: center; gap: 6px; opacity: 0.5; transition: opacity 0.2s; }
     .meta-rs-item:hover { opacity: 1; }
     .meta-rs-item svg { width: 15px; height: 15px; }

     .ws-cards-container-rs.drag-over { background: rgba(255, 255, 255, 0.03); border-radius: 16px; }

     /* ── Modern Header / Controls ── */
     .rs-crm-header-wrap { display: flex; flex-direction: column; gap: 16px; width: 100%; padding: 4px 0 12px; }
     
     .rs-breadcrumbs { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 500; }
     .rs-breadcrumb-item { display: flex; align-items: center; gap: 6px; cursor: pointer; transition: color 0.2s; }
     .rs-breadcrumb-item:hover { color: #fff; }
     .rs-breadcrumb-item svg { width: 14px; height: 14px; opacity: 0.7; }
     .rs-breadcrumb-sep { opacity: 0.3; font-size: 11px; }

     .rs-controls-row { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 12px; }
     
     .rs-btn-group { 
        display: flex; gap: 1px; background: rgba(255,255,255,0.06); padding: 2px; border-radius: 10px; 
        border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
     }
     .rs-btn-premium {
        background: transparent; border: none; color: rgba(255,255,255,0.6); 
        padding: 8px 16px; font-size: 12.5px; font-weight: 600; cursor: pointer; 
        display: flex; align-items: center; gap: 8px; border-radius: 8px; transition: all 0.2s;
        white-space: nowrap;
     }
     .rs-btn-premium:hover { color: #fff; background: rgba(255,255,255,0.04); }
     .rs-btn-premium.active { 
        background: #252528; color: var(--accent); 
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
     }
     .rs-btn-premium svg { width: 15px; height: 15px; }

     .rs-btn-plus {
        background: linear-gradient(135deg, var(--accent) 0%, #ff8c00 100%); 
        color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 8px 18px; 
        border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; gap: 8px; transition: all 0.2s;
        box-shadow: 0 4px 15px rgba(255,98,0,0.3);
     }
     .rs-btn-plus:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,98,0,0.4); opacity: 0.95; }
     
     .rs-btn-icon-group {
        background: #1a1a1a; width: 34px; height: 34px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(255,255,255,0.06); cursor: pointer; color: rgba(255,255,255,0.6);
        transition: all 0.2s;
     }
     .rs-btn-icon-group:hover { color: #fff; background: #252528; border-color: rgba(255,255,255,0.15); }
  </style>
`;
// === CRM DYNAMICS (Colunas e Tags) ===
let dynamicStages = [];
let dynamicTags = {};

// Urgency Levels (configurable priority)
const URGENCY_LEVELS_CRM = {
  normal:      { label: 'BAIXA PRIORIDADE',      color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' }, // Green
  importante:  { label: 'MODERADA PRIORIDADE',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' }, // Blue
  urgente:     { label: 'URGENTE',              color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' }, // Orange
  critico:     { label: 'ALTA PRIORIDADE',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' }, // Red
  vip:         { label: 'ON BOARDING',           color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' }  // Blue
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
