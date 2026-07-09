// js/app.js
// Equivalente ao MainViewModel.cs (navegacao entre telas) + MainWindow.xaml.

const App = {
  usuario: null,
  viewAtual: 'dashboard',

  async init() {
    try {
      const { usuario } = await Api.get('/api/auth/me');
      this.iniciarSessao(usuario);
    } catch (_) {
      this.mostrarTela('login-screen');
    }

    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.view));
    });
  },

  mostrarTela(id) {
    ['login-screen', 'signup-screen', 'app-shell'].forEach(s => {
      document.getElementById(s).classList.toggle('hidden', s !== id);
    });
  },

  iniciarSessao(usuario) {
    this.usuario = usuario;
    const isAdmin = usuario.papel === 'Administrador';

    document.getElementById('user-name').textContent = usuario.nome;
    document.getElementById('user-role').textContent = usuario.papel;
    document.getElementById('user-avatar').textContent = (usuario.nome || '?').charAt(0).toUpperCase();
    document.getElementById('nav-config').classList.toggle('hidden', !isAdmin);

    this.mostrarTela('app-shell');
    this.navigate('dashboard');
  },

  encerrarSessao() {
    this.usuario = null;
    document.getElementById('login-form').reset();
    this.mostrarTela('login-screen');
  },

  async navigate(destino) {
    if (destino === 'config' && this.usuario.papel !== 'Administrador') destino = 'dashboard';

    this.viewAtual = destino;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === destino);
    });

    const titulos = { dashboard: 'Dashboard', nova: 'Nova solicitacao', lista: 'Pesquisar / Lista', config: 'Configuracoes' };
    document.getElementById('view-title').textContent = titulos[destino] || 'Dashboard';

    const container = document.getElementById('view-content');
    container.innerHTML = '<p style="color:var(--text-muted)">Carregando...</p>';

    try {
      switch (destino) {
        case 'nova': await NovaSolicitacao.render(container); break;
        case 'lista': await ListaSolicitacoes.render(container); break;
        case 'config': await Config.render(container); break;
        default: await Dashboard.render(container); break;
      }
    } catch (err) {
      container.innerHTML = `<div class="message error">${err.message}</div>`;
    }
  },

  recarregarViewAtual() {
    this.navigate(this.viewAtual);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
