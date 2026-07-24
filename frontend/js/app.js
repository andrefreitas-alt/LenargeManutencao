// js/app.js
// Equivalente ao MainViewModel.cs (navegacao entre telas) + MainWindow.xaml.

const App = {
  usuario: null,
  viewAtual: 'dashboard',
  _pollTimer: null,
  _pollTimerChat: null,
  _novasVistas: new Set(JSON.parse(localStorage.getItem('novasVistasIds') || '[]')),

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

    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      const collapsed = localStorage.getItem('sidebarCollapsed') === '1';
      document.getElementById('app-shell').classList.toggle('sidebar-collapsed', collapsed);
      toggleBtn.addEventListener('click', () => {
        const shell = document.getElementById('app-shell');
        const isCollapsed = shell.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
      });
    }
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
    document.getElementById('nav-novas').classList.toggle('hidden', !isAdmin);

    this.mostrarTela('app-shell');
    this.navigate('dashboard');

    if (isAdmin) {
      this._seedNovasVistasEIniciarPolling();
    }
    this._iniciarPollingChat();
  },

  encerrarSessao() {
    this.usuario = null;
    this._pararPolling();
    this._pararPollingChat();
    document.getElementById('login-form').reset();
    this.mostrarTela('login-screen');
  },

  async navigate(destino) {
    if ((destino === 'config' || destino === 'novas') && this.usuario.papel !== 'Administrador') destino = 'dashboard';

    this.viewAtual = destino;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === destino);
    });

    const titulos = {
      dashboard: 'Dashboard',
      nova: 'Nova solicitacao',
      lista: 'Pesquisar / Lista',
      novas: 'Novas Solicitações',
      minhas: 'Minhas Solicitações',
      chat: 'Chat',
      config: 'Configuracoes'
    };
    document.getElementById('view-title').textContent = titulos[destino] || 'Dashboard';

    const container = document.getElementById('view-content');
    container.innerHTML = '<p style="color:var(--text-muted)">Carregando...</p>';

    try {
      switch (destino) {
        case 'nova': await NovaSolicitacao.render(container); break;
        case 'lista': await ListaSolicitacoes.render(container); break;
        case 'novas': await NovasSolicitacoes.render(container); break;
        case 'minhas': await MinhasSolicitacoes.render(container); break;
        case 'chat': await Chat.render(container); break;
        case 'config': await Config.render(container); break;
        default: await Dashboard.render(container); break;
      }
    } catch (err) {
      container.innerHTML = `<div class="message error">${err.message}</div>`;
    }
  },

  recarregarViewAtual() {
    this.navigate(this.viewAtual);
  },

  // ===================== NOTIFICAÇÃO DE NOVOS CHAMADOS (SÓ ADMIN) =====================

  async _seedNovasVistasEIniciarPolling() {
    try {
      const { itens } = await Api.get('/api/solicitacoes');
      const pendentesIds = itens.filter(s => s.status === 'Pendente').map(s => s.id);

      if (this._novasVistas.size === 0 && pendentesIds.length > 0) {
        pendentesIds.forEach(id => this._novasVistas.add(id));
        localStorage.setItem('novasVistasIds', JSON.stringify([...this._novasVistas]));
      }
      this._atualizarBadgeNovas(pendentesIds.length);
    } catch (_) { /* ignora falha inicial, o polling tenta de novo */ }

    this._iniciarPolling();
  },

  _iniciarPolling() {
    this._pararPolling();
    this._pollTimer = setInterval(() => this._verificarNovasSolicitacoes(), 25000);
  },

  _pararPolling() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  },

  async _verificarNovasSolicitacoes() {
    try {
      const { itens } = await Api.get('/api/solicitacoes');
      const pendentes = itens.filter(s => s.status === 'Pendente');

      this._atualizarBadgeNovas(pendentes.length);

      const novas = pendentes.filter(s => !this._novasVistas.has(s.id));
      novas.forEach(s => {
        this._novasVistas.add(s.id);
        this._mostrarPopupNovoChamado(s);
      });
      if (novas.length > 0) {
        localStorage.setItem('novasVistasIds', JSON.stringify([...this._novasVistas]));
      }
    } catch (_) { /* silencioso, a próxima verificação tenta de novo */ }
  },

  _atualizarBadgeNovas(qtd) {
    const badge = document.getElementById('novas-badge');
    if (!badge) return;
    if (qtd > 0) {
      badge.textContent = qtd;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  _mostrarPopupNovoChamado(item) {
    this._mostrarToast(`🆕 Novo chamado #${item.id}`, `${item.solicitante || 'Solicitante'} — ${item.tipo || ''}`, () => this.navigate('novas'));
  },

  // ===================== NOTIFICAÇÃO DE CHAT (TODOS OS USUÁRIOS) =====================

  _chatNaoLidasAnterior: 0,

  _iniciarPollingChat() {
    this._pararPollingChat();
    this._verificarChat();
    this._pollTimerChat = setInterval(() => this._verificarChat(), 25000);
  },

  _pararPollingChat() {
    if (this._pollTimerChat) { clearInterval(this._pollTimerChat); this._pollTimerChat = null; }
  },

  async _verificarChat() {
    try {
      const { total } = await Api.get('/api/chat/nao-lidas');
      const badge = document.getElementById('chat-badge');
      if (badge) {
        if (total > 0) { badge.textContent = total; badge.classList.remove('hidden'); }
        else { badge.classList.add('hidden'); }
      }
      if (total > this._chatNaoLidasAnterior) {
        this._mostrarToast('💬 Nova mensagem no chat', 'Você recebeu uma nova mensagem.', () => this.navigate('chat'));
      }
      this._chatNaoLidasAnterior = total;
    } catch (_) { /* silencioso */ }
  },

  _mostrarToast(titulo, corpo, aoClicar) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-title">${titulo}</div>
      <div class="toast-body">${corpo}</div>
    `;
    toast.addEventListener('click', () => { aoClicar(); toast.remove(); });
    root.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());