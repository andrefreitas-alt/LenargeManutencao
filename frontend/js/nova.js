// js/nova.js
// Equivalente ao NovaSolicitacaoViewModel.cs + NovaSolicitacaoView.xaml.

const NovaSolicitacao = {
  async render(container) {
    const [tiposResp, locaisResp] = await Promise.all([
      Api.get('/api/cadastro/tipos'),
      Api.get('/api/cadastro/locais')
    ]);

    const opcoesTipos = tiposResp.itens.map(t => `<option value="${t.nome}">${t.nome}</option>`).join('');
    const opcoesLocais = locaisResp.itens.map(l => `<option value="${l.nome}">${l.nome}</option>`).join('');
    const opcoesPrioridade = Object.entries(PRIORIDADE_DISPLAY)
      .map(([valor, label]) => `<option value="${valor}" ${valor === 'Media' ? 'selected' : ''}>${label}</option>`).join('');

    container.innerHTML = `
      <div class="form-card">
        <div id="nova-msg"></div>
        <form id="nova-form">
          <div class="form-grid">
            <div class="field">
              <label>Solicitante *</label>
              <input type="text" id="nova-solicitante" required>
            </div>
            <div class="field">
              <label>Placa (opcional)</label>
              <input type="text" id="nova-placa" placeholder="Ex: ABC1D23">
            </div>
            <div class="field">
              <label>Local *</label>
              <select id="nova-local" required><option value="">Selecione...</option>${opcoesLocais}</select>
            </div>
            <div class="field">
              <label>Tipo *</label>
              <select id="nova-tipo" required><option value="">Selecione...</option>${opcoesTipos}</select>
            </div>
            <div class="field">
              <label>Data agendada *</label>
              <input type="date" id="nova-data-agendada" required>
            </div>
            <div class="field">
              <label>Horário agendado *</label>
              <input type="time" id="nova-hora-agendada" required>
            </div>
            <div class="field">
              <label>Responsável</label>
              <input type="text" id="nova-responsavel">
            </div>
            <div class="field">
              <label>Prioridade</label>
              <select id="nova-prioridade">${opcoesPrioridade}</select>
            </div>
            <div class="field full">
              <label>Descrição</label>
              <textarea id="nova-descricao"></textarea>
            </div>
            <div class="field full">
              <label>Observações</label>
              <textarea id="nova-observacoes"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Criar solicitação</button>
            <button type="button" class="btn btn-secondary" id="nova-limpar">Limpar</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById('nova-form');
    const limpar = () => form.reset();

    document.getElementById('nova-limpar').addEventListener('click', limpar);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showMessage('nova-msg', '');

      const data = document.getElementById('nova-data-agendada').value;
      const hora = document.getElementById('nova-hora-agendada').value;

      if (!data || !hora) {
        showMessage('nova-msg', 'Informe a data e o horário agendados.');
        return;
      }

      const dataAgendada = new Date(`${data}T${hora}:00`).toISOString();

      const body = {
        solicitante: document.getElementById('nova-solicitante').value,
        placa: document.getElementById('nova-placa').value,
        local: document.getElementById('nova-local').value,
        tipo: document.getElementById('nova-tipo').value,
        responsavel: document.getElementById('nova-responsavel').value,
        prioridade: document.getElementById('nova-prioridade').value,
        descricao: document.getElementById('nova-descricao').value,
        observacoes: document.getElementById('nova-observacoes').value,
        dataAgendada
      };

      try {
        await Api.post('/api/solicitacoes', body);
        showMessage('nova-msg', 'Solicitação criada com sucesso.', 'success');
        limpar();
        App.navigate('lista');
      } catch (err) {
        showMessage('nova-msg', err.message);
      }
    });
  }
};