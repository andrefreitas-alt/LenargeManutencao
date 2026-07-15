// js/novas.js
// Tela exclusiva de Administrador: mostra apenas chamados com status Pendente,
// com controle de "visto" via ícone de binóculo.

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
            <th style="width:36px"></th>
            <th>#</th><th>Solicitante</th><th>Placa</th><th>Tipo</th><th>Local</th>
            <th>Prioridade</th><th>Agendado para</th>
          </tr>
        </thead>
        <tbody id="novas-tbody">
          ${pendentes.map(s => `
            <tr data-id="${s.id}">
              <td>
                <i class="ti ti-eye visto-icon ${s.visto ? 'is-visto' : 'is-nao-visto'}"
                   data-id="${s.id}" data-visto="${s.visto}"
                   title="${s.visto ? 'Esta solicitação foi vista' : 'Esta solicitação ainda não foi vista'}"></i>
              </td>
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

    document.querySelectorAll('.visto-icon').forEach(icon => {
      icon.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = Number(icon.dataset.id);
        const novoValor = icon.dataset.visto !== 'true';
        try {
          await Api.post(`/api/solicitacoes/${id}/visto`, { visto: novoValor });
          App.recarregarViewAtual();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }
};