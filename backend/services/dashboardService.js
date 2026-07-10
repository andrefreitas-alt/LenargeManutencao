// services/dashboardService.js
// Equivalente aos CÁLCULOS do ViewModels/DashboardViewModel.cs original.

const solicitacaoService = require('./solicitacaoService');
const cadastroService = require('./cadastroService');
const { STATUS_DISPLAY } = require('./enums');

// Adicionado async na função principal
async function obterDashboard(usuarioAtual) {
  // Adicionado await para esperar os dados assíncronos do banco PostgreSQL
  const solicitacoes = await solicitacaoService.obterTodas(usuarioAtual);

  const total = solicitacoes.length;
  const concluidos = solicitacoes.filter(s => s.status === 'Concluido').length;
  const emAndamento = solicitacoes.filter(s => s.status === 'EmAndamento' || s.status === 'AguardandoPeca').length;
  const pendentes = solicitacoes.filter(s => s.status === 'Pendente').length;

  const temposResolucao = solicitacoes
    .filter(s => s.tempoResolucaoHoras !== null)
    .map(s => s.tempoResolucaoHoras);
  const tempoMedioTexto = temposResolucao.length > 0
    ? `${(temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length).toFixed(1)}h`
    : '—';

  // Por mês (últimos 6 meses)
  const hoje = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(d);
  }
  const nomesMes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const porMes = {
    labels: meses.map(m => nomesMes[m.getMonth()]),
    valores: meses.map(m =>
      solicitacoes.filter(s => {
        const dt = new Date(s.dataAbertura);
        return dt.getFullYear() === m.getFullYear() && dt.getMonth() === m.getMonth();
      }).length
    )
  };

  // Por status
  const statusOrdenados = ['Pendente', 'EmAndamento', 'AguardandoPeca', 'Concluido', 'Cancelado'];
  const porStatus = statusOrdenados
    .map(st => ({ status: st, label: STATUS_DISPLAY[st], valor: solicitacoes.filter(s => s.status === st).length }))
    .filter(x => x.valor > 0);

  // Por tipo (Adicionado await se o cadastroService também buscar do banco)
  const listaTipos = await cadastroService.obterTipos();
  const tipos = listaTipos.map(t => t.nome);
  const porTipo = {
    labels: tipos,
    valores: tipos.map(tipo => solicitacoes.filter(s => s.tipo === tipo).length)
  };

  // Por local (Adicionado await se o cadastroService também buscar do banco)
  const listaLocais = await cadastroService.obterLocais();
  const locais = listaLocais.map(l => l.nome);
  const porLocal = {
    labels: locais,
    valores: locais.map(local => solicitacoes.filter(s => s.local === local).length)
  };

  // Tempo médio por responsável
  const responsaveis = [...new Set(solicitacoes.map(s => s.responsavel).filter(r => r && r.trim()))].sort();
  const tempoPorResponsavel = {
    labels: responsaveis,
    valores: responsaveis.map(resp => {
      const tempos = solicitacoes
        .filter(s => s.responsavel === resp && s.tempoResolucaoHoras !== null)
        .map(s => s.tempoResolucaoHoras);
      return tempos.length > 0 ? Math.round((tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10) / 10 : 0;
    })
  };

  return {
    total, concluidos, emAndamento, pendentes, tempoMedioTexto,
    porMes, porStatus, porTipo, porLocal, tempoPorResponsavel
  };
}

module.exports = { obterDashboard };