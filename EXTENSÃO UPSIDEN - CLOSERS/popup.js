/* ==============================
   Upsiden — Popup Logic
   Biblioteca de Áudios + Envio
   ============================== */

const CONTEXTO_POPUP = '[Popup]';
const ESTADO_POPUP = {
  audios: [],
  categoriaAtiva: 'todos',
  buscaAtiva: '',
  audioTocando: null,
  elementoAudioPreview: null,
  audioEditandoId: null,
  pastas: []
};

// ============== LOGGER ==============
class Logger {
  static info(msg, data = null) {
    data ? console.log(`${CONTEXTO_POPUP} ℹ️ ${msg}`, data) : console.log(`${CONTEXTO_POPUP} ℹ️ ${msg}`);
  }
  static ok(msg, data = null) {
    data ? console.log(`${CONTEXTO_POPUP} ✅ ${msg}`, data) : console.log(`${CONTEXTO_POPUP} ✅ ${msg}`);
  }
  static warn(msg, data = null) {
    data ? console.warn(`${CONTEXTO_POPUP} ⚠️ ${msg}`, data) : console.warn(`${CONTEXTO_POPUP} ⚠️ ${msg}`);
  }
  static error(msg, err = null) {
    console.error(`${CONTEXTO_POPUP} ❌ ${msg}`);
    if (err) console.error(err);
  }
}

// ============== STORAGE ==============
class StorageManager {
  static async carregarAudios() {
    Logger.info('Carregando dados do storage...');
    try {
      const resultado = await chrome.storage.local.get({ upsiden_audios: [], upsiden_pastas: [] });
      ESTADO_POPUP.audios = resultado.upsiden_audios;
      ESTADO_POPUP.pastas = resultado.upsiden_pastas;
      Logger.ok(`${ESTADO_POPUP.audios.length} áudios e ${ESTADO_POPUP.pastas.length} pastas`);
      return ESTADO_POPUP.audios;
    } catch (err) {
      Logger.error('Falha ao carregar dados', err);
      return [];
    }
  }

  static async salvarAudios() {
    Logger.info(`Salvando ${ESTADO_POPUP.audios.length} áudios no storage...`);
    try {
      await chrome.storage.local.set({ upsiden_audios: ESTADO_POPUP.audios });
      Logger.ok('Áudios salvos com sucesso');
    } catch (err) {
      Logger.error('Falha ao salvar áudios', err);
      StatusBar.mostrar('Erro ao salvar áudios', 'error');
    }
  }

  static async adicionarAudio(audioObj) {
    ESTADO_POPUP.audios.push(audioObj);
    await StorageManager.salvarAudios();
  }

  static async removerAudio(id) {
    ESTADO_POPUP.audios = ESTADO_POPUP.audios.filter(a => a.id !== id);
    await StorageManager.salvarAudios();
  }

  static async atualizarAudio(id, dados) {
    const idx = ESTADO_POPUP.audios.findIndex(a => a.id === id);
    if (idx !== -1) {
      ESTADO_POPUP.audios[idx] = { ...ESTADO_POPUP.audios[idx], ...dados };
      await StorageManager.salvarAudios();
    }
  }
  
  static async adicionarPasta(nome) {
    const nova = { id: 'pasta_' + Date.now(), nome: nome, criadoEm: Date.now() };
    ESTADO_POPUP.pastas.push(nova);
    await chrome.storage.local.set({ upsiden_pastas: ESTADO_POPUP.pastas });
    UIRenderer.atualizarCategorias();
  }
}

// ============== AUDIO PROCESSOR ==============
class AudioProcessor {
  static gerarId() {
    return `vs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  static formatarDuracao(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg.toString().padStart(2, '0')}`;
  }

  static formatarTamanho(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  static async processarArquivo(arquivo) {
    Logger.info(`Processando: ${arquivo.name} (${arquivo.type}, ${AudioProcessor.formatarTamanho(arquivo.size)})`);
    try {
      const arrayBuffer = await arquivo.arrayBuffer();
      const contexto = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await contexto.decodeAudioData(arrayBuffer.slice(0));
      const duracao = buffer.duration;
      await contexto.close();

      // Converter para base64
      const base64 = await AudioProcessor.arrayBufferToBase64(arrayBuffer);

      const audioObj = {
        id: AudioProcessor.gerarId(),
        nome: arquivo.name.replace(/\.[^/.]+$/, ''),
        nomeOriginal: arquivo.name,
        tipoMime: arquivo.type || 'audio/mpeg',
        duracao: duracao,
        tamanho: arquivo.size,
        base64: base64,
        pastaId: '',
        favorito: false,
        criadoEm: Date.now()
      };

      Logger.ok(`Áudio processado: ${audioObj.nome} (${AudioProcessor.formatarDuracao(duracao)})`);
      return audioObj;
    } catch (err) {
      Logger.error(`Falha ao processar ${arquivo.name}`, err);
      throw err;
    }
  }

  static async arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  static base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ============== STATUS BAR ==============
class StatusBar {
  static mostrar(texto, tipo = 'normal', duracao = 3000) {
    const el = document.getElementById('texto-status');
    el.className = `status-text ${tipo}`;
    el.innerHTML = tipo === 'sending' ? `<span class="spinner"></span> ${texto}` : texto;
    if (tipo !== 'sending' && duracao > 0) {
      setTimeout(() => {
        el.className = 'status-text';
        el.textContent = 'Pronto';
      }, duracao);
    }
  }

  static atualizarContagem() {
    const el = document.getElementById('contagem-audios');
    const total = ESTADO_POPUP.audios.length;
    el.textContent = `${total} ${total === 1 ? 'áudio' : 'áudios'}`;
  }
}

// ============== UI RENDERER ==============
class UIRenderer {
  static renderizarLista() {
    const container = document.getElementById('lista-audios');
    const estadoVazio = document.getElementById('estado-vazio');
    const audiosFiltrados = UIRenderer.filtrarAudios();

    // Limpar lista e estados vazios injetados (exceto o estado vazio principal)
    container.querySelectorAll('.audio-card, .empty-state:not(#estado-vazio)').forEach(el => el.remove());

    if (ESTADO_POPUP.audios.length === 0) {
      if (estadoVazio) estadoVazio.style.display = 'flex';
      StatusBar.atualizarContagem();
      return;
    }

    if (estadoVazio) estadoVazio.style.display = 'none';

    if (audiosFiltrados.length === 0) {
      const msgVazia = document.createElement('div');
      msgVazia.className = 'empty-state';
      msgVazia.innerHTML = '<p class="empty-desc">Nenhum áudio encontrado para o filtro atual</p>';
      container.appendChild(msgVazia);
    } else {
      audiosFiltrados.forEach((audio, index) => {
        const card = UIRenderer.criarCardAudio(audio, index);
        container.appendChild(card);
      });
    }

    StatusBar.atualizarContagem();
    UIRenderer.atualizarCategorias();
  }

  static filtrarAudios() {
    let audios = [...ESTADO_POPUP.audios];
    const busca = ESTADO_POPUP.buscaAtiva.toLowerCase().trim();
    const categoria = ESTADO_POPUP.categoriaAtiva;

    if (busca) {
      audios = audios.filter(a => {
        const pasta = ESTADO_POPUP.pastas.find(p => p.id === a.pastaId);
        return a.nome.toLowerCase().includes(busca) ||
               (pasta && pasta.nome.toLowerCase().includes(busca));
      });
    }

    if (categoria === 'favoritos') {
      audios = audios.filter(a => a.favorito);
    } else if (categoria !== 'todos') {
      audios = audios.filter(a => a.pastaId === categoria);
    }

    return audios;
  }

  static criarCardAudio(audio, index) {
    const card = document.createElement('div');
    card.className = 'audio-card audio-card-enter';
    card.style.animationDelay = `${index * 40}ms`;
    card.dataset.id = audio.id;

    const estaPreviewando = ESTADO_POPUP.audioTocando === audio.id;
    const iconPlay = estaPreviewando
      ? '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

    card.innerHTML = `
      <div class="audio-card-fav">
        <button class="btn-fav ${audio.favorito ? 'active' : ''}" data-id="${audio.id}" title="Favoritar">⭐</button>
      </div>
      <button class="audio-play" data-id="${audio.id}" title="${estaPreviewando ? 'Pausar' : 'Pré-escuta'}">
        ${iconPlay}
      </button>
      <div class="audio-info">
        <div class="audio-name" title="${audio.nome}">${audio.nome}</div>
        <div class="audio-meta">
          <span class="audio-duration">${AudioProcessor.formatarDuracao(audio.duracao)}</span>
          ${audio.pastaId && ESTADO_POPUP.pastas.find(p=>p.id===audio.pastaId) ? `<span class="audio-category">${ESTADO_POPUP.pastas.find(p=>p.id===audio.pastaId).nome}</span>` : ''}
        </div>
      </div>
      <div class="audio-actions">
        <button class="btn-send" data-id="${audio.id}" title="Enviar agora">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          Enviar
        </button>
        <button class="btn-action btn-edit" data-id="${audio.id}" title="Editar">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="btn-action btn-delete" data-id="${audio.id}" title="Excluir">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    `;

    return card;
  }

  static atualizarCategorias() {
    const container = document.getElementById('container-categorias');

    // Manter chips fixos (Todos, Favoritos)
    const chipsExistentes = container.querySelectorAll('.cat-chip:not([data-categoria="todos"]):not([data-categoria="favoritos"])');
    chipsExistentes.forEach(chip => chip.remove());

    // Adicionar abas dinâmicas das pastas
    ESTADO_POPUP.pastas.forEach(pasta => {
      const chip = document.createElement('button');
      chip.className = `cat-chip ${ESTADO_POPUP.categoriaAtiva === pasta.id ? 'active' : ''}`;
      chip.dataset.categoria = pasta.id;
      chip.textContent = pasta.nome;
      container.appendChild(chip);
    });
    
    // Botão de Nova Pasta
    const btnNova = document.createElement('button');
    btnNova.className = 'cat-chip chip-add';
    btnNova.style.borderStyle = 'dashed';
    btnNova.style.background = 'transparent';
    btnNova.textContent = '+ Nova Pasta';
    btnNova.onclick = () => {
      const nome = prompt("Nome da nova pasta:");
      if(nome && nome.trim()) StorageManager.adicionarPasta(nome.trim());
    };
    container.appendChild(btnNova);
  }
}

// ============== PREVIEW ==============
class PreviewManager {
  static toggle(audioId) {
    if (ESTADO_POPUP.audioTocando === audioId) {
      PreviewManager.parar();
      return;
    }
    PreviewManager.parar();
    PreviewManager.tocar(audioId);
  }

  static tocar(audioId) {
    const audio = ESTADO_POPUP.audios.find(a => a.id === audioId);
    if (!audio) return;

    Logger.info(`Preview: ${audio.nome}`);
    const arrayBuffer = AudioProcessor.base64ToArrayBuffer(audio.base64);
    const blob = new Blob([arrayBuffer], { type: audio.tipoMime });
    const url = URL.createObjectURL(blob);

    const elemento = new Audio(url);
    elemento.volume = 0.5;
    elemento.play();

    elemento.addEventListener('ended', () => {
      PreviewManager.parar();
      UIRenderer.renderizarLista();
    });

    ESTADO_POPUP.audioTocando = audioId;
    ESTADO_POPUP.elementoAudioPreview = elemento;
    UIRenderer.renderizarLista();
  }

  static parar() {
    if (ESTADO_POPUP.elementoAudioPreview) {
      ESTADO_POPUP.elementoAudioPreview.pause();
      ESTADO_POPUP.elementoAudioPreview = null;
    }
    ESTADO_POPUP.audioTocando = null;
  }
}

// ============== SEND MANAGER ==============
class SendManager {
  static async enviar(audioId) {
    const audio = ESTADO_POPUP.audios.find(a => a.id === audioId);
    if (!audio) {
      Logger.error('Áudio não encontrado para envio');
      StatusBar.mostrar('Áudio não encontrado', 'error');
      return;
    }

    Logger.info(`Enviando áudio: ${audio.nome}`);
    StatusBar.mostrar(`Enviando "${audio.nome}"...`, 'sending');

    // Destacar card
    const card = document.querySelector(`.audio-card[data-id="${audioId}"]`);
    if (card) card.classList.add('sending');

    try {
      // Enviar para o background, que redireciona ao content script
      StatusBar.mostrar(`Conectando ao WhatsApp Web...`, 'sending');

      const resposta = await chrome.runtime.sendMessage({
        tipo: 'enviar_audio_biblioteca',
        dados: {
          base64: audio.base64,
          tipoMime: audio.tipoMime,
          duracao: audio.duracao,
          nome: audio.nome
        }
      });

      if (resposta && resposta.sucesso) {
        Logger.ok(`Áudio "${audio.nome}" enviado com sucesso`);
        StatusBar.mostrar(`"${audio.nome}" enviado! ⚡`, 'success');
      } else {
        const msgErro = resposta?.erro || 'Sem resposta do WhatsApp Web';
        throw new Error(msgErro);
      }
    } catch (err) {
      Logger.error('Falha ao enviar áudio', err);
      const msgUsuario = err.message.includes('F5')
        ? err.message
        : err.message.includes('WhatsApp')
        ? err.message
        : 'Atualize o WhatsApp Web (F5) e tente novamente';
      StatusBar.mostrar(msgUsuario, 'error', 5000);
    } finally {
      if (card) {
        setTimeout(() => card.classList.remove('sending'), 2000);
      }
    }
  }
}

// ============== IMPORT MANAGER ==============
class ImportManager {
  static abrir() {
    document.getElementById('input-importar').click();
  }

  static async processar(arquivos) {
    if (!arquivos || arquivos.length === 0) return;

    Logger.info(`Importando ${arquivos.length} arquivo(s)...`);
    StatusBar.mostrar(`Importando ${arquivos.length} áudio(s)...`, 'sending');

    let sucesso = 0;
    let falhas = 0;

    for (const arquivo of arquivos) {
      try {
        const audioObj = await AudioProcessor.processarArquivo(arquivo);
        await StorageManager.adicionarAudio(audioObj);
        sucesso++;
        StatusBar.mostrar(`Importando... (${sucesso}/${arquivos.length})`, 'sending');
      } catch (err) {
        falhas++;
        Logger.error(`Falha ao importar ${arquivo.name}`, err);
      }
    }

    UIRenderer.renderizarLista();
    const msg = falhas > 0
      ? `${sucesso} importado(s), ${falhas} falha(s)`
      : `${sucesso} áudio(s) importado(s)! ✨`;
    StatusBar.mostrar(msg, falhas > 0 ? 'error' : 'success');
  }
}

// ============== MODAL ==============
class ModalManager {
  static abrir(audioId) {
    const audio = ESTADO_POPUP.audios.find(a => a.id === audioId);
    if (!audio) return;

    ESTADO_POPUP.audioEditandoId = audioId;
    document.getElementById('modal-nome').value = audio.nome;
    
    // Preparar Options no select
    const select = document.getElementById('modal-pasta');
    select.innerHTML = '<option value="">Sem Pasta</option>';
    ESTADO_POPUP.pastas.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      select.appendChild(opt);
    });
    
    select.value = audio.pastaId || '';

    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-nome').focus();
  }

