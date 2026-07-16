// js/minhas.js
// Tela "Minhas Solicitações": mostra apenas as solicitações criadas pelo usuário logado (qualquer papel).
// O ícone de "visto" (olho) aparece para todos, mas só o Administrador pode clicar para alternar.

const MinhasSolicitacoes = {
  async render(container) {
    const { itens } = await Api.get('/api/solicitacoes');
    const minhas = itens
      .filter(s => s.criadoPorUsuarioId === App.usuario.id)
      .sort((a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada));

    const isAdmin = App.usuario.papel === 'Administrador';

    if (minhas.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted)">Você ainda não criou nenhuma solicitação.</p>`;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th style="width:36px"></th>
            <th>#</th><th>Placa</th><th>Tipo</th><th>Local</th>
            <th>Prioridade</th><th>Status</th><th>Agendado para</th>
          </tr>
        </thead>
        <tbody id="minhas-tbody">
          ${minhas.map(s => `
            <tr data-id="${s.id}">
              <td>
                <i class="ti ti-eye visto-icon ${s.visto ? 'is-visto' : 'is-nao-visto'} ${isAdmin ? '' : 'visto-icon-readonly'}"
                   data-id="${s.id}" data-visto="${s.visto}"
                   title="${s.visto ? 'Esta solicitação foi vista' : 'Esta solicitação ainda não foi vista'}"></i>
              </td>
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

    if (isAdmin) {
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
  }
};