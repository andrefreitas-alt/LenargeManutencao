// js/novas.js
// Tela exclusiva de Administrador: mostra apenas chamados com status Pendente.

const NovasSolicitacoes = {
  async render(container) {
    const { itens } = await Api.get('/api/solicitacoes');
    const pendentes = itens
      .filter(s => s.status === 'Pendente')
      .sort((a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada));

    if (pendentes.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted)">Nenhum chamado novo no momento.</p>`;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th><th>Solicitante</th><th>Placa</th><th>Tipo</th><th>Local</th>
            <th>Prioridade</th><th>Agendado para</th>
          </tr>
        </thead>
        <tbody id="novas-tbody">
          ${pendentes.map(s => `
            <tr data-id="${s.id}">
              <td>#${s.id}</td>
              <td>${s.solicitante || '—'}</td>
              <td>${s.placa || '—'}</td>
              <td>${s.tipo || '—'}</td>
              <td>${s.local || '—'}</td>
              <td><span class="badge badge-prioridade ${PRIORIDADE_CLASS[s.prioridade]}">${prioridadeDisplay(s.prioridade)}</span></td>
              <td>${formatarData(s.dataAgendada)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.querySelectorAll('#novas-tbody tr').forEach(tr => {
      tr.addEventListener('click', () => Detalhe.abrir(Number(tr.dataset.id)));
    });
  }
};