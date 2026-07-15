// services/dashboardService.js
// Equivalente aos CÁLCULOS do ViewModels/DashboardViewModel.cs original.

const solicitacaoService = require('./solicitacaoService');
const { STATUS_DISPLAY } = require('./enums');

async function obterDashboard(usuarioAtual) {
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
        const dt = new Date(s.dataAgendada);
        return dt.getFullYear() === m.getFullYear() && dt.getMonth() === m.getMonth();
      }).length
    )
  };

  const statusOrdenados = ['Pendente', 'EmAndamento', 'AguardandoPeca', 'Concluido', 'Cancelado'];
  const porStatus = statusOrdenados
    .map(st => ({ status: st, label: STATUS_DISPLAY[st], valor: solicitacoes.filter(s => s.status === st).length }))
    .filter(x => x.valor > 0);

  const contagemPorTipo = {};
  solicitacoes.forEach(s => {
    const tipo = (s.tipo || 'Sem tipo').trim();
    contagemPorTipo[tipo] = (contagemPorTipo[tipo] || 0) + 1;
  });
  const porTipo = {
    labels: Object.keys(contagemPorTipo),
    valores: Object.values(contagemPorTipo)
  };

  const contagemPorLocal = {};
  solicitacoes.forEach(s => {
    const local = (s.local || 'Sem local').trim();
    contagemPorLocal[local] = (contagemPorLocal[local] || 0) + 1;
  });
  const porLocal = {
    labels: Object.keys(contagemPorLocal),
    valores: Object.values(contagemPorLocal)
  };

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

  const contagemPorPlaca = {};
  solicitacoes.forEach(s => {
    const placa = (s.placa || '').trim().toUpperCase();
    if (!placa) return;
    contagemPorPlaca[placa] = (contagemPorPlaca[placa] || 0) + 1;
  });
  const placasOrdenadas = Object.entries(contagemPorPlaca)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const porPlaca = {
    labels: placasOrdenadas.map(([placa]) => placa),
    valores: placasOrdenadas.map(([, qtd]) => qtd)
  };

  return {
    total, concluidos, emAndamento, pendentes, tempoMedioTexto,
    porMes, porStatus, porTipo, porLocal, tempoPorResponsavel, porPlaca
  };
}

module.exports = { obterDashboard };