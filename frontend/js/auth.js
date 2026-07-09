// js/auth.js

function showMessage(containerId, texto, tipo = 'error') {
  const el = document.getElementById(containerId);
  if (!texto) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('login-msg', '');

  const nomeUsuario = document.getElementById('login-usuario').value;
  const senha = document.getElementById('login-senha').value;

  try {
    const { usuario } = await Api.post('/api/auth/login', { nomeUsuario, senha });
    App.iniciarSessao(usuario);
  } catch (err) {
    showMessage('login-msg', err.message);
  }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('signup-msg', '');

  const nome = document.getElementById('signup-nome').value;
  const email = document.getElementById('signup-email').value;
  const telefone = document.getElementById('signup-telefone').value;
  const nomeUsuario = document.getElementById('signup-usuario').value;
  const senha = document.getElementById('signup-senha').value;
  const confirmarSenha = document.getElementById('signup-confirmar').value;

  try {
    const { usuario } = await Api.post('/api/auth/signup', { nome, email, telefone, nomeUsuario, senha, confirmarSenha });
    App.iniciarSessao(usuario);
  } catch (err) {
    showMessage('signup-msg', err.message);
  }
});

document.getElementById('go-signup').addEventListener('click', () => App.mostrarTela('signup-screen'));
document.getElementById('go-login').addEventListener('click', () => App.mostrarTela('login-screen'));

formatarTelefoneInput(document.getElementById('signup-telefone'));

document.getElementById('logout-btn').addEventListener('click', async () => {
  await Api.post('/api/auth/logout');
  App.encerrarSessao();
});
