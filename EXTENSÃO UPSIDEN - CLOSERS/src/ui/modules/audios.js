/* ==============================
   Upsiden - Biblioteca de Áudios (Supabase)
   ============================== */

const CONTEXTO_POPUP = '[Popup]';
const ESTADO_POPUP = {
  audios: [],
  categoriaAtiva: 'todos',
  buscaAtiva: '',
  audioTocando: null,
  elementoAudioPreview: null,
  audioEditandoId: null,
  pastas: [],
  userId: null,
  isAdmin: false
};

// ============== LOGGER ==============
class Logger {
  static info(msg, data = null) { data ? console.log(`${CONTEXTO_POPUP} ��️ ${msg}`, data) : console.log(`${CONTEXTO_POPUP} ��️ ${msg}`); }
  static ok(msg, data = null) { data ? console.log(`${CONTEXTO_POPUP} �S& ${msg}`, data) : console.log(`${CONTEXTO_POPUP} �S& ${msg}`); }
  static warn(msg, data = null) { data ? console.warn(`${CONTEXTO_POPUP} �a�️ ${msg}`, data) : console.warn(`${CONTEXTO_POPUP} �a�️ ${msg}`); }
  static error(msg, err = null) { console.error(`${CONTEXTO_POPUP} �R ${msg}`); if (err) console.error(err); }
}

// ============== STORAGE MANAGER (SUPABASE) ==============
class StorageManager {
  static async carregarAudios() {
    Logger.info('Carregando dados do Supabase...');
    try {
      const audios = await UpsidenDB.from('audios').select('*').order('created_at', false).execute();
      ESTADO_POPUP.audios = audios || [];

      const pastas = await UpsidenDB.from('pastas_audio').select('*').order('nome').execute();
      ESTADO_POPUP.pastas = pastas || [];

      Logger.ok(`${ESTADO_POPUP.audios.length} áudios e ${ESTADO_POPUP.pastas.length} pastas`);
      return ESTADO_POPUP.audios;
    } catch (err) {
      Logger.error('Falha ao carregar dados', err);
      // Força a mensagem do erro no HTML para podermos debugar com prints
      StatusBar.mostrar('ERRO DB: ' + (err.message || String(err)), 'error', 0);
      return [];
    }
  }

  static async adicionarAudio(audioObj) {
    try {
      const result = await UpsidenDB.from('audios').insert(audioObj).execute();
      if (result && result.length > 0) {
        ESTADO_POPUP.audios.unshift(result[0]);
      }
    } catch (err) {
      Logger.error('Falha ao salvar áudio', err);
      throw err;
    }
  }

  static async removerAudio(id) {
    try {
      // Get the audio to find its storage path
      const audio = ESTADO_POPUP.audios.find(a => a.id === id);
      if (audio && audio.storage_path) {
        await UpsidenStorage.remove('audios', [audio.storage_path]).catch(() => {});
      }
      await UpsidenDB.from('audios').eq('id', id).delete().execute();
      ESTADO_POPUP.audios = ESTADO_POPUP.audios.filter(a => a.id !== id);
    } catch (err) {
      Logger.error('Falha ao remover áudio', err);
    }
  }

  static async atualizarAudio(id, dados) {
    try {
      await UpsidenDB.from('audios').eq('id', id).update(dados).execute();
      const idx = ESTADO_POPUP.audios.findIndex(a => a.id === id);
      if (idx !== -1) {
        ESTADO_POPUP.audios[idx] = { ...ESTADO_POPUP.audios[idx], ...dados };
      }
    } catch (err) {
      Logger.error('Falha ao atualizar áudio', err);
    }
  }

  static async adicionarPasta(nome) {
    try {
      const result = await UpsidenDB.from('pastas_audio').insert({
        nome, criado_por: ESTADO_POPUP.userId
      }).execute();
      if (result && result.length > 0) {
        ESTADO_POPUP.pastas.push(result[0]);
      }
      UIRenderer.atualizarCategorias();
    } catch (err) {
      Logger.error('Falha ao criar pasta', err);
    }
  }
}

