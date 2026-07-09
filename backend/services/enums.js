// services/enums.js
// Equivalente a Models/Enums.cs + Extensions/EnumDisplayExtensions.cs

const STATUS = ['Pendente', 'EmAndamento', 'AguardandoPeca', 'Concluido', 'Cancelado'];
const PRIORIDADE = ['Baixa', 'Media', 'Alta', 'Critica'];
const PAPEL = ['Administrador', 'Solicitante'];

const STATUS_DISPLAY = {
  Pendente: 'Pendente',
  EmAndamento: 'Em andamento',
  AguardandoPeca: 'Aguardando peça',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado'
};

const PRIORIDADE_DISPLAY = {
  Baixa: 'Baixa',
  Media: 'Média',
  Alta: 'Alta',
  Critica: 'Crítica'
};

function statusToDisplay(status) {
  return STATUS_DISPLAY[status] || status;
}

function prioridadeToDisplay(prioridade) {
  return PRIORIDADE_DISPLAY[prioridade] || prioridade;
}

// Próximos status possíveis a partir do status atual
// (equivalente ao switch em SolicitacaoDetalheViewModel.Carregar)
function proximosStatus(statusAtual) {
  switch (statusAtual) {
    case 'Pendente': return ['EmAndamento'];
    case 'EmAndamento': return ['AguardandoPeca', 'Concluido'];
    case 'AguardandoPeca': return ['EmAndamento', 'Concluido'];
    default: return [];
  }
}

module.exports = {
  STATUS, PRIORIDADE, PAPEL,
  STATUS_DISPLAY, PRIORIDADE_DISPLAY,
  statusToDisplay, prioridadeToDisplay, proximosStatus
};
