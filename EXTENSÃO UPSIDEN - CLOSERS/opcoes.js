/* ==============================
   Upsiden — Lógica do Painel de Controle (Backup)
   ============================== */

class PainelGerenciador {
  static async inicializar() {
    await PainelGerenciador.carregarEstatisticas();
    PainelGerenciador.registrarEventos();
  }

  static async carregarEstatisticas() {
    const data = await chrome.storage.local.get({ upsiden_audios: [], upsiden_pastas: [] });
    const audios = data.upsiden_audios;
    const pastas = data.upsiden_pastas;

    document.getElementById('stat-audios').textContent = audios.length;
    document.getElementById('stat-pastas').textContent = pastas.length;

    // Calcular tamanho estimado
    let totalBytes = 0;
    audios.forEach(a => {
      totalBytes += a.tamanho || (a.base64 ? Math.round(a.base64.length * 0.75) : 0);
    });
    
    const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);
    document.getElementById('stat-tamanho').textContent = `${sizeMb} MB`;
  }

  static async exportarBackup() {
    try {
      PainelGerenciador.mostrarToast('Gerando arquivo de backup...');
      const data = await chrome.storage.local.get({ upsiden_audios: [], upsiden_pastas: [] });
      
      const backup = {
        app: 'Upsiden',
        version: '1.0',
        timestamp: Date.now(),
        data: data
      };

      const json = JSON.stringify(backup);
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

  static importarBackup(arquivo) {
    if (!arquivo) return;
    
    PainelGerenciador.mostrarToast('Lendo arquivo...');
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const conteudo = JSON.parse(e.target.result);
        if (conteudo.app !== 'Upsiden' && !conteudo.data?.upsiden_audios) {
          throw new Error('Formato inválido');
        }

        // Recuperar audios e pastas existentes para mesclar (evitar perda) ou apenas substituir tudo?
        // Como é backup de segurança, o ideal é sobrescrever ou mesclar. Vamos Mesclar verificando IDs.
        
        const localData = await chrome.storage.local.get({ upsiden_audios: [], upsiden_pastas: [] });
        
        const importedAudios = conteudo.data.upsiden_audios || [];
        const importedPastas = conteudo.data.upsiden_pastas || [];

        // Simple merge by ID
        const mapAudios = new Map(localData.upsiden_audios.map(a => [a.id, a]));
        importedAudios.forEach(a => mapAudios.set(a.id, a));

        const mapPastas = new Map(localData.upsiden_pastas.map(p => [p.id, p]));
        importedPastas.forEach(p => mapPastas.set(p.id, p));

        await chrome.storage.local.set({
          upsiden_audios: Array.from(mapAudios.values()),
          upsiden_pastas: Array.from(mapPastas.values())
        });

        await PainelGerenciador.carregarEstatisticas();
        PainelGerenciador.mostrarToast(`${importedAudios.length} áudios restaurados com sucesso!`);
        
      } catch (err) {
        console.error(err);
        PainelGerenciador.mostrarToast('Arquivo corrompido ou inválido', true);
      }
    };
    reader.readAsText(arquivo);
  }

  static async apagarTudo() {
    const confirmacao = confirm("⚠️ ATENÇÃO: Isso vai excluir todos os seus áudios e pastas definitivamente.\n\nTem certeza absoluta?");
    if (confirmacao) {
      await chrome.storage.local.set({ upsiden_audios: [], upsiden_pastas: [] });
      await PainelGerenciador.carregarEstatisticas();
      PainelGerenciador.mostrarToast('Biblioteca inteira foi apagada.');
    }
  }

  static mostrarToast(mensagem, erro = false) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${erro ? 'error' : ''} show`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  static registrarEventos() {
    document.getElementById('btn-exportar').addEventListener('click', PainelGerenciador.exportarBackup);
    
    document.getElementById('btn-importar-click').addEventListener('click', () => {
      document.getElementById('input-importar').click();
    });
    
    document.getElementById('input-importar').addEventListener('change', (e) => {
      PainelGerenciador.importarBackup(e.target.files[0]);
      e.target.value = ''; // Reset input
    });

    document.getElementById('btn-apagar-tudo').addEventListener('click', PainelGerenciador.apagarTudo);
  }
}

document.addEventListener('DOMContentLoaded', PainelGerenciador.inicializar);