  static fechar() {
    ESTADO_POPUP.audioEditandoId = null;
    document.getElementById('modal-overlay').style.display = 'none';
  }

  static async salvar() {
    const id = ESTADO_POPUP.audioEditandoId;
    if (!id) return;

    const nome = document.getElementById('modal-nome').value.trim();
    const pastaId = document.getElementById('modal-pasta').value;

    if (!nome) {
      document.getElementById('modal-nome').focus();
      return;
    }

    await StorageManager.atualizarAudio(id, { nome, pastaId });
    ModalManager.fechar();
    UIRenderer.renderizarLista();
    StatusBar.mostrar('Áudio atualizado ✓', 'success');
  }
}

// ============== EVENT HANDLERS ==============
function registrarEventos() {
  Logger.info('Registrando eventos...');

  // Import
  document.getElementById('btn-importar').addEventListener('click', ImportManager.abrir);
  document.getElementById('input-importar').addEventListener('change', (e) => {
    ImportManager.processar(e.target.files);
    e.target.value = '';
  });

  // Search
  document.getElementById('input-busca').addEventListener('input', (e) => {
    ESTADO_POPUP.buscaAtiva = e.target.value;
    UIRenderer.renderizarLista();
  });

  // Categories (delegated)
  document.getElementById('container-categorias').addEventListener('click', (e) => {
    const chip = e.target.closest('.cat-chip');
    if (!chip || chip.classList.contains('chip-add')) return;

    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    ESTADO_POPUP.categoriaAtiva = chip.dataset.categoria;
    UIRenderer.renderizarLista();
  });

  // Audio list (delegated events)
  document.getElementById('lista-audios').addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('btn-send')) {
      SendManager.enviar(id);
    } else if (target.classList.contains('audio-play')) {
      PreviewManager.toggle(id);
    } else if (target.classList.contains('btn-edit')) {
      ModalManager.abrir(id);
    } else if (target.classList.contains('btn-delete')) {
      confirmarExclusao(id);
    } else if (target.classList.contains('btn-fav')) {
      toggleFavorito(id);
    }
  });

  // Modal
  document.getElementById('btn-fechar-modal').addEventListener('click', ModalManager.fechar);
  document.getElementById('btn-cancelar-modal').addEventListener('click', ModalManager.fechar);
  document.getElementById('btn-salvar-modal').addEventListener('click', ModalManager.salvar);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) ModalManager.fechar();
  });

  // Modal keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ESTADO_POPUP.audioEditandoId) {
      ModalManager.fechar();
    }
    if (e.key === 'Enter' && ESTADO_POPUP.audioEditandoId) {
      ModalManager.salvar();
    }
  });

  // Settings button
  document.getElementById('btn-opcoes').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  Logger.ok('Eventos registrados');
}

