// js/minhas.js
// Tela "Minhas Solicitações": mostra apenas as solicitações criadas pelo usuário logado (qualquer papel).

const MinhasSolicitacoes = {
  async render(container) {
    const { itens } = await Api.get('/api/solicitacoes');
    const minhas = itens
      .filter(s => s.criadoPorUsuarioId === App.usuario.id)
      .sort((a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada));

    if (minhas.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted)">Você ainda não criou nenhuma solicitação.</p>`;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th><th>Placa</th><th>Tipo</th><th>Local</th>
            <th>Prioridade</th><th>Status</th><th>Agendado para</th>
          </tr>
        </thead>
        <tbody id="minhas-tbody">
          ${minhas.map(s => `
            <tr data-id="${s.id}">
              <td>#${s.id}</td>
              <td>${s.placa || '—'}</td>
              <td>${s.tipo || '—'}</td>
              <td>${s.local || '—'}</td>
              <td><span class="badge badge-prioridade ${PRIORIDADE_CLASS[s.prioridade]}">${prioridadeDisplay(s.prioridade)}</span></td>
              <td><span class="badge ${STATUS_BADGE_CLASS[s.status]}">${statusDisplay(s.status)}</span></td>
              <td>${formatarData(s.dataAgendada)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.querySelectorAll('#minhas-tbody tr').forEach(tr => {
      tr.addEventListener('click', () => Detalhe.abrir(Number(tr.dataset.id)));
    });
  }
};