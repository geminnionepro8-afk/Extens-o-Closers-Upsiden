/* Upsiden - Login Logic */

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const btnToggle = document.getElementById('btn-toggle');
const statusEl = document.getElementById('login-status');
let modoRegistro = false;

function mostrarStatus(msg, tipo = 'error') {
  statusEl.textContent = msg;
  statusEl.className = `login-status ${tipo}`;
}

function limparStatus() {
  statusEl.className = 'login-status';
  statusEl.textContent = '';
}

btnToggle.addEventListener('click', () => {
  modoRegistro = !modoRegistro;
  formLogin.style.display = modoRegistro ? 'none' : 'block';
  formRegistro.style.display = modoRegistro ? 'block' : 'none';
  btnToggle.textContent = modoRegistro ? 'Já tem conta? Entrar' : 'Não tem conta? Criar uma';
  limparStatus();
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const btn = document.getElementById('btn-entrar');

  btn.disabled = true;
  btn.textContent = 'Entrando...';
  limparStatus();

  try {
    await UpsidenAuth.signIn(email, senha);
    mostrarStatus('Login realizado com sucesso!', 'success');

    // If opened from popup or as a tab, notify parent and close
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({ type: 'upsiden_auth_success' }, '*');
        window.close();
      } else {
        // Redirect to painel dashboard
        window.location.href = '../painel/painel.html';
      }
    }, 500);
  } catch (err) {
    mostrarStatus(err.message || 'Erro ao fazer login');
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('reg-nome').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-senha').value;
  const btn = formRegistro.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.textContent = 'Criando conta...';
  limparStatus();

  try {
    const result = await UpsidenAuth.signUp(email, senha, nome);
    if (result.access_token) {
      mostrarStatus('Conta criada com sucesso!', 'success');
      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage({ type: 'upsiden_auth_success' }, '*');
          window.close();
        } else {
          window.location.href = '../painel/painel.html';
        }
      }, 500);
    } else {
      mostrarStatus('Conta criada! Verifique seu email para confirmar.', 'info');
    }
  } catch (err) {
    mostrarStatus(err.message || 'Erro ao criar conta');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Conta';
  }
});

// Check if already logged in
(async () => {
  const loggedIn = await verificarAuth();
  if (loggedIn) {
    window.location.href = '../painel/painel.html';
  }
})();

