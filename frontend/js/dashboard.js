// js/dashboard.js
// Equivalente ao DashboardViewModel.cs + DashboardView.xaml.
// Onde o original usava OxyPlot (PlotModel/Series/Axes), aqui usamos Chart.js.

const Dashboard = {
  _charts: [],

  async render(container) {
    container.innerHTML = `
      <div class="cards-row">
        <div class="card"><div class="card-label">Total</div><div class="card-value" id="dash-total">—</div></div>
        <div class="card"><div class="card-label">Concluídos</div><div class="card-value success" id="dash-concluidos">—</div></div>
        <div class="card"><div class="card-label">Em andamento</div><div class="card-value primary" id="dash-andamento">—</div></div>
        <div class="card"><div class="card-label">Pendentes</div><div class="card-value warning" id="dash-pendentes">—</div></div>
        <div class="card"><div class="card-label">Tempo médio</div><div class="card-value" id="dash-tempo">—</div></div>
      </div>
      <div class="charts-grid">
        <div class="chart-card"><h3>Solicitações por mês</h3><canvas id="chart-mes"></canvas></div>
        <div class="chart-card"><h3>Por status</h3><canvas id="chart-status"></canvas></div>
        <div class="chart-card"><h3>Por tipo de solicitação</h3><canvas id="chart-tipo"></canvas></div>
        <div class="chart-card"><h3>Por local</h3><canvas id="chart-local"></canvas></div>
        <div class="chart-card" style="grid-column: 1 / -1;"><h3>Tempo médio por responsável (h)</h3><canvas id="chart-resp"></canvas></div>
      </div>
    `;

    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const data = await Api.get('/api/dashboard');

    document.getElementById('dash-total').textContent = data.total;
    document.getElementById('dash-concluidos').textContent = data.concluidos;
    document.getElementById('dash-andamento').textContent = data.emAndamento;
    document.getElementById('dash-pendentes').textContent = data.pendentes;
    document.getElementById('dash-tempo').textContent = data.tempoMedioTexto;

    const CORES = {
      primaria: '#ED1B24',
      sucesso: '#137A3A',
      alerta: '#9A5B00',
      neutra: '#5C5252',
      perigo: '#B3141C'
    };

    this._charts.push(new Chart(document.getElementById('chart-mes'), {
      type: 'bar',
      data: {
        labels: data.porMes.labels,
        datasets: [{ data: data.porMes.valores, backgroundColor: CORES.primaria, borderRadius: 4 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    }));

    const coresStatus = { Pendente: CORES.neutra, EmAndamento: CORES.primaria, AguardandoPeca: CORES.alerta, Concluido: CORES.sucesso, Cancelado: CORES.perigo };
    this._charts.push(new Chart(document.getElementById('chart-status'), {
      type: 'pie',
      data: {
        labels: data.porStatus.map(s => s.label),
        datasets: [{ data: data.porStatus.map(s => s.valor), backgroundColor: data.porStatus.map(s => coresStatus[s.status]) }]
      }
    }));

    this._charts.push(new Chart(document.getElementById('chart-tipo'), {
      type: 'bar',
      data: { labels: data.porTipo.labels, datasets: [{ data: data.porTipo.valores, backgroundColor: CORES.primaria, borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    }));

    this._charts.push(new Chart(document.getElementById('chart-local'), {
      type: 'bar',
      data: { labels: data.porLocal.labels, datasets: [{ data: data.porLocal.valores, backgroundColor: CORES.alerta, borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    }));

    this._charts.push(new Chart(document.getElementById('chart-resp'), {
      type: 'bar',
      data: { labels: data.tempoPorResponsavel.labels, datasets: [{ data: data.tempoPorResponsavel.valores, backgroundColor: CORES.sucesso, borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    }));
  }
};
