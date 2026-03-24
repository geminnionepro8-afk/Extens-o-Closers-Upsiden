/**
 * @file painel-dashboard.js
 * @description Renderiza a seção Dashboard do Painel Upsiden com Métricas Completas.
 * @module Módulo 06: UI — Painel (Dashboard)
 * @date 21/03/2026
 */

let dashboardChartInstance = null;
let currentDashboardData = null;

async function renderDashboard(c) {
  const nome = userData.nome || 'Closer';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // Mostrar loading state
  c.innerHTML = `
    <div class="dash-welcome animate-in"><h2>${saudacao}, ${nome}! 👋</h2></div>
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      <div class="spinner" style="margin: 0 auto 10px;"></div>
      Carregando suas métricas...
    </div>
  `;

  try {
    const data = await UpsidenMetrics.getDashboardData('7d');
    currentDashboardData = data;
    
    const iconMsg = `<svg viewBox="0 0 24 24" fill="none" class="dash-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    const iconAudio = `<svg viewBox="0 0 24 24" fill="none" class="dash-icon"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    const iconLead = `<svg viewBox="0 0 24 24" fill="none" class="dash-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
    const iconRate = `<svg viewBox="0 0 24 24" fill="none" class="dash-icon"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>`;

    const statsCards = `
      <div class="stat-card animate-in" style="animation-delay:0ms">
        <div class="stat-card-top"><div class="stat-icon" style="color:#00e676">${iconMsg}</div></div>
        <div class="stat-value">${data.summary.msgs}</div>
        <div class="stat-label">Mensagens Enviadas</div>
      </div>
      <div class="stat-card animate-in" style="animation-delay:50ms">
        <div class="stat-card-top"><div class="stat-icon" style="color:#ff9100">${iconAudio}</div></div>
        <div class="stat-value">${data.summary.audios}</div>
        <div class="stat-label">Áudios & Docs</div>
      </div>
      <div class="stat-card animate-in" style="animation-delay:100ms">
        <div class="stat-card-top"><div class="stat-icon" style="color:#2196f3">${iconLead}</div></div>
        <div class="stat-value">${data.summary.leads}</div>
        <div class="stat-label">Novos Leads (7d)</div>
      </div>
      <div class="stat-card animate-in" style="animation-delay:150ms">
        <div class="stat-card-top"><div class="stat-icon" style="color:#e91e63">${iconRate}</div></div>
        <div class="stat-value">${data.conversionRate}%</div>
        <div class="stat-label">Taxa de Conversão</div>
      </div>
    `;

    const rankingRows = data.ranking.length > 0 ? data.ranking.map((r, i) => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
        <td style="padding: 12px; font-weight: 500;">
          ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1)}
        </td>
        <td style="padding: 12px; display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; background:var(--accent-dim); color:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">
            ${r.nome.charAt(0).toUpperCase()}
          </div>
          ${r.nome}
        </td>
        <td style="padding: 12px; text-align: center;">${r.msgs}</td>
        <td style="padding: 12px; text-align: center;">${r.leads}</td>
        <td style="padding: 12px; text-align: right; color: var(--text-muted);">${r.avgReplyStr}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Nenhum dado registrado ainda.</td></tr>`;

    c.innerHTML = `
      <style>
        .dash-icon { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .chart-box { background: rgba(20, 20, 25, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); backdrop-filter: blur(10px); }
        .ranking-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .ranking-table th { text-align: left; padding: 12px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .dash-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .export-btn { background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent-glow); padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 13px; transition: all 0.2s; }
        .export-btn:hover { background: var(--accent); color: #fff; transform: translateY(-1px); }
      </style>

      <div class="dash-welcome animate-in">
        <div class="dash-header-flex">
          <div>
            <h2>${saudacao}, ${nome}! 👋</h2>
            <p>Seu panorama de performance e engajamento da equipe.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="export-btn" id="btn-export-csv" title="Baixar CSV">
              <svg viewBox="0 0 24 24" fill="none" class="dash-icon" style="width:14px;height:14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </button>
            <button class="export-btn" id="btn-export-pdf" title="Baixar PDF">
              <svg viewBox="0 0 24 24" fill="none" class="dash-icon" style="width:14px;height:14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      <div class="stat-grid" style="margin-bottom:24px;">${statsCards}</div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">
        <div class="chart-box animate-in" style="animation-delay: 200ms">
          <h3 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">Atividade (Últimos Dias)</h3>
          <canvas id="activityChart" style="width:100%; height:250px;"></canvas>
        </div>

        <div class="chart-box animate-in" style="animation-delay: 250ms">
          <h3 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">Taxa de Conversão</h3>
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:250px;">
            <div style="position:relative; width: 120px; height: 120px;">
              <canvas id="conversionChart"></canvas>
              <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold; color:var(--text-primary);">
                ${data.conversionRate}%
              </div>
            </div>
            <p style="margin-top:16px; color:var(--text-muted); font-size:13px; text-align:center;">
              Dos ${data.summary.leads} leads novos, ${Math.floor((data.conversionRate/100)*data.summary.leads)} avançaram no funil.
            </p>
          </div>
        </div>
      </div>

      <div class="chart-box animate-in" style="animation-delay: 300ms">
        <h3 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">Ranking de Closers & TMR</h3>
        <div style="overflow-x: auto;">
          <table class="ranking-table" id="ranking-table">
            <thead>
              <tr>
                <th style="width: 50px;">Rank</th>
                <th>Nome</th>
                <th style="text-align: center;">Interações C/ Cliente</th>
                <th style="text-align: center;">Leads Atendidos</th>
                <th style="text-align: right;">Tempo Médio (TMR)</th>
              </tr>
            </thead>
            <tbody>
              ${rankingRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Render Charts
    setTimeout(() => {
      if (window.Chart) {
        Chart.defaults.color = 'rgba(255,255,255,0.6)';
        Chart.defaults.font.family = "'Inter', sans-serif";

        const ctxActivity = document.getElementById('activityChart');
        if (ctxActivity) {
          if (dashboardChartInstance) dashboardChartInstance.destroy();
          dashboardChartInstance = new Chart(ctxActivity, {
            type: 'line',
            data: {
              labels: data.chartData.map(d => {
                const parts = d.date.split('-');
                return parts[2] + '/' + parts[1];
              }),
              datasets: [{
                label: 'Mensagens/Interações',
                data: data.chartData.map(d => d.msgs),
                borderColor: '#00e676',
                backgroundColor: 'rgba(0, 230, 118, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#00e676'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
              }
            }
          });
        }

        const ctxConv = document.getElementById('conversionChart');
        if (ctxConv) {
          new Chart(ctxConv, {
            type: 'doughnut',
            data: {
              labels: ['Convertidos', 'Pendentes'],
              datasets: [{
                data: [data.conversionRate, 100 - data.conversionRate],
                backgroundColor: ['#e91e63', 'rgba(255,255,255,0.05)'],
                borderWidth: 0,
                hoverOffset: 2
              }]
            },
            options: {
              responsive: true,
              cutout: '80%',
              plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
          });
        }
      }
    }, 100);

    // Bind export events
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportDashboardCSV(data));
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => exportDashboardPDF(data, nome));

  } catch (error) {
    console.error('Erro dashboard:', error);
    c.innerHTML = `<div style="padding:40px;text-align:center;color:red;">Falha ao carregar dashboard.</div>`;
  }
}

function exportDashboardCSV(data) {
  let csv = 'Rank,Nome do Closer,Mensagens Enviadas,Leads Atendidos,Tempo Medio de Resposta\n';
  data.ranking.forEach((r, i) => {
    csv += `${i+1},${r.nome},${r.msgs},${r.leads},${r.avgReplyStr}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `upsiden_relatorio_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  showToast('sucesso', 'Download CSV iniciado.');
}

function exportDashboardPDF(data, userNome) {
  if (!window.jspdf) {
    showToast('erro', 'Biblioteca PDF não carregada.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Relatorio Analytics - Upsiden Closers', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Gerado por: ${userNome} em ${new Date().toLocaleDateString()}`, 14, 30);
  
  doc.text(`Totais do Periodo: ${data.summary.msgs} msgs | ${data.summary.leads} leads | Taxa Conversao: ${data.conversionRate}%`, 14, 40);

  const tableData = data.ranking.map((r, i) => [
    (i+1).toString(),
    r.nome,
    r.msgs.toString(),
    r.leads.toString(),
    r.avgReplyStr
  ]);

  if (doc.autoTable) {
    doc.autoTable({
      startY: 45,
      head: [['Rank', 'Closer', 'Msgs', 'Leads', 'TMR']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 98, 0] } // Accent color
    });
  } else {
    doc.text('Autotable plugin não encontrado. Erro de render.', 14, 50);
  }

  doc.save(`upsiden_relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
  showToast('sucesso', 'Download PDF iniciado.');
}

