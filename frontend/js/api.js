// js/api.js
// Wrapper simples sobre fetch, com credenciais de sessão (cookie).

const Api = {
  async _request(method, url, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch (_) { /* corpo vazio, ok */ }

    if (!res.ok) {
      const erro = (data && data.erro) || `Erro ${res.status}`;
      throw new Error(erro);
    }
    return data;
  },

  get(url) { return this._request('GET', url); },
  post(url, body) { return this._request('POST', url, body); },
  del(url) { return this._request('DELETE', url); }
};