async function confirmarExclusao(id) {
  const audio = ESTADO_POPUP.audios.find(a => a.id === id);
  if (!audio) return;

  // Simple inline confirm
  const card = document.querySelector(`.audio-card[data-id="${id}"]`);
  if (card && card.dataset.confirmando) {
    // Second click = confirm
    await StorageManager.removerAudio(id);
    UIRenderer.renderizarLista();
    StatusBar.mostrar(`"${audio.nome}" excluído`, 'success');
    return;
  }

  if (card) {
    card.dataset.confirmando = 'true';
    card.style.borderColor = 'var(--danger)';
    const btnDelete = card.querySelector('.btn-delete');
    if (btnDelete) {
      btnDelete.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="var(--danger)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    }
    StatusBar.mostrar('Clique novamente para confirmar exclusão', 'error', 3000);
    setTimeout(() => {
      if (card) {
        delete card.dataset.confirmando;
        card.style.borderColor = '';
        UIRenderer.renderizarLista();
      }
    }, 3000);
  }
}

async function toggleFavorito(id) {
  const audio = ESTADO_POPUP.audios.find(a => a.id === id);
  if (!audio) return;

  await StorageManager.atualizarAudio(id, { favorito: !audio.favorito });
  UIRenderer.renderizarLista();
}

// ============== INIT ==============
async function inicializar() {
  Logger.info('=== Inicializando Upsiden Popup ===');
  try {
    await StorageManager.carregarAudios();
    UIRenderer.renderizarLista();
    registrarEventos();
    StatusBar.atualizarContagem();
    Logger.ok('=== Upsiden Popup inicializado ===');
  } catch (err) {
    Logger.error('Falha na inicialização', err);
    StatusBar.mostrar('Erro ao inicializar', 'error');
  }
}

document.addEventListener('DOMContentLoaded', inicializar);


