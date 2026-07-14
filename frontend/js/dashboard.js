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
        <div class="chart-card"><h3>Manutenções por placa</h3><canvas id="chart-placa"></canvas></div>
        <div class="chart-card"><h3>Tempo médio por responsável (h)</h3><canvas id="chart-resp"></canvas></div>
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

    // Paleta minimalista para os gráficos
    const CORES = {
      azul: '#3B82F6',
      verde: '#10B981',
      ambar: '#F59E0B',
      cinza: '#94A3B8',
      vermelho: '#EF4444',
      roxo: '#8B5CF6',
      grid: '#E2E8F0',
      texto: '#64748B'
    };

    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.color = CORES.texto;

    const tooltipComum = {
      backgroundColor: '#0F172A',
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 8,
      displayColors: false
    };

    this._charts.push(new Chart(document.getElementById('chart-mes'), {
      type: 'bar',
      data: {
        labels: data.porMes.labels,
        datasets: [{ data: data.porMes.valores, backgroundColor: CORES.azul, borderRadius: 6, maxBarThickness: 34 }]
      },
      options: {
        plugins: { legend: { display: false }, tooltip: tooltipComum },
        scales: {
          y: { beginAtZero: true, grid: { color: CORES.grid }, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        }
      }
    }));

    const coresStatus = {
      Pendente: CORES.cinza,
      EmAndamento: CORES.azul,
      AguardandoPeca: CORES.ambar,
      Concluido: CORES.verde,
      Cancelado: CORES.vermelho
    };
    this._charts.push(new Chart(document.getElementById('chart-status'), {
      type: 'doughnut',
      data: {
        labels: data.porStatus.map(s => s.label),
        datasets: [{
          data: data.porStatus.map(s => s.valor),
          backgroundColor: data.porStatus.map(s => coresStatus[s.status]),
          borderWidth: 0
        }]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11.5 } } },
          tooltip: tooltipComum
        }
      }
    }));

    this._charts.push(new Chart(document.getElementById('chart-tipo'), {
      type: 'bar',
      data: { labels: data.porTipo.labels, datasets: [{ data: data.porTipo.valores, backgroundColor: CORES.roxo, borderRadius: 6, maxBarThickness: 20 }] },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: tooltipComum },
        scales: {
          x: { beginAtZero: true, grid: { color: CORES.grid }, ticks: { precision: 0 } },
          y: { grid: { display: false } }
        }
      }
    }));

    this._charts.push(new Chart(document.getElementById('chart-local'), {
      type: 'bar',
      data: { labels: data.porLocal.labels, datasets: [{ data: data.porLocal.valores, backgroundColor: CORES.ambar, borderRadius: 6, maxBarThickness: 20 }] },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: tooltipComum },
        scales: {
          x: { beginAtZero: true, grid: { color: CORES.grid }, ticks: { precision: 0 } },
          y: { grid: { display: false } }
        }
      }
    }));

    this._charts.push(new Chart(document.getElementById('chart-placa'), {
      type: 'bar',
      data: { labels: data.porPlaca.labels, datasets: [{ data: data.porPlaca.valores, backgroundColor: CORES.vermelho, borderRadius: 6, maxBarThickness: 20 }] },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: tooltipComum },
        scales: {
          x: { beginAtZero: true, grid: { color: CORES.grid }, ticks: { precision: 0 } },
          y: { grid: { display: false } }
        }
      }
    }));

    this._charts.push(new Chart(document.getElementById('chart-resp'), {
      type: 'bar',
      data: { labels: data.tempoPorResponsavel.labels, datasets: [{ data: data.tempoPorResponsavel.valores, backgroundColor: CORES.verde, borderRadius: 6, maxBarThickness: 20 }] },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: tooltipComum },
        scales: {
          x: { beginAtZero: true, grid: { color: CORES.grid } },
          y: { grid: { display: false } }
        }
      }
    }));
  }
};