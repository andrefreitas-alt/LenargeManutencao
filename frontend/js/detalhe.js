// js/detalhe.js
// Equivalente ao SolicitacaoDetalheViewModel.cs + SolicitacaoDetalheWindow.xaml.

const Detalhe = {
  async abrir(id) {
    let item;
    try {
      const resp = await Api.get(`/api/solicitacoes/${id}`);
      item = resp.item;
    } catch (err) {
      alert(err.message);
      return;
    }

    const podeEditar = App.usuario.papel === 'Administrador';
    const isAdmin = App.usuario.papel === 'Administrador';
    const podeCancelar = item.status !== 'Cancelado' && item.status !== 'Concluido';
    const tempoTotal = item.tempoResolucaoHoras !== null ? `${item.tempoResolucaoHoras.toFixed(1)}h` : '—';

    const detalhes = [
      ['Solicitante', item.solicitante],
      ['Placa', item.placa],
      ['Local', item.local],
      ['Responsável', item.responsavel],
      ['Prioridade', prioridadeDisplay(item.prioridade)],
      ['Status', statusDisplay(item.status)],
      ['Descrição', item.descricao],
      ['Agendado para', formatarData(item.dataAgendada)],
      ['Solicitado em', formatarData(item.dataAbertura)],
      ['Início', item.dataInicio ? formatarData(item.dataInicio) : '—'],
      ['Conclusão', item.dataConclusao ? formatarData(item.dataConclusao) : '—'],
      ['Tempo total', tempoTotal]
    ];

    const historico = (item.historico || []).map(h => `
      <div class="history-item">
        <div><strong>${h.acao}</strong> — ${h.detalhe}</div>
        <div class="meta">${h.usuario} · ${formatarData(h.data)}</div>
      </div>
    `).join('') || '<div class="history-item">Sem histórico.</div>';

    const botoesStatus = podeEditar ? proximosStatus(item.status).map(st =>
      `<button class="btn btn-secondary btn-sm" data-status="${st}">Mover para: ${statusDisplay(st)}</button>`
    ).join('') : '';

    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-overlay" id="detalhe-overlay">
        <div class="modal-box" style="position:relative">
          <span class="modal-close" id="detalhe-close">✕</span>
          <h2>Solicitação #${item.id}</h2>
          <span class="badge ${STATUS_BADGE_CLASS[item.status]}">${statusDisplay(item.status)}</span>

          <div class="detail-grid">
            ${detalhes.map(([label, valor]) => `
              <div class="detail-row"><div class="label">${label}</div><div class="value">${valor || '—'}</div></div>
            `).join('')}
          </div>

          ${isAdmin ? `
            <div class="field full" style="margin-top:12px">
              <label>Observações internas (visível apenas para Administradores)</label>
              <textarea id="detalhe-observacoes">${item.observacoes || ''}</textarea>
              <div class="form-actions" style="margin-top:8px">
                <button class="btn btn-secondary btn-sm" id="btn-salvar-observacoes">Salvar observações</button>
              </div>
            </div>
          ` : ''}

          ${podeEditar ? `
            <div class="status-actions">
              ${botoesStatus}
              ${podeCancelar ? '<button class="btn btn-danger btn-sm" id="btn-cancelar">Cancelar</button>' : ''}
              <button class="btn btn-secondary btn-sm" id="btn-duplicar">Duplicar</button>
              <button class="btn btn-danger btn-sm" id="btn-excluir">Excluir</button>
            </div>
          ` : ''}

          <div class="history-list">
            <h3 style="font-size:14px;margin:0 0 8px;">Histórico</h3>
            ${historico}
          </div>
        </div>
      </div>
    `;

    const fechar = () => { root.innerHTML = ''; };
    document.getElementById('detalhe-close').addEventListener('click', fechar);
    document.getElementById('detalhe-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'detalhe-overlay') fechar();
    });

    if (isAdmin) {
      document.getElementById('btn-salvar-observacoes').addEventListener('click', async () => {
        const texto = document.getElementById('detalhe-observacoes').value;
        try {
          await Api.post(`/api/solicitacoes/${item.id}/observacoes`, { observacoes: texto });
          alert('Observações salvas.');
        } catch (err) { alert(err.message); }
      });
    }

    if (podeEditar) {
      root.querySelectorAll('[data-status]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await Api.post(`/api/solicitacoes/${item.id}/status`, { status: btn.dataset.status });
            fechar();
            App.recarregarViewAtual();
          } catch (err) { alert(err.message); }
        });
      });

      const btnCancelar = document.getElementById('btn-cancelar');
      if (btnCancelar) btnCancelar.addEventListener('click', async () => {
        if (!confirm('Cancelar essa solicitação?')) return;
        try {
          await Api.post(`/api/solicitacoes/${item.id}/cancelar`);
          fechar();
          App.recarregarViewAtual();
        } catch (err) { alert(err.message); }
      });

      document.getElementById('btn-duplicar').addEventListener('click', async () => {
        try {
          await Api.post(`/api/solicitacoes/${item.id}/duplicar`);
          fechar();
          App.recarregarViewAtual();
        } catch (err) { alert(err.message); }
      });

      document.getElementById('btn-excluir').addEventListener('click', async () => {
        if (!confirm('Excluir essa solicitação permanentemente?')) return;
        try {
          await Api.del(`/api/solicitacoes/${item.id}`);
          fechar();
          App.recarregarViewAtual();
        } catch (err) { alert(err.message); }
      });
    }
  }
};