// js/enums.js

const STATUS_DISPLAY = {
  Pendente: 'Pendente',
  EmAndamento: 'Em andamento',
  AguardandoPeca: 'Aguardando peça',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado'
};

const STATUS_BADGE_CLASS = {
  Pendente: 'badge-pendente',
  EmAndamento: 'badge-emandamento',
  AguardandoPeca: 'badge-aguardandopeca',
  Concluido: 'badge-concluido',
  Cancelado: 'badge-cancelado'
};

const PRIORIDADE_DISPLAY = {
  Baixa: 'Baixa',
  Media: 'Média',
  Alta: 'Alta',
  Critica: 'Crítica'
};

const PRIORIDADE_CLASS = {
  Baixa: 'prio-baixa',
  Media: 'prio-media',
  Alta: 'prio-alta',
  Critica: 'prio-critica'
};

function statusDisplay(s) { return STATUS_DISPLAY[s] || s; }
function prioridadeDisplay(p) { return PRIORIDADE_DISPLAY[p] || p; }

function proximosStatus(statusAtual) {
  switch (statusAtual) {
    case 'Pendente': return ['EmAndamento'];
    case 'EmAndamento': return ['AguardandoPeca', 'Concluido'];
    case 'AguardandoPeca': return ['EmAndamento', 'Concluido'];
    default: return [];
  }
}

function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatarTelefoneInput(el) {
  el.addEventListener('input', () => {
    const digits = el.value.replace(/\D/g, '');
    let out = digits;
    if (digits.length > 10) out = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
    else if (digits.length > 6) out = `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    else if (digits.length > 2) out = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    el.value = out;
  });
}
