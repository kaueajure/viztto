# Viztto

Aplicacao full-stack de revisao, feedback, versoes e aprovacao de materiais criativos. O repositorio contem a landing React/Vite e o produto autenticado, servidos em producao pelo mesmo processo Express.

## Requisitos

- Node.js 22.22 ou superior; produção e CI usam Node.js 24
- MySQL 8 ou MariaDB compativel
- npm

## Configuracao local

1. Copie `.env.example` para `.env` e preencha banco, segredo de sessao e URL.
2. Crie os bancos com `utf8mb4`/`utf8mb4_unicode_ci` e conceda acesso ao usuario configurado.
3. Instale, migre e opcionalmente carregue a demonstracao:

```bash
npm install
npm run banco:migrar
npm run banco:seed
npm run dev
```

Frontend Vite: `http://localhost:5173`. API em desenvolvimento: `http://localhost:3001`, encaminhada pelo proxy do Vite. A saude esta em `GET /api/saude`.

O seed e idempotente. Credenciais apenas para desenvolvimento: `marina@viztto.local` / `Viztto@123`.

## Verificacoes

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:verificar
npm run test:smoke
```

`npm test` se recusa a preparar um banco sem o sufixo `_testes`. Configure um usuario que tenha acesso somente ao banco de testes.

## Producao

```bash
npm ci
npm run build
npm run banco:migrar:producao
npm start
```

`server.js` é o entrypoint permanente. Um único processo serve `/api`, arquivos protegidos em `/arquivos`, assets de `dist` e o fallback do React Router. Em ambientes gerenciados, `PORT` prevalece sobre `PORTA`. Consulte [deploy na Hostinger](docs/deploy-hostinger.md), [backup](docs/backup.md) e [API](docs/api.md).

## Banco

O schema fica em `servidor/banco/esquema`, e migrations versionadas em `servidor/banco/migrations`. Tabelas, colunas, indices, constraints e enums textuais usam portugues-BR sem acentos em `snake_case`. IDs principais sao UUID v4 em `CHAR(36)`; esta escolha prioriza portabilidade e simplicidade, com custo de indice maior que UUID binario.

## Seguranca

- senha com bcrypt (custo 12);
- sessao em cookie HTTP-only, SameSite estrito e Secure configuravel;
- apenas SHA-256 do token de sessao no banco;
- CSRF double-submit e validacao de origem;
- rate limit nas rotas de autenticacao;
- Helmet, logs Pino com redacao de segredos e CORS restrito somente no desenvolvimento;
- todas as consultas de dominio filtradas pelo workspace derivado da sessao;
- upload limitado, nome gerado no servidor, validacao por assinatura e metadados da imagem.

## Observacoes

Precos e limites da landing continuam provisórios. Envio de e-mail, recuperacao de senha, convites, video/PDF/apresentacao e armazenamento externo permanecem fora desta macroetapa.
