# Deploy gerenciado na Hostinger

Este guia cobre **Node.js Web App gerenciado**, não VPS. No ambiente atual do Viztto, a Hostinger instalou as dependências e iniciou o arquivo de entrada sem executar `npm run build`. Por isso, o projeto utiliza um `postinstall` explícito para produzir os artefatos antes do start.

Referências oficiais:

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/tutorials/deploy-node-js-application

## Configuração no hPanel

```text
Preset: Express
Branch: main
Node.js: 24.x
Diretório raiz: ./
Gerenciador: npm
Arquivo de entrada: server.js
```

O repositório mantém apenas `package-lock.json`. A cadeia estritamente necessária para compilar — Vite, TypeScript, plugin React, Tailwind/PostCSS e tipos usados pelo compilador — permanece em `dependencies`. Ferramentas de teste, lint, Drizzle Kit e desenvolvimento permanecem em `devDependencies`. Assim, não é necessário configurar `NPM_CONFIG_INCLUDE=dev` nem manter um `.npmrc` que altere o comportamento global do npm.

Se o hPanel exibir uma configuração de build, mantenha `npm run build`. O `postinstall` garante o mesmo resultado quando essa etapa não é executada pela plataforma. O fluxo observado e suportado é:

```text
npm ci
→ postinstall
→ npm run limpar
→ npm run build:frontend
→ npm run build:backend
→ npm run build:verificar
→ node server.js
```

O CI define `VIZTTO_IGNORAR_BUILD_POS_INSTALL=true` durante o `npm ci` porque executa o build explicitamente depois de typecheck, lint e testes. Não configure essa variável na Hostinger.

O loader gerenciado da Hostinger carrega o entrypoint com `require()` e precisa observar o `listen()` durante esse carregamento. Por isso, `server.js` carrega o backend ESM de forma síncrona, o backend não usa top-level await e o Express começa a escutar em `0.0.0.0` (porta `PORT` da plataforma, com fallback 3000) antes da preparação assíncrona de uploads e migrations. As demais requisições aguardam essa preparação; `/api/saude` permanece disponível para indicar que o processo está vivo. O smoke test reproduz o carregamento via `require()` antes de validar as rotas.

## Variáveis

```env
NODE_ENV=production

BANCO_HOST=valor_real
BANCO_PORTA=3306
BANCO_NOME=valor_real
BANCO_USUARIO=valor_real
BANCO_SENHA=valor_real

SEGREDO_SESSAO=segredo-aleatorio-com-no-minimo-32-caracteres
URL_APLICACAO=https://dominio-real

DIRETORIO_UPLOADS=./uploads
TAMANHO_MAXIMO_IMAGEM_MB=15

COOKIE_SEGURO=true
CONFIAR_PROXY=true
EXECUTAR_MIGRATIONS=true

EMAIL_HOST=smtp.hostinger.com
EMAIL_PORTA=465
EMAIL_USUARIO=contato@viztto.site
EMAIL_SENHA=senha_da_caixa
EMAIL_REMETENTE=contato@viztto.site
EMAIL_NOME=Viztto
```

Não configure `PORT=3000`: a porta injetada pela Hostinger tem prioridade. `PORTA` existe apenas como fallback local.

O SMTP usa a caixa `contato@viztto.site` (Hostinger: `smtp.hostinger.com`, porta `465` com SSL). Em produção, `EMAIL_HOST`, `EMAIL_USUARIO` e `EMAIL_SENHA` são obrigatórios.

`EXECUTAR_MIGRATIONS=true` aplica migrations antes do `listen`. O runner usa `GET_LOCK` no MySQL/MariaDB para impedir execução concorrente. Seed nunca é executado automaticamente. Também é possível migrar explicitamente, após o build, com:

```bash
npm run banco:migrar:producao
```

## Uploads persistentes

`DIRETORIO_UPLOADS` precisa apontar para armazenamento persistente e gravável. A inicialização cria e testa o diretório e recusa caminhos dentro de `dist`, `build-servidor`, `node_modules` ou diretório temporário do sistema. Confirme no hPanel que uma nova implantação não remove `./uploads`.

Faça backup coordenado do MySQL e dos uploads conforme [backup.md](backup.md). O banco não deve ser exposto à internet pública.

## Diagnóstico

```bash
npm run deploy:diagnosticar
npm run build:verificar
```

O diagnóstico mostra apenas versões, caminhos, artefatos e presença de variáveis; não imprime valores nem credenciais.

Endpoints:

- `GET /api/saude`: processo ativo, sem depender do banco.
- `GET /api/prontidao`: banco conectado e uploads acessíveis.

Se o deploy falhar, verifique primeiro o log bruto do build, a seleção de `npm run build`, o entrypoint `server.js` e a presença das variáveis obrigatórias.
