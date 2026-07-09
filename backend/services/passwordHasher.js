// services/passwordHasher.js
//
// Equivalente ao Services/PasswordHasher.cs original.
// PBKDF2-HMAC-SHA256, 100.000 iterações, salt de 16 bytes, chave de 32 bytes.
// Node.js crypto.pbkdf2Sync produz o mesmo resultado bit-a-bit que o
// Rfc2898DeriveBytes.Pbkdf2 do .NET para os mesmos parâmetros (é o mesmo
// algoritmo padronizado), então hashes gerados por um lado podem ser
// verificados pelo outro se algum dia precisar migrar dados existentes.
//
// Nunca compare hashes com "===" diretamente — use sempre verifyPassword,
// que faz a comparação em tempo constante (evita timing attack).

const crypto = require('crypto');

const SALT_SIZE_BYTES = 16;
const KEY_SIZE_BYTES = 32;
const ITERATIONS = 100_000;
const DIGEST = 'sha256';

function hashPassword(password) {
  const saltBytes = crypto.randomBytes(SALT_SIZE_BYTES);
  const hashBytes = crypto.pbkdf2Sync(password, saltBytes, ITERATIONS, KEY_SIZE_BYTES, DIGEST);
  return {
    hash: hashBytes.toString('base64'),
    salt: saltBytes.toString('base64')
  };
}

function verifyPassword(password, storedHash, storedSalt) {
  const saltBytes = Buffer.from(storedSalt, 'base64');
  const expectedHash = Buffer.from(storedHash, 'base64');
  const actualHash = crypto.pbkdf2Sync(password, saltBytes, ITERATIONS, KEY_SIZE_BYTES, DIGEST);

  if (actualHash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

module.exports = { hashPassword, verifyPassword };