// ============== AUDIO PROCESSOR ==============
class AudioProcessor {
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
    Logger.info(`Processando: ${arquivo.name}`);
    try {
      const arrayBuffer = await arquivo.arrayBuffer();
      const contexto = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await contexto.decodeAudioData(arrayBuffer.slice(0));
      const duracao = buffer.duration;
      await contexto.close();

      // Upload to Supabase Storage
      const storagePath = `${ESTADO_POPUP.userId}/${Date.now()}_${arquivo.name}`;
      await UpsidenStorage.upload('audios', storagePath, arquivo, arquivo.type);

      const audioObj = {
        nome: arquivo.name.replace(/\.[^/.]+$/, ''),
        nome_original: arquivo.name,
        tipo_mime: arquivo.type || 'audio/mpeg',
        duracao: duracao,
        tamanho: arquivo.size,
        storage_path: storagePath,
        pasta_id: null,
        criado_por: ESTADO_POPUP.userId,
        compartilhado: ESTADO_POPUP.isAdmin, // Admin shares by default
        favorito: false
      };

      Logger.ok(`Áudio processado: ${audioObj.nome} (${AudioProcessor.formatarDuracao(duracao)})`);
      return audioObj;
    } catch (err) {
      Logger.error(`Falha ao processar ${arquivo.name}`, err);
      throw err;
    }
  }
}

// ============== STATUS BAR ==============
class StatusBar {
  static mostrar(texto, tipo = 'normal', duracao = 3000) {
    const el = window.$upsRoot ? window.$upsRoot.getElementById('texto-status') : null;
    if (!el) return;
    el.className = `status-text ${tipo}`;
    el.innerHTML = tipo === 'sending' ? `<span class="spinner"></span> ${texto}` : texto;
    if (tipo !== 'sending' && duracao > 0) {
      setTimeout(() => { el.className = 'status-text'; el.textContent = 'Pronto'; }, duracao);
    }
  }

  static atualizarContagem() {
    const el = window.$upsRoot.getElementById('contagem-audios');
    const total = ESTADO_POPUP.audios.length;
    el.textContent = `${total} ${total === 1 ? 'áudio' : 'áudios'}`;
  }
}

