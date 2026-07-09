// services/validation.js
// Equivalente ao Services/ValidationHelper.cs original.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email) {
  if (!email || !email.trim()) return false;
  return EMAIL_REGEX.test(email.trim());
}

function onlyDigits(value) {
  return (value || '').replace(/\D/g, '');
}

// Telefone brasileiro: DDD entre 11 e 99, com 8 dígitos (fixo)
// ou 9 dígitos começando com 9 (celular).
function isValidTelefone(telefone) {
  if (!telefone || !telefone.trim()) return false;
  const digits = onlyDigits(telefone);

  if (digits.length !== 10 && digits.length !== 11) return false;

  const ddd = parseInt(digits.slice(0, 2), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) return false;

  if (digits.length === 11 && digits[2] !== '9') return false;

  return true;
}

function formatTelefone(raw) {
  const digits = onlyDigits(raw);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, Math.min(11, digits.length))}`;
}

module.exports = { isValidEmail, isValidTelefone, formatTelefone, onlyDigits };
