/**
 * @file painel-helpers.js
 * @description Funções auxiliares e utilitárias usadas por todas as seções do Painel.
 *              Inclui: formatação de tamanho (bytes→KB/MB), duração (seg→mm:ss),
 *              data (ISO→pt-BR), ícone de documento por tipo MIME.
 *              Também inclui as funções de navegação e renderização de seções,
 *              ações globais (toggle share, delete, filter) e upload handlers.
 * @module Módulo 06: UI — Painel (Helpers + Navegação + Ações)
 * @author Pesquisador-Arquiteto SSOT
 * @date 21/03/2026
 */

// ═══ HELPERS ═════════════════════════════════════════════════
function fmtSize(b) { return b < 1024 ? b+' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
function fmtDur(s) { return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('pt-BR'); }
function docIcon(t) {
  if (!t) return '📄';
  if (t.includes('pdf')) return '📕'; if (t.includes('word')||t.includes('doc')) return '📘';
  if (t.includes('sheet')||t.includes('excel')||t.includes('csv')) return '📗'; return '📄';
}

// ═══ NAVIGATION ══════════════════════════════════════════════
function navigate(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (active) active.classList.add('active');

  const titles = {
    dashboard: 'Dashboard', audios: 'Biblioteca de Áudios', documentos: 'Documentos',
    midias: 'Mídias', templates: 'Templates de Texto', crm: 'CRM / Funil',
    agendamentos: 'Calendário de Envios', automacoes: 'Automações Clássicas', flow: 'Automação Visual (Flow)', campanhas: 'Campanhas de Envio', admin: 'Gestão da Equipe', config: 'Configurações'
  };
  const title = titles[section] || section;
  document.getElementById('page-title').textContent = title;
  const bc = document.getElementById('breadcrumb-section');
  if (bc) bc.textContent = title;
  document.getElementById('header-actions').innerHTML = '';
  renderSection(section);
}

function renderSection(section) {
  const c = document.getElementById('main-content');
  c.scrollTop = 0;
  switch(section) {
    case 'dashboard': return renderDashboard(c);
    case 'audios': return renderAudios(c);
    case 'documentos': return renderDocumentos(c);
    case 'midias': return renderMidias(c);
    case 'templates': return renderTemplates(c);
    case 'crm': return renderCRM(c);
    case 'automacoes': return renderAutomacoes(c);
    case 'agendamentos': return renderAgendamentos(c);
    case 'flow': return renderFlow(c);
    case 'campanhas': return renderCampanhas(c);
    case 'admin': return renderAdmin(c);
    default: c.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div><h3>Em desenvolvimento</h3><p>Esta seção estará disponível em breve.</p></div>`;
  }
}

// ═══ ACTIONS ═════════════════════════════════════════════════
async function toggleShare(table, id, val) {
  try {
    await UpsidenDB.from(table).update({ compartilhado: val }).eq('id', id);
    const arr = painelData[table]; const item = arr.find(i => i.id === id);
    if (item) item.compartilhado = val;
    toast(val ? 'Compartilhado com o time' : 'Removido do compartilhamento', 'success');
  } catch(e) { toast('Erro ao alterar compartilhamento', 'error'); }
}

async function deleteItem(table, id) {
  if (!confirm('Tem certeza que deseja excluir?')) return;
  try {
    const item = painelData[table].find(i => i.id === id);
    if (item?.storage_path) await UpsidenStorage.remove(table, [item.storage_path]).catch(()=>{});
    await UpsidenDB.from(table).delete().eq('id', id);
    painelData[table] = painelData[table].filter(i => i.id !== id);
    renderSection(currentSection);
    toast('Item excluído', 'success');
  } catch(e) { toast('Erro ao excluir', 'error'); }
}

function filterTable(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.data-table tbody tr').forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(q) ? '' : 'none';
  });
}

// ═══ UPLOAD HANDLERS ═════════════════════════════════════════
async function handleAudioUpload(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  toast(`Importando ${files.length} áudio(s)...`, 'info');
  for (const file of files) {
    try {
      const ab = await file.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ctx.decodeAudioData(ab.slice(0)); const dur = buf.duration; await ctx.close();
      const path = `${userData.userId}/${Date.now()}_${file.name}`;
      await UpsidenStorage.upload('audios', path, file, file.type);
      const res = await UpsidenDB.from('audios').insert({ nome: file.name.replace(/\.[^/.]+$/,''), nome_original: file.name, tipo_mime: file.type||'audio/mpeg', duracao: dur, tamanho: file.size, storage_path: path, criado_por: userData.userId, compartilhado: userData.isAdmin, favorito: false }).select();
      if (res?.length) painelData.audios.unshift(res[0]);
    } catch(err) { console.error(P, err); toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('audios'); toast(`${files.length} áudio(s) importado(s)!`, 'success'); e.target.value = '';
}

async function handleDocUpload(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  for (const file of files) {
    try {
      const path = `${userData.userId}/${Date.now()}_${file.name}`;
      await UpsidenStorage.upload('documentos', path, file, file.type);
      const res = await UpsidenDB.from('documentos').insert({ nome: file.name, tipo: file.type, tamanho: file.size, storage_path: path, criado_por: userData.userId, compartilhado: userData.isAdmin }).select();
      if (res?.length) painelData.documentos.unshift(res[0]);
    } catch(err) { toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('documentos'); toast('Documentos enviados!', 'success'); e.target.value = '';
}

async function handleMediaUpload(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  for (const file of files) {
    try {
      const path = `${userData.userId}/${Date.now()}_${file.name}`;
      await UpsidenStorage.upload('midias', path, file, file.type);
      const res = await UpsidenDB.from('midias').insert({ nome: file.name, tipo: file.type, tamanho: file.size, storage_path: path, criado_por: userData.userId, compartilhado: userData.isAdmin }).select();
      if (res?.length) painelData.midias.unshift(res[0]);
    } catch(err) { toast(`Erro: ${file.name}`, 'error'); }
  }
  renderSection('midias'); toast('Mídias enviadas!', 'success'); e.target.value = '';
}

// Sub-tab switchers
window.switchTab = function(tab) { window.autoSubTab = tab; renderSection('automacoes'); };
window.switchCampTab = function(tab) { window.campSubTab = tab; renderSection('campanhas'); };