// ============== UI RENDERER ==============
class UIRenderer {
  static renderizarLista() {
    const container = window.$upsRoot.getElementById('lista-audios');
    const estadoVazio = window.$upsRoot.getElementById('estado-vazio');
    const estadoLoading = window.$upsRoot.getElementById('estado-loading');
    const audiosFiltrados = UIRenderer.filtrarAudios();

    if (estadoLoading) estadoLoading.style.display = 'none';
    container.querySelectorAll('.audio-card, .empty-state:not(#estado-vazio):not(#estado-loading)').forEach(el => el.remove());

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
        const pasta = ESTADO_POPUP.pastas.find(p => p.id === a.pasta_id);
        return a.nome.toLowerCase().includes(busca) || (pasta && pasta.nome.toLowerCase().includes(busca));
      });
    }

    if (categoria === 'favoritos') {
      audios = audios.filter(a => a.favorito);
    } else if (categoria === 'equipe') {
      audios = audios.filter(a => a.compartilhado);
    } else if (categoria !== 'todos') {
      audios = audios.filter(a => a.pasta_id === categoria);
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

    const compartilhadoBadge = audio.compartilhado ? '<span style="font-size:9px;background:#FF6200;color:white;padding:1px 4px;border-radius:3px;margin-left:4px;">TIME</span>' : '';

    card.innerHTML = `
      <div class="audio-card-fav">
        <button class="btn-fav ${audio.favorito ? 'active' : ''}" data-id="${audio.id}" title="Favoritar">⭐</button>
      </div>
      <button class="audio-play" data-id="${audio.id}" title="${estaPreviewando ? 'Pausar' : 'Pré-escuta'}">
        ${iconPlay}
      </button>
      <div class="audio-info">
        <div class="audio-name" title="${audio.nome}">${audio.nome}${compartilhadoBadge}</div>
        <div class="audio-meta">
          <span class="audio-duration">${AudioProcessor.formatarDuracao(audio.duracao)}</span>
          ${audio.pasta_id && ESTADO_POPUP.pastas.find(p=>p.id===audio.pasta_id) ? `<span class="audio-category">${ESTADO_POPUP.pastas.find(p=>p.id===audio.pasta_id).nome}</span>` : ''}
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
    const container = window.$upsRoot.getElementById('container-categorias');
    const chipsExistentes = container.querySelectorAll('.cat-chip:not([data-categoria="todos"]):not([data-categoria="favoritos"])');
    chipsExistentes.forEach(chip => chip.remove());

    ESTADO_POPUP.pastas.forEach(pasta => {
      const chip = document.createElement('button');
      chip.className = `cat-chip ${ESTADO_POPUP.categoriaAtiva === pasta.id ? 'active' : ''}`;
      chip.dataset.categoria = pasta.id;
      chip.textContent = pasta.nome;
      container.appendChild(chip);
    });

    const btnNova = document.createElement('button');
    btnNova.className = 'cat-chip chip-add';
    btnNova.style.borderStyle = 'dashed';
    btnNova.style.background = 'transparent';
    btnNova.textContent = '+ Nova Pasta';
    btnNova.onclick = () => {
      const nome = prompt("Nome da nova pasta:");
      if (nome && nome.trim()) StorageManager.adicionarPasta(nome.trim());
    };
    container.appendChild(btnNova);
  }
}

// ============== PREVIEW ==============
class PreviewManager {
  static toggle(audioId) {
    if (ESTADO_POPUP.audioTocando === audioId) { PreviewManager.parar(); return; }
    PreviewManager.parar();
    PreviewManager.tocar(audioId);
  }

  static async tocar(audioId) {
    const audio = ESTADO_POPUP.audios.find(a => a.id === audioId);
    if (!audio) return;

    Logger.info(`Preview: ${audio.nome}`);
    StatusBar.mostrar('Carregando preview...', 'sending');

    try {
      const blob = await UpsidenStorage.download('audios', audio.storage_path);
      const url = URL.createObjectURL(blob);
      const elemento = new Audio(url);
      elemento.volume = 0.5;
      elemento.play();
      elemento.addEventListener('ended', () => { PreviewManager.parar(); UIRenderer.renderizarLista(); });
      ESTADO_POPUP.audioTocando = audioId;
      ESTADO_POPUP.elementoAudioPreview = elemento;
      StatusBar.mostrar('Pronto', 'normal', 1000);
      UIRenderer.renderizarLista();
    } catch (err) {
      Logger.error('Falha no preview', err);
      StatusBar.mostrar('Erro ao carregar preview', 'error');
    }
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
    if (!audio) { StatusBar.mostrar('Áudio não encontrado', 'error'); return; }

    Logger.info(`Enviando áudio: ${audio.nome}`);
    StatusBar.mostrar(`Enviando "${audio.nome}"...`, 'sending');

    const card = window.$upsRoot.querySelector(`.audio-card[data-id="${audioId}"]`);
    if (card) card.classList.add('sending');

    try {
      // Download from Supabase Storage
      const blob = await UpsidenStorage.download('audios', audio.storage_path);
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }
      const base64 = btoa(binary);

      StatusBar.mostrar(`Conectando ao WhatsApp Web...`, 'sending');

      const resposta = await chrome.runtime.sendMessage({
        tipo: 'enviar_audio_biblioteca',
        dados: { base64, tipoMime: audio.tipo_mime, duracao: audio.duracao, nome: audio.nome }
      });

      if (resposta && resposta.sucesso) {
        Logger.ok(`Áudio "${audio.nome}" enviado com sucesso`);
        StatusBar.mostrar(`"${audio.nome}" enviado! �a�`, 'success');
        // Register metric
        UpsidenMetrics.registrar('audio', audio.id);
      } else {
        throw new Error(resposta?.erro || 'Sem resposta do WhatsApp Web');
      }
    } catch (err) {
      Logger.error('Falha ao enviar áudio', err);
      const msgUsuario = err.message.includes('F5') ? err.message :
        err.message.includes('WhatsApp') ? err.message : 'Atualize o WhatsApp Web (F5) e tente novamente';
      StatusBar.mostrar(msgUsuario, 'error', 5000);
    } finally {
      if (card) setTimeout(() => card.classList.remove('sending'), 2000);
    }
  }
}

// ============== IMPORT MANAGER ==============
class ImportManager {
  static abrir() { window.$upsRoot.getElementById('input-importar').click(); }

  static async processar(arquivos) {
    if (!arquivos || arquivos.length === 0) return;
    Logger.info(`Importando ${arquivos.length} arquivo(s)...`);
    StatusBar.mostrar(`Importando ${arquivos.length} áudio(s)...`, 'sending');

    let sucesso = 0, falhas = 0;
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
    const msg = falhas > 0 ? `${sucesso} importado(s), ${falhas} falha(s)` : `${sucesso} áudio(s) importado(s)! �S�`;
    StatusBar.mostrar(msg, falhas > 0 ? 'error' : 'success');
  }
}

// ============== MODAL ==============
class ModalManager {
  static abrir(audioId) {
    const audio = ESTADO_POPUP.audios.find(a => a.id === audioId);
    if (!audio) return;

    ESTADO_POPUP.audioEditandoId = audioId;
    window.$upsRoot.getElementById('modal-nome').value = audio.nome;

    const select = window.$upsRoot.getElementById('modal-pasta');
    select.innerHTML = '<option value="">Sem Pasta</option>';
    ESTADO_POPUP.pastas.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      select.appendChild(opt);
    });
    select.value = audio.pasta_id || '';

    const chkCompartilhado = window.$upsRoot.getElementById('modal-compartilhado');
    if (chkCompartilhado) chkCompartilhado.checked = audio.compartilhado || false;

    window.$upsRoot.getElementById('modal-overlay').style.display = 'flex';
    window.$upsRoot.getElementById('modal-nome').focus();
  }

  static fechar() {
    ESTADO_POPUP.audioEditandoId = null;
    window.$upsRoot.getElementById('modal-overlay').style.display = 'none';
  }

  static async salvar() {
    const id = ESTADO_POPUP.audioEditandoId;
    if (!id) return;

    const nome = window.$upsRoot.getElementById('modal-nome').value.trim();
    const pastaId = window.$upsRoot.getElementById('modal-pasta').value || null;
    const compartilhado = window.$upsRoot.getElementById('modal-compartilhado')?.checked || false;

    if (!nome) { window.$upsRoot.getElementById('modal-nome').focus(); return; }

    await StorageManager.atualizarAudio(id, { nome, pasta_id: pastaId, compartilhado });
    ModalManager.fechar();
    UIRenderer.renderizarLista();
    StatusBar.mostrar('Áudio atualizado �S', 'success');
  }
}

// ============== EVENT HANDLERS ==============
function registrarEventos() {
  Logger.info('Registrando eventos...');

  const btnImportar = window.$upsRoot.getElementById('btn-importar');
  if (btnImportar) btnImportar.addEventListener('click', ImportManager.abrir);

  const inputImportar = window.$upsRoot.getElementById('input-importar');
  if (inputImportar) {
    inputImportar.addEventListener('change', (e) => {
      ImportManager.processar(e.target.files);
      e.target.value = '';
    });
  }

  const inputBusca = window.$upsRoot.getElementById('input-busca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      ESTADO_POPUP.buscaAtiva = e.target.value;
      UIRenderer.renderizarLista();
    });
  }

  const containerCategorias = window.$upsRoot.getElementById('container-categorias');
  if (containerCategorias) {
    containerCategorias.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip || chip.classList.contains('chip-add')) return;
      window.$upsRoot.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      ESTADO_POPUP.categoriaAtiva = chip.dataset.categoria;
      UIRenderer.renderizarLista();
    });
  }

  const listaAudios = window.$upsRoot.getElementById('lista-audios');
  if (listaAudios) {
    listaAudios.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const id = target.dataset.id;
      if (!id) return;

      if (target.classList.contains('btn-send')) SendManager.enviar(id);
      else if (target.classList.contains('audio-play')) PreviewManager.toggle(id);
      else if (target.classList.contains('btn-edit')) ModalManager.abrir(id);
      else if (target.classList.contains('btn-delete')) confirmarExclusao(id);
      else if (target.classList.contains('btn-fav')) toggleFavorito(id);
    });
  }

  const btnFecharModal = window.$upsRoot.getElementById('btn-fechar-modal');
  if (btnFecharModal) btnFecharModal.addEventListener('click', ModalManager.fechar);

  const btnCancelarModal = window.$upsRoot.getElementById('btn-cancelar-modal');
  if (btnCancelarModal) btnCancelarModal.addEventListener('click', ModalManager.fechar);

  const btnSalvarModal = window.$upsRoot.getElementById('btn-salvar-modal');
  if (btnSalvarModal) btnSalvarModal.addEventListener('click', ModalManager.salvar);

  const modalOverlay = window.$upsRoot.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) ModalManager.fechar();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ESTADO_POPUP.audioEditandoId) ModalManager.fechar();
    if (e.key === 'Enter' && ESTADO_POPUP.audioEditandoId) ModalManager.salvar();
  });

  const btnOpcoes = window.$upsRoot.getElementById('btn-opcoes');
  if (btnOpcoes) btnOpcoes.addEventListener('click', () => chrome.runtime.openOptionsPage());

  const btnLogout = window.$upsRoot.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await UpsidenAuth.signOut();
      const mainApp = window.$upsRoot.getElementById('main-app');
      const authGuard = window.$upsRoot.getElementById('auth-guard');
      if (mainApp) mainApp.style.display = 'none';
      if (authGuard) authGuard.style.display = 'flex';
    });
  }

  const btnAbrirLogin = window.$upsRoot.getElementById('btn-abrir-login');
  if (btnAbrirLogin) {
    btnAbrirLogin.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/login/login.html') });
    });
  }

  Logger.ok('Eventos registrados');
}

async function confirmarExclusao(id) {
  const audio = ESTADO_POPUP.audios.find(a => a.id === id);
  if (!audio) return;

  const card = window.$upsRoot.querySelector(`.audio-card[data-id="${id}"]`);
  if (card && card.dataset.confirmando) {
    await StorageManager.removerAudio(id);
    UIRenderer.renderizarLista();
    StatusBar.mostrar(`"${audio.nome}" excluído`, 'success');
    return;
  }

  if (card) {
    card.dataset.confirmando = 'true';
    card.style.borderColor = 'var(--danger)';
    const btnDelete = card.querySelector('.btn-delete');
    if (btnDelete) btnDelete.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="var(--danger)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    StatusBar.mostrar('Clique novamente para confirmar exclusão', 'error', 3000);
    setTimeout(() => {
      if (card) { delete card.dataset.confirmando; card.style.borderColor = ''; UIRenderer.renderizarLista(); }
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
    // Check auth
    const loggedIn = await verificarAuth();
    if (!loggedIn) {
      const authGuard = window.$upsRoot.getElementById('auth-guard');
      const mainApp = window.$upsRoot.getElementById('main-app');
      if (authGuard) authGuard.style.display = 'flex';
      if (mainApp) mainApp.style.display = 'none';
      
      const btnLogin = window.$upsRoot.getElementById('btn-abrir-login');
      if (btnLogin) {
        btnLogin.addEventListener('click', () => {
          chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/login/login.html') });
        });
      }
      // Listen for auth success
      window.addEventListener('message', async (ev) => {
        if (ev.data?.type === 'upsiden_auth_success') {
          window.location.reload();
        }
      });
      return;
    }

    // Show main app
    const authGuard = window.$upsRoot.getElementById('auth-guard');
    const mainApp = window.$upsRoot.getElementById('main-app');
    if (authGuard) authGuard.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';

    // Get user info
    ESTADO_POPUP.userId = await UpsidenAuth.getUserId();
    ESTADO_POPUP.isAdmin = await UpsidenAuth.isAdmin();

    // Show user badge (se existir no layout atual)
    const profile = await UpsidenAuth.getProfile();
    if (profile) {
      const badge = window.$upsRoot.getElementById('user-badge');
      if (badge) {
        badge.textContent = profile.nome || profile.email.split('@')[0];
        if (ESTADO_POPUP.isAdmin) badge.textContent += ' (Admin)';
      }
    }

    await StorageManager.carregarAudios();
    UIRenderer.renderizarLista();
    registrarEventos();
    StatusBar.atualizarContagem();
    Logger.ok('=== Upsiden Popup inicializado ===');
  } catch (err) {
    Logger.error('Falha na inicialização', err);
    StatusBar.mostrar('FATAL: ' + (err.message || String(err)), 'error', 0);
  }
}

if(window.$upsRoot) inicializar(); else document.addEventListener('DOMContentLoaded', inicializar);


window.upsInit_audios = inicializar;
