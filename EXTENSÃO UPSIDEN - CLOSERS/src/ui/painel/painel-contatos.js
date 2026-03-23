/**
 * @file painel-contatos.js
 * @description Módulo visual para Gestão de Contatos da Extensão Upsiden.
 *              Inclui funcionalidades: 
 *              1) Abrir chat com número não salvo.
 *              2) Extração de membros de grupos para CSV.
 *              3) Importação de contatos em massa (CSV) para o CRM/Campanhas.
 * @module Módulo 06: UI — Gestão de Contatos
 * @author Pesquisador/Arquiteto SSOT
 * @date 21/03/2026
 */

function renderContatos(c) {
  let html = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div class="dash-welcome animate-in">
        <h2>Gestão Especial de Contatos 📇</h2>
        <p>Inicie conversas sem salvar números, extraia clientes de grupos ou importe listas para envio em massa.</p>
      </div>
      <button class="btn btn-secondary" data-click="navigate('crm')" style="margin-top:20px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Voltar para o Funil
      </button>
    </div>

    <div class="contact-tools-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 24px;">
      
      <!-- CARD 1: Conversar sem salvar -->
      <div class="action-card animate-in" style="background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div class="icon-wrap" style="background: rgba(0, 230, 118, 0.1); color: var(--success); padding: 10px; border-radius: 8px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 style="margin: 0;">Conversa Rápida</h3>
        </div>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Abra uma conversa com qualquer número no WhatsApp sem precisar adicioná-lo à agenda do seu celular.</p>
        
        <div class="form-group">
          <label class="form-label">Número de Telefone (com DDI)</label>
          <input type="text" id="input-chat-unsaved" class="form-input" placeholder="Ex: 5531999999999">
        </div>
        <button class="btn btn-primary" style="width: 100%; justify-content: center;" data-click="abrirChatNaoSalvo()">Abrir Conversa</button>
      </div>

      <!-- CARD 2: Extrator de Grupos -->
      <div class="action-card animate-in" style="animation-delay: 50ms; background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div class="icon-wrap" style="background: rgba(255, 98, 0, 0.1); color: var(--accent); padding: 10px; border-radius: 8px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h3 style="margin: 0;">Extrator de Grupos</h3>
        </div>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Extraia o Nome e o Número de todos os participantes de grupos que você faz parte e salve em Excel/CSV.</p>
        
        <button id="btn-carregar-grupos" class="btn btn-secondary" style="width: 100%; justify-content: center;" data-click="carregarGruposParaExtracao()">
          1. Carregar Meus Grupos
        </button>
        <div id="extrator-selectors" style="display: none; margin-top: 16px;">
          <div class="form-group">
            <select id="select-grupos-extrator" class="form-input" style="appearance: auto;">
              <option value="">Selecione um grupo...</option>
            </select>
          </div>
          <button id="btn-extrair-agora" class="btn btn-primary" style="width: 100%; justify-content: center;" data-click="extrairMembrosGrupo()">
            2. Extrair e Baixar CSV
          </button>
        </div>
      </div>

      <!-- CARD 3: Importador de CSV -->
      <div class="action-card animate-in" style="animation-delay: 100ms; background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border);">
         <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div class="icon-wrap" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 10px; border-radius: 8px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <h3 style="margin: 0;">Importar via CSV</h3>
        </div>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Carregue uma lista de contatos em formato CSV (Nome, Telefone) para adicionar automaticamente ao CRM.</p>
        
        <label class="btn btn-secondary" style="width: 100%; justify-content: center; cursor: pointer;">
           Selecionar Arquivo CSV
           <input type="file" id="import-csv-leads" accept=".csv" style="display: none;">
        </label>
        <div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); background: var(--surface-hover); padding: 8px; border-radius: 6px;">
           <strong>Instruções:</strong> O arquivo deve ter uma coluna "telefone" e opcionalmente "nome".
        </div>
      </div>

      <!-- CARD 4: Extrator CRM -->
      <div class="action-card animate-in" style="animation-delay: 150ms; background: var(--surface); padding: 24px; border-radius: 12px; border: 1px solid var(--border);">
         <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div class="icon-wrap" style="background: rgba(121, 59, 246, 0.1); color: var(--accent-glow); padding: 10px; border-radius: 8px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#793bf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </div>
          <h3 style="margin: 0;">Extrator do CRM</h3>
        </div>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Filtre seus leads do painel e baixe uma lista limpa (CSV) para campanhas.</p>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
            <div class="form-group">
               <label class="form-label">Por Etapa</label>
               <select id="ext-crm-etapa" class="form-input" style="appearance: auto;">
                  <option value="*">Todas as etapas</option>
                  ${(typeof dynamicStages !== 'undefined' ? dynamicStages : []).map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
               </select>
            </div>
            <div class="form-group">
               <label class="form-label">Por Tag</label>
               <select id="ext-crm-tag" class="form-input" style="appearance: auto;">
                  <option value="*">Todas as tags</option>
                  ${Object.keys(typeof dynamicTags !== 'undefined' ? dynamicTags : {}).map(k=>`<option value="${k}">${k}</option>`).join('')}
               </select>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
            <div class="form-group">
               <label class="form-label">Limite máx (Qtd)</label>
               <input type="number" id="ext-crm-limit" class="form-input" placeholder="Ex: 100">
            </div>
            <div class="form-group">
               <label class="form-label">Valor Mínimo (R$)</label>
               <input type="number" id="ext-crm-valor-min" class="form-input" placeholder="Ex: 50">
            </div>
        </div>

        <button class="btn btn-primary" style="width: 100%; justify-content: center; background: #793bf6; border-color: #793bf6;" data-click="extrairDoCRM()">
          Baixar Lista do CRM (.csv)
        </button>
      </div>

    </div>
  `;
  c.innerHTML = html;
  
  // Attach Event Listener dynamically because inline onchange is forbidden by CSP
  document.getElementById('import-csv-leads')?.addEventListener('change', importarLeadsCsv);
}

// ── 1. ABRIR CHAT NÃO SALVO ──────────────────────────────────────────────────
function abrirChatNaoSalvo() {
  const input = document.getElementById('input-chat-unsaved');
  const numero = input.value.replace(/\D/g, ''); // Limpa tudo que não for número

  if (!numero || numero.length < 10) {
    toast('Digite um número de telefone válido com DDI (Ex: 55319...)', 'warning');
    return;
  }

  // Enviar comando para o WPP Engine abrir o chat
  chrome.runtime.sendMessage({ tipo: 'open_chat_unsaved', dados: { telefone: numero } }, (res) => {
    if (res && res.sucesso) {
      toast('Chat aberto no fundo!', 'success');
      input.value = ''; // limpa
    } else {
      toast('Falha ao abrir chat. O WhatsApp está pronto?', 'error');
    }
  });
}

// ── 2. EXTRATOR DE GRUPOS ────────────────────────────────────────────────────
function carregarGruposParaExtracao() {
  const btn = document.getElementById('btn-carregar-grupos');
  btn.disabled = true;
  btn.textContent = 'Carregando...';

  chrome.runtime.sendMessage({ tipo: 'get_groups' }, (res) => {
    btn.disabled = false;
    btn.textContent = 'Atualizar Lista de Grupos';

    if (res && res.sucesso && res.grupos) {
      const select = document.getElementById('select-grupos-extrator');
      select.innerHTML = '<option value="">Selecione um grupo...</option>';
      
      res.grupos.forEach(g => {
         const opt = document.createElement('option');
         opt.value = g.id;
         opt.textContent = g.nome;
         select.appendChild(opt);
      });
      
      document.getElementById('extrator-selectors').style.display = 'block';
      toast(`${res.grupos.length} grupos carregados!`, 'success');
    } else {
      toast('Falha ao obter listas de grupos.', 'error');
    }
  });
}

function extrairMembrosGrupo() {
  const btn = document.getElementById('btn-extrair-agora');
  const groupId = document.getElementById('select-grupos-extrator').value;
  if (!groupId) {
    toast('Selecione um grupo primeiro!', 'warning');
    return;
  }

  const grupoNome = document.getElementById('select-grupos-extrator').options[document.getElementById('select-grupos-extrator').selectedIndex].text;

  btn.disabled = true;
  btn.textContent = 'Extraindo contatos... aguarde!';

  chrome.runtime.sendMessage({ tipo: 'extract_group_members', dados: { groupId } }, (res) => {
    btn.disabled = false;
    btn.textContent = '2. Extrair e Baixar CSV';

    if (res && res.sucesso && res.membros) {
       toast(`${res.membros.length} membros extraídos! Iniciando download...`, 'success');
       baixarCsvExtrator(grupoNome, res.membros);
    } else {
       toast('Falha ao extrair membros.', 'error');
    }
  });
}

function baixarCsvExtrator(nomeGrupo, membros) {
  // Criação do conteúdo CSV
  let csvContent = "Nome,Telefone,Admin\n";
  
  membros.forEach(m => {
    const nome = (m.nome || '').replace(/,/g, ''); // limpar vírgulas que quebram o CSV
    const tel = m.telefone || '';
    const isAdmin = m.isAdmin ? 'Sim' : 'Nao';
    csvContent += `"${nome}","${tel}","${isAdmin}"\n`;
  });

  // Blob e Download
  const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para acentos Excel
  const link = document.createElement("a");
  const defaultNome = nomeGrupo.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Upsiden_Extrator_${defaultNome}_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── 3. IMPORTAR LEADS VIA CSV ────────────────────────────────────────────────
function importarLeadsCsv(evento) {
  const file = evento.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) {
      toast('O arquivo parece estar vazio ou não tem cabeçalho.', 'error');
      return;
    }

    // Identificar colunas baseadas na primeira linha
    const headers = lines[0].toLowerCase().split(/,|;/);
    let nameIdx = -1;
    let telIdx = -1;

    headers.forEach((h, i) => {
      if (h.includes('nome') || h.includes('name')) nameIdx = i;
      if (h.includes('tel') || h.includes('phone') || h.includes('celular') || h.includes('numero')) telIdx = i;
    });

    if (telIdx === -1) {
      toast('O CSV não possui uma coluna identificável para "telefone" (Nome da coluna deve conter tel, phone ou celular)', 'error');
      return;
    }

    let sucessos = 0;
    toast(`Iniciando importação de ${lines.length - 1} contatos...`, 'info');

    // Processamento linha a linha (Bypass limite bulk inserts simples se precisarmos ver progresso)
    const novosLeads = [];
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(/,|;/).map(c => c.replace(/^["']|["']$/g, '').trim()); // remove aspas
        
        const nome = nameIdx !== -1 ? (columns[nameIdx] || 'Lead Sem Nome') : 'Lead CSV';
        const telefoneRAW = columns[telIdx] || '';
        const telefoneStr = telefoneRAW.replace(/[^+0-9]/g, ''); // Somente sinal ddi e numeros

        if (telefoneStr.length > 7) {
            novosLeads.push({
               nome: nome,
               telefone: telefoneStr,
               etapa: typeof dynamicStages !== 'undefined' && dynamicStages.length > 0 ? dynamicStages[0].id : 'prospeccao'
            });
            sucessos++;
        }
    }

    if (novosLeads.length > 0) {
        try {
           const res = await UpsidenDB.from('leads').insert(novosLeads).select().execute();
           if (res && res.length) {
              // Empurra no cache visual do painel
              painelData.leads = [...res.reverse(), ...painelData.leads];
           }
           toast(`✅ ${sucessos} contatos importados para o CRM!`, 'success');
           if (typeof renderSection === 'function') renderSection('contatos');
        } catch (e) {
           toast(`Erro ao inserir no Banco de Dados: ${e.message}`, 'error');
        }
    } else {
        toast('Nenhum número válido foi encontrado no CSV.', 'warning');
    }

    // Reset input
    evento.target.value = '';
  };
  
  reader.onerror = function() {
    toast('Erro ao ler o arquivo.', 'error');
  };

  reader.readAsText(file);
}

// ── 4. EXTRATOR DO CRM ───────────────────────────────────────────────────────
function extrairDoCRM() {
    const etapa = document.getElementById('ext-crm-etapa').value;
    const tag = document.getElementById('ext-crm-tag').value;
    const limitInput = parseInt(document.getElementById('ext-crm-limit').value);
    const limit = isNaN(limitInput) ? 999999 : limitInput;
    const valMinimo = parseFloat(document.getElementById('ext-crm-valor-min').value) || 0;

    // Filter leads directly from memory (painelData.leads)
    let filtrados = (typeof painelData !== 'undefined' && painelData.leads ? painelData.leads : []).filter(lead => {
        // Filtrar por Etapa
        if (etapa !== '*' && (lead.etapa !== etapa && lead.estagio !== etapa)) return false;
        
        // Filtrar por Tag
        if (tag !== '*') {
            if (!lead.tag) return false;
            // lead.tag can be string or array
            if (Array.isArray(lead.tag)) {
                if (!lead.tag.includes(tag)) return false;
            } else {
                if (lead.tag !== tag) return false;
            }
        }

        // Filtrar por Valor
        let v = parseFloat(lead.valor) || 0;
        if (v < valMinimo) return false;

        return true;
    });

    if (filtrados.length === 0) {
        toast('Nenhum lead encontrado com esses filtros no CRM.', 'warning');
        return;
    }

    if (limit < filtrados.length) {
        filtrados = filtrados.slice(0, limit);
    }

    // Gerar e Baixar CSV compatível com Upload Upsiden
    let csvContent = "Nome,Telefone,Etapa,Valor,Tag,Notas\n";
    filtrados.forEach(m => {
        const nome = (m.nome || 'Sem Nome').replace(/,/g, '');
        const tel = m.telefone || '';
        const etp = m.etapa || m.estagio || '';
        const v = m.valor || 0;
        const tg = Array.isArray(m.tag) ? m.tag.join(';') : (m.tag || '');
        let ns = (m.notas || '').replace(/,/g, ';').replace(/\r?\n/g, ' '); 
        csvContent += `"${nome}","${tel}","${etp}","${v}","${tg}","${ns}"\n`;
    });

    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    
    link.href = URL.createObjectURL(blob);
    link.download = `Upsiden_CRM_${timestamp}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast(`✅ ${filtrados.length} leads do CRM exportados com sucesso!`, 'success');
}

// Expõe para event delegation global, se necessário, mas os botões estão com onclick direto
window.renderContatos = renderContatos;
window.abrirChatNaoSalvo = abrirChatNaoSalvo;
window.carregarGruposParaExtracao = carregarGruposParaExtracao;
window.extrairMembrosGrupo = extrairMembrosGrupo;
window.importarLeadsCsv = importarLeadsCsv;
window.extrairDoCRM = extrairDoCRM;
