// js/lista.js
// Equivalente ao ListaSolicitacoesViewModel.cs + ListaSolicitacoesView.xaml.

const ListaSolicitacoes = {
  _todas: [],

  async render(container) {
    const [itensResp, tiposResp, locaisResp] = await Promise.all([
      Api.get('/api/solicitacoes'),
      Api.get('/api/cadastro/tipos'),
      Api.get('/api/cadastro/locais')
    ]);

    this._todas = itensResp.itens;

    const opcoesStatus = ['Todos', ...Object.keys(STATUS_DISPLAY)]
      .map(s => `<option value="${s}">${s === 'Todos' ? 'Todos' : statusDisplay(s)}</option>`).join('');
    const opcoesTipo = ['Todos', ...tiposResp.itens.map(t => t.nome)]
      .map(t => `<option value="${t}">${t}</option>`).join('');
    const opcoesLocal = ['Todos', ...locaisResp.itens.map(l => l.nome)]
      .map(l => `<option value="${l}">${l}</option>`).join('');

    container.innerHTML = `
      <div class="filters-bar">
        <div class="field">
          <label>Buscar</label>
          <input type="text" id="filtro-texto" placeholder="Placa, solicitante ou descrição...">
        </div>
        <div class="field">
          <label>Status</label>
          <select id="filtro-status">${opcoesStatus}</select>
        </div>
        <div class="field">
          <label>Tipo</label>
          <select id="filtro-tipo">${opcoesTipo}</select>
        </div>
        <div class="field">
          <label>Local</label>
          <select id="filtro-local">${opcoesLocal}</select>
        </div>
        <div class="field">
          <label>Agendado de</label>
          <input type="date" id="filtro-data-inicial">
        </div>
        <div class="field">
          <label>Agendado até</label>
          <input type="date" id="filtro-data-final">
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Solicitante</th><th>Placa</th><th>Tipo</th><th>Local</th>
            <th>Prioridade</th><th>Status</th><th>Agendado para</th>
          </tr>
        </thead>
        <tbody id="lista-tbody"></tbody>
      </table>
    `;

    const ids = ['filtro-texto', 'filtro-status', 'filtro-tipo', 'filtro-local', 'filtro-data-inicial', 'filtro-data-final'];
    ids.forEach(id => document.getElementById(id).addEventListener('input', () => this._aplicarFiltro()));

    this._aplicarFiltro();
  },

  _aplicarFiltro() {
    const texto = (document.getElementById('filtro-texto').value || '').trim().toLowerCase();
    const status = document.getElementById('filtro-status').value;
    const tipo = document.getElementById('filtro-tipo').value;
    const local = document.getElementById('filtro-local').value;
    const dataInicial = document.getElementById('filtro-data-inicial').value;
    const dataFinal = document.getElementById('filtro-data-final').value;

    let itens = this._todas;

    if (texto) {
      itens = itens.filter(s =>
        (s.placa || '').toLowerCase().includes(texto) ||
        (s.solicitante || '').toLowerCase().includes(texto) ||
        (s.descricao || '').toLowerCase().includes(texto)
      );
    }
    if (status !== 'Todos') itens = itens.filter(s => s.status === status);
    if (tipo !== 'Todos') itens = itens.filter(s => s.tipo === tipo);
    if (local !== 'Todos') itens = itens.filter(s => s.local === local);
    if (dataInicial) itens = itens.filter(s => new Date(s.dataAgendada) >= new Date(dataInicial));
    if (dataFinal) itens = itens.filter(s => new Date(s.dataAgendada) <= new Date(dataFinal + 'T23:59:59'));

    const tbody = document.getElementById('lista-tbody');
    if (itens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">Nenhuma solicitação encontrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = itens.map(s => `
      <tr data-id="${s.id}">
        <td>#${s.id}</td>
        <td>${s.solicitante || '—'}</td>
        <td>${s.placa || '—'}</td>
        <td>${s.tipo || '—'}</td>
        <td>${s.local || '—'}</td>
        <td><span class="badge badge-prioridade ${PRIORIDADE_CLASS[s.prioridade]}">${prioridadeDisplay(s.prioridade)}</span></td>
        <td><span class="badge ${STATUS_BADGE_CLASS[s.status]}">${statusDisplay(s.status)}</span></td>
        <td>${formatarData(s.dataAgendada)}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => Detalhe.abrir(Number(tr.dataset.id)));
    });
  }
};