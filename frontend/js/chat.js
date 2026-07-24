// js/chat.js
// Chat interno de suporte: Admin <-> Solicitante.

const Chat = {
  _conversaAtualId: null,
  _minhasSolicitacoes: [],

  async render(container) {
    const isAdmin = App.usuario.papel === 'Administrador';
    if (isAdmin) {
      await this._renderAdmin(container);
    } else {
      await this._renderSolicitante(container);
    }
  },

  async _renderAdmin(container) {
    const [{ conversas }, { solicitantes }] = await Promise.all([
      Api.get('/api/chat/conversas'),
      Api.get('/api/chat/solicitantes')
    ]);

    const conversaIds = new Set(conversas.map(c => c.solicitanteId));
    const semConversa = solicitantes.filter(s => !conversaIds.has(s.id));

    container.innerHTML = `
      <div class="chat-layout">
        <div class="chat-sidebar">
          <div class="chat-sidebar-header">Conversas</div>
          <div class="chat-conv-list" id="chat-conv-list">
            ${conversas.map(c => `
              <div class="chat-conv-item" data-id="${c.solicitanteId}">
                <div class="chat-conv-name">${c.solicitanteNome}</div>
                <div class="chat-conv-preview">${(c.ultimaMensagem || '').substring(0, 40)}</div>
                ${c.naoLidas > 0 ? `<span class="badge-count">${c.naoLidas}</span>` : ''}
              </div>
            `).join('') || '<div class="chat-empty-hint">Nenhuma conversa ainda.</div>'}
          </div>
          <div class="chat-sidebar-header">Iniciar nova conversa</div>
          <div class="chat-conv-list">
            ${semConversa.map(s => `
              <div class="chat-conv-item chat-conv-item-new" data-id="${s.id}">
                <div class="chat-conv-name">${s.nome}</div>
              </div>
            `).join('') || '<div class="chat-empty-hint">Todos já têm conversa iniciada.</div>'}
          </div>
        </div>
        <div class="chat-main" id="chat-main">
          <div class="chat-empty-hint" style="padding:40px;text-align:center;">Selecione uma conversa ao lado.</div>
        </div>
      </div>
    `;

    container.querySelectorAll('.chat-conv-item').forEach(el => {
      el.addEventListener('click', () => this._abrirConversaAdmin(Number(el.dataset.id)));
    });
  },

  async _abrirConversaAdmin(solicitanteId) {
    this._conversaAtualId = solicitanteId;
    const [{ mensagens }, { itens }] = await Promise.all([
      Api.get(`/api/chat/${solicitanteId}`),
      Api.get('/api/solicitacoes')
    ]);
    this._minhasSolicitacoes = itens.filter(s => s.criadoPorUsuarioId === solicitanteId);

    const main = document.getElementById('chat-main');
    main.innerHTML = this._templateThread(mensagens, true);
    this._bindThreadEvents(true, solicitanteId);
  },

  async _renderSolicitante(container) {
    let mensagens = [];
    let conversaExiste = true;
    try {
      const resp = await Api.get('/api/chat/minha');
      mensagens = resp.mensagens;
      conversaExiste = mensagens.length > 0;
    } catch (_) { conversaExiste = false; }

    container.innerHTML = `
      <div class="chat-layout chat-layout-single">
        <div class="chat-main">
          ${conversaExiste || mensagens.length > 0
            ? this._templateThread(mensagens, false)
            : `<div class="chat-empty-hint" style="padding:40px;text-align:center;">Aguarde o administrador iniciar a conversa.</div>`}
        </div>
      </div>
    `;
    if (mensagens.length > 0) this._bindThreadEvents(false, App.usuario.id);
  },

  _templateThread(mensagens, isAdmin) {
    const opcoesSolicitacoes = isAdmin
      ? `<option value="">Mencionar solicitação (opcional)</option>` +
        this._minhasSolicitacoes.map(s => `<option value="${s.id}">#${s.id} — ${s.tipo || ''}</option>`).join('')
      : '';

    return `
      <div class="chat-thread" id="chat-thread">
        ${mensagens.map(m => this._templateMensagem(m)).join('')}
      </div>
      <form class="chat-composer" id="chat-composer">
        ${isAdmin ? `<select id="chat-mencao">${opcoesSolicitacoes}</select>` : ''}
        <div class="chat-composer-row">
          <input type="text" id="chat-input" placeholder="Digite sua mensagem..." autocomplete="off">
          <button type="submit" class="btn btn-primary btn-sm">Enviar</button>
        </div>
      </form>
    `;
  },

  _templateMensagem(m) {
    const souEu = m.remetenteUsuarioId === App.usuario.id;
    return `
      <div class="chat-bubble-row ${souEu ? 'chat-bubble-row-mine' : ''}">
        <div class="chat-bubble ${souEu ? 'chat-bubble-mine' : ''}">
          ${m.solicitacaoRefId ? `<div class="chat-bubble-ref" data-id="${m.solicitacaoRefId}">📎 Solicitação #${m.solicitacaoRefId}</div>` : ''}
          <div class="chat-bubble-text">${this._escapeHtml(m.mensagem)}</div>
          <div class="chat-bubble-meta">${m.remetenteNome} · ${formatarData(m.criadoEm)}</div>
        </div>
      </div>
    `;
  },

  _escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  },

  _bindThreadEvents(isAdmin, solicitanteId) {
    const thread = document.getElementById('chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;

    document.querySelectorAll('.chat-bubble-ref').forEach(el => {
      el.addEventListener('click', () => Detalhe.abrir(Number(el.dataset.id)));
    });

    const form = document.getElementById('chat-composer');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const texto = input.value.trim();
      if (!texto) return;

      try {
        let mensagens;
        if (isAdmin) {
          const mencaoEl = document.getElementById('chat-mencao');
          const solicitacaoRefId = mencaoEl && mencaoEl.value ? Number(mencaoEl.value) : null;
          const resp = await Api.post(`/api/chat/${solicitanteId}`, { mensagem: texto, solicitacaoRefId });
          mensagens = resp.mensagens;
        } else {
          const resp = await Api.post('/api/chat/minha', { mensagem: texto });
          mensagens = resp.mensagens;
        }
        input.value = '';
        const main = document.getElementById('chat-main');
        main.innerHTML = this._templateThread(mensagens, isAdmin);
        this._bindThreadEvents(isAdmin, solicitanteId);
      } catch (err) {
        alert(err.message);
      }
    });
  }
};