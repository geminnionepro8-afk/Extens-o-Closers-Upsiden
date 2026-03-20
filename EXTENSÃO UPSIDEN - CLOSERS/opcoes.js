/* ==============================
   Upsiden — Painel de Controle (Supabase)
   ============================== */

class PainelGerenciador {
  static async inicializar() {
    if (!(await verificarAuth())) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#8696a0;font-family:sans-serif;"><p>Faça login para acessar o painel.</p></div>';
      return;
    }

    await PainelGerenciador.carregarEstatisticas();
    await PainelGerenciador.carregarPerfil();
    PainelGerenciador.registrarEventos();
  }

  static async carregarPerfil() {
    const profile = await UpsidenAuth.getProfile();
    if (profile) {
      const perfilEl = document.getElementById('perfil-info');
      if (perfilEl) {
        perfilEl.innerHTML = `
          <p><strong>Nome:</strong> ${profile.nome}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Tipo:</strong> ${profile.role === 'admin' ? '👑 Presidente (Administrador)' : '👤 Closer'}</p>
        `;
      }
      
      // Mostrar seção Admin se for admin
      if (profile.role === 'admin') {
        const adminSec = document.getElementById('admin-section');
        if (adminSec) adminSec.style.display = 'block';
      }
    }
  }

  static async carregarEstatisticas() {
    try {
      const audios = await UpsidenDB.from('audios').select('id,tamanho').execute();
      const pastas = await UpsidenDB.from('pastas_audio').select('id').execute();

      document.getElementById('stat-audios').textContent = audios ? audios.length : 0;
      document.getElementById('stat-pastas').textContent = pastas ? pastas.length : 0;

      let totalBytes = 0;
      if (audios) audios.forEach(a => { totalBytes += a.tamanho || 0; });
      const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);
      document.getElementById('stat-tamanho').textContent = `${sizeMb} MB`;

      // Metrics
      const metricas = await UpsidenDB.from('metricas_envio').select('id').execute();
      const metricEl = document.getElementById('stat-envios');
      if (metricEl) metricEl.textContent = metricas ? metricas.length : 0;
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }

  static async exportarBackup() {
    try {
      PainelGerenciador.mostrarToast('Gerando backup do Supabase...');
      const audios = await UpsidenDB.from('audios').select('*').execute();
      const pastas = await UpsidenDB.from('pastas_audio').select('*').execute();
      const templates = await UpsidenDB.from('templates').select('*').execute();
      const leads = await UpsidenDB.from('leads').select('*').execute();
      const gatilhos = await UpsidenDB.from('gatilhos').select('*').execute();

      const backup = {
        app: 'Upsiden',
        version: '3.0',
        timestamp: Date.now(),
        source: 'supabase',
        data: { audios, pastas, templates, leads, gatilhos }
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_upsiden_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      PainelGerenciador.mostrarToast('Backup exportado com sucesso!');
    } catch (e) {
      console.error(e);
      PainelGerenciador.mostrarToast('Erro ao exportar backup', true);
    }
  }

  static mostrarToast(mensagem, erro = false) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${erro ? 'error' : ''} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  static registrarEventos() {
    document.getElementById('btn-exportar').addEventListener('click', PainelGerenciador.exportarBackup);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        await UpsidenAuth.signOut();
        PainelGerenciador.mostrarToast('Desconectado com sucesso');
        setTimeout(() => window.location.reload(), 1000);
      });
    }

    // Eventos Admin
    const btnAdminClosers = document.getElementById('btn-admin-closers');
    if (btnAdminClosers) btnAdminClosers.addEventListener('click', PainelGerenciador.listarEquipe);

    const btnAdminAudios = document.getElementById('btn-admin-audios');
    if (btnAdminAudios) btnAdminAudios.addEventListener('click', PainelGerenciador.listarAuditoria);
  }

  static async listarEquipe() {
    const list = document.getElementById('admin-list');
    const viewer = document.getElementById('admin-viewer');
    document.getElementById('admin-viewer-title').textContent = 'Equipe (Closers)';
    viewer.style.display = 'block';
    list.innerHTML = '<p style="color:#8696a0; font-size:13px; text-align:center;">Carregando equipe...</p>';

    try {
      const profiles = await UpsidenDB.from('profiles').select('*').order('created_at', false).execute();
      if (!profiles || profiles.length === 0) {
        list.innerHTML = '<p style="color:#8696a0; font-size:13px; text-align:center;">Nenhum usuário encontrado.</p>';
        return;
      }
      list.innerHTML = '';
      profiles.forEach(p => {
        list.innerHTML += `
          <div class="admin-item">
            <div class="admin-item-info">
              <span class="admin-item-title">${p.nome || (p.email ? p.email.split('@')[0] : 'Desconhecido')} <span class="admin-item-tag">${p.role === 'admin' ? 'PRESIDENTE' : 'CLOSER'}</span></span>
              <span class="admin-item-sub">${p.email || '—'}</span>
            </div>
            <button class="btn btn-secondary" style="padding:6px 10px; font-size:11px;" onclick="PainelGerenciador.bloquearUser('${p.id}')">Gerenciar</button>
          </div>
        `;
      });
    } catch (e) {
      PainelGerenciador.mostrarToast('Erro ao carregar equipe. Permissão negada.', true);
      list.innerHTML = '';
    }
  }

  static async listarAuditoria() {
    const list = document.getElementById('admin-list');
    const viewer = document.getElementById('admin-viewer');
    document.getElementById('admin-viewer-title').textContent = 'Auditoria Geral de Áudios';
    viewer.style.display = 'block';
    list.innerHTML = '<p style="color:#8696a0; font-size:13px; text-align:center;">Carregando áudios globais...</p>';

    try {
      // Admin pode ver todos os áudios ou vamos simular uma contagem global se for muito verboso
      const audios = await UpsidenDB.from('audios').select('id,nome_exibicao,nome_storage,closer_id,compartilhado,tamanho,duracao').order('created_at', false).limit(50).execute();
      if (!audios || audios.length === 0) {
        list.innerHTML = '<p style="color:#8696a0; font-size:13px; text-align:center;">Nenhum áudio encontrado.</p>';
        return;
      }
      list.innerHTML = '<p style="font-size:11px; color:#8696a0; margin-bottom:8px;">Últimos 50 áudios adicionados na agência:</p>';
      audios.forEach(a => {
        list.innerHTML += `
          <div class="admin-item">
            <div class="admin-item-info">
              <span class="admin-item-title">${a.nome_exibicao} ${a.compartilhado ? '<span class="admin-item-tag" style="background:rgba(52,211,153,0.15);color:#34d399;">PÚBLICO</span>' : ''}</span>
              <span class="admin-item-sub">MB: ${(a.tamanho/1024/1024).toFixed(2)} | Dur: ${Math.floor(a.duracao/60)}:${('0'+Math.floor(a.duracao%60)).slice(-2)} | Closer: ${a.closer_id?.substring(0,8)}...</span>
            </div>
          </div>
        `;
      });
    } catch (e) {
      PainelGerenciador.mostrarToast('Erro ao carregar auditoria. Permissão negada.', true);
      list.innerHTML = '';
    }
  }

  // Apenas stub para ação de bloquear
  static bloquearUser(id) {
    alert("Função de gerenciar permissões (Super admin). Closer ID: " + id);
  }
}

document.addEventListener('DOMContentLoaded', PainelGerenciador.inicializar);
