# Manutenção de Tablets e Rastreadores — Lenarge (versão Web)

Reescrita completa em **Node.js/Express + SQLite (backend)** e
**HTML/CSS/JS puro + Chart.js (frontend)** do app que antes era C# / .NET 8 /
WPF / EF Core. Toda a lógica de negócio (autenticação PBKDF2, papéis,
regras de status, filtros, dashboard) foi portada 1:1.

## Como rodar

Requer **Node.js 18+**.

```bash
cd backend
npm install
npm start
```

Acesse **http://localhost:3000**. Na primeira execução o arquivo
`backend/data/lenarge_manutencao.db` é criado automaticamente, já com:

- um Administrador padrão: usuário `admin`, senha `admin123`
- os mesmos tipos de solicitação e locais padrão do app original

Para rodar em outra porta: `PORT=8080 npm start`.

## Estrutura

```
backend/
  server.js              → servidor Express (rotas + sessão + estáticos)
  db.js                   → schema SQLite + seed inicial (equivalente ao DbInitializer.cs)
  services/
    passwordHasher.js     → PBKDF2 (equivalente ao PasswordHasher.cs)
    validation.js         → validação de e-mail/telefone (ValidationHelper.cs)
    enums.js               → status/prioridade e seus labels (EnumDisplayExtensions.cs)
    authService.js         → login/autocadastro (AuthService.cs)
    cadastroService.js     → tipos/locais (CadastroService.cs)
    solicitacaoService.js  → CRUD + regras de status (SolicitacaoService.cs)
    usuarioService.js      → gestão de usuários (UsuarioService.cs)
    dashboardService.js    → agregações do dashboard (DashboardViewModel.cs)
  middleware/auth.js       → guarda de sessão/papel (equivalente às checagens de Papel espalhadas nos ViewModels)
  routes/                  → endpoints REST (auth, solicitacoes, cadastro, usuarios, dashboard)

frontend/
  index.html               → shell do SPA (login, signup, app)
  css/theme.css             → paleta Lenarge (vermelho #ED1B24 + preto #141010), equivalente ao Theme.xaml
  js/
    api.js                  → wrapper fetch
    enums.js                 → labels/status no cliente
    auth.js                  → login/cadastro (LoginViewModel/SignupViewModel)
    dashboard.js              → cartões + gráficos Chart.js (substitui OxyPlot)
    nova.js                    → formulário de nova solicitação
    lista.js                   → tabela com filtros (ListaSolicitacoesViewModel)
    detalhe.js                  → modal de detalhe/histórico/ações (SolicitacaoDetalheViewModel)
    config.js                    → gestão de tipos, locais e usuários (ConfiguracoesViewModel)
    app.js                        → navegação/sessão (MainViewModel)
```

## O que foi portado com fidelidade

- **PBKDF2** com os mesmos parâmetros (SHA-256, 100.000 iterações, salt de
  16 bytes, chave de 32 bytes) — `crypto.pbkdf2Sync` do Node produz o
  mesmo resultado que `Rfc2898DeriveBytes.Pbkdf2` do .NET para os mesmos
  parâmetros, então é o mesmo nível de segurança.
- **Papéis** Administrador / Solicitante com as mesmas restrições:
  Solicitante só vê/cria as próprias solicitações; só Administrador muda
  status, exclui ou acessa Configurações — validado tanto no frontend
  (esconde botões) quanto no backend (defesa em profundidade, como no
  original).
- **Fluxo de status**: Pendente → Em andamento → Aguardando peça/Concluído,
  com histórico automático a cada mudança.
- **Validações** de e-mail (formato) e telefone brasileiro (DDD 11–99, 8 ou
  9 dígitos) idênticas.
- **Dashboard**: os mesmos 5 cartões e os mesmos 5 gráficos (por mês, por
  status, por tipo, por local, tempo médio por responsável) — só a
  biblioteca de gráficos mudou (OxyPlot → Chart.js).
- **Regra do último Administrador**: não é possível excluir o único
  Administrador restante, nem o próprio usuário logado.

## Diferenças em relação ao app desktop

- É **multiusuário de verdade via rede** (sessão HTTP com cookie), então
  vários atendentes podem usar ao mesmo tempo — o que o SQLite local do
  WPF não permitia sem trocar para outro banco.
- Login persiste por 8h (configurável em `server.js`, `cookie.maxAge`).
- Antes de ir para produção, troque `SESSION_SECRET` em `server.js` (ou
  defina a variável de ambiente) por um valor aleatório forte.

## O que ainda falta (igual ao README original)

- Exportação para Excel/PDF.
- Anexar imagens/documentos ao chamado.
- Notificações e SLA por prioridade.
- Backup/restauração do banco pela própria interface (aqui, por ora, basta
  copiar o arquivo `backend/data/lenarge_manutencao.db`).
