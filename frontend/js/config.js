// js/config.js
// Equivalente ao ConfiguracoesViewModel.cs + ConfiguracoesView.xaml.

const Config = {
  async render(container) {
    container.innerHTML = `
      <div class="config-section">
        <h3>Tipos de solicitação</h3>
        <div class="chip-list" id="tipos-chips"></div>
        <div class="add-inline">
          <input type="text" id="novo-tipo" placeholder="Novo tipo...">
          <button class="btn btn-primary btn-sm" id="add-tipo">Adicionar</button>
        </div>
      </div>

      <div class="config-section">
        <h3>Locais</h3>
        <div class="chip-list" id="locais-chips"></div>
        <div class="add-inline">
          <input type="text" id="novo-local" placeholder="Novo local...">
          <button class="btn btn-primary btn-sm" id="add-local">Adicionar</button>
        </div>
      </div>

      <div class="config-section">
        <h3>Usuários</h3>
        <div id="usuarios-msg"></div>
        <table style="margin-bottom:16px;">
          <thead><tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Papel</th><th></th></tr></thead>
          <tbody id="usuarios-tbody"></tbody>
        </table>
        <div class="form-grid" style="max-width:600px;">
          <div class="field"><label>Nome</label><input type="text" id="novo-usuario-nome"></div>
          <div class="field"><label>Login</label><input type="text" id="novo-usuario-login"></div>
          <div class="field"><label>E-mail</label><input type="email" id="novo-usuario-email"></div>
          <div class="field"><label>Telefone</label><input type="text" id="novo-usuario-telefone" placeholder="(31) 91234-5678"></div>
          <div class="field"><label>Senha</label><input type="password" id="novo-usuario-senha"></div>
          <div class="field">
            <label>Papel</label>
            <select id="novo-usuario-papel">
              <option value="Solicitante">Solicitante</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-usuario">Criar usuário</button>
      </div>
    `;

    formatarTelefoneInput(document.getElementById('novo-usuario-telefone'));

    document.getElementById('add-tipo').addEventListener('click', () => this._adicionarTipo());
    document.getElementById('add-local').addEventListener('click', () => this._adicionarLocal());
    document.getElementById('add-usuario').addEventListener('click', () => this._criarUsuario());

    await this._recarregar();
  },

  async _recarregar() {
    const [tiposResp, locaisResp, usuariosResp] = await Promise.all([
      Api.get('/api/cadastro/tipos'),
      Api.get('/api/cadastro/locais'),
      Api.get('/api/usuarios')
    ]);

    document.getElementById('tipos-chips').innerHTML = tiposResp.itens.map(t => `
      <div class="chip">${t.nome} <span class="remove" data-id="${t.id}" data-kind="tipo">✕</span></div>
    `).join('') || '<span style="color:var(--text-muted)">Nenhum tipo cadastrado.</span>';

    document.getElementById('locais-chips').innerHTML = locaisResp.itens.map(l => `
      <div class="chip">${l.nome} <span class="remove" data-id="${l.id}" data-kind="local">✕</span></div>
    `).join('') || '<span style="color:var(--text-muted)">Nenhum local cadastrado.</span>';

    document.querySelectorAll('.remove').forEach(el => {
      el.addEventListener('click', () => this._remover(el.dataset.kind, Number(el.dataset.id)));
    });

    document.getElementById('usuarios-tbody').innerHTML = usuariosResp.itens.map(u => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.nomeUsuario}</td>
        <td>${u.email}</td>
        <td>${u.papel}</td>
        <td style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" data-senha="${u.id}">Redefinir senha</button>
          <button class="btn btn-danger btn-sm" data-excluir="${u.id}">Excluir</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-senha]').forEach(btn => {
      btn.addEventListener('click', () => this._redefinirSenha(Number(btn.dataset.senha)));
    });
    document.querySelectorAll('[data-excluir]').forEach(btn => {
      btn.addEventListener('click', () => this._excluirUsuario(Number(btn.dataset.excluir)));
    });
  },

  async _adicionarTipo() {
    const input = document.getElementById('novo-tipo');
    if (!input.value.trim()) return;
    try {
      await Api.post('/api/cadastro/tipos', { nome: input.value });
      input.value = '';
      await this._recarregar();
    } catch (err) { alert(err.message); }
  },

  async _adicionarLocal() {
    const input = document.getElementById('novo-local');
    if (!input.value.trim()) return;
    try {
      await Api.post('/api/cadastro/locais', { nome: input.value });
      input.value = '';
      await this._recarregar();
    } catch (err) { alert(err.message); }
  },

  async _remover(kind, id) {
    if (!confirm('Remover este item?')) return;
    await Api.del(`/api/cadastro/${kind === 'tipo' ? 'tipos' : 'locais'}/${id}`);
    await this._recarregar();
  },

  async _criarUsuario() {
    showMessage('usuarios-msg', '');
    const body = {
      nome: document.getElementById('novo-usuario-nome').value,
      nomeUsuario: document.getElementById('novo-usuario-login').value,
      email: document.getElementById('novo-usuario-email').value,
      telefone: document.getElementById('novo-usuario-telefone').value,
      senha: document.getElementById('novo-usuario-senha').value,
      papel: document.getElementById('novo-usuario-papel').value
    };
    try {
      await Api.post('/api/usuarios', body);
      ['nome', 'login', 'email', 'telefone', 'senha'].forEach(f => document.getElementById(`novo-usuario-${f}`).value = '');
      await this._recarregar();
    } catch (err) {
      showMessage('usuarios-msg', err.message);
    }
  },

  async _redefinirSenha(id) {
    const novaSenha = prompt('Nova senha (mínimo 6 caracteres):');
    if (!novaSenha) return;
    try {
      await Api.post(`/api/usuarios/${id}/senha`, { novaSenha });
      alert('Senha redefinida.');
    } catch (err) { alert(err.message); }
  },

  async _excluirUsuario(id) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await Api.del(`/api/usuarios/${id}`);
      await this._recarregar();
    } catch (err) { alert(err.message); }
  }
};
