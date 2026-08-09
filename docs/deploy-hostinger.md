# Deploy gerenciado na Hostinger

Este guia cobre **Node.js Web App gerenciado**, não VPS. No ambiente atual do Viztto, a Hostinger instalou as dependências e iniciou o arquivo de entrada sem executar `npm run build`. Por isso, o projeto utiliza um `postinstall` explícito para produzir os artefatos antes do start.

Referências oficiais:

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/
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

DIRETORIO_UPLOADS=../uploads
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

No deploy gerenciado de backend, a Hostinger publica o build em
`/home/USUARIO/domains/DOMINIO/nodejs` e recria o `.htaccess` em `public_html`.
O diretório-alvo do deploy pode ser sobrescrito numa reimplantação ou troca de
repositório. Por isso, arquivos enviados por usuários não podem ficar dentro de
`nodejs`, `public_html` ou da raiz do projeto.

Crie, no Gerenciador de Arquivos, a pasta irmã:

```text
/home/USUARIO/domains/DOMINIO/uploads
```

No hPanel, configure `DIRETORIO_UPLOADS=../uploads`. Se a variável não existir
em produção, a aplicação usa automaticamente essa pasta irmã. A inicialização
cria e testa o diretório, mas recusa caminhos dentro de `public_html`, `nodejs`,
`dist`, `build-servidor`, `node_modules`, da raiz implantada ou do diretório
temporário do sistema. Assim, uma configuração antiga como
`DIRETORIO_UPLOADS=./uploads` interrompe a inicialização em vez de aceitar o
risco de perda silenciosa.

Antes do primeiro redeploy com esta configuração, mova pelo Gerenciador de
Arquivos qualquer conteúdo real de `nodejs/uploads` para a nova pasta
`uploads`. Não substitua arquivos com o mesmo nome sem conferir o banco. Depois,
use `GET /api/prontidao` para confirmar que a aplicação consegue ler e escrever
no local persistente.

Esse isolamento protege contra o redeploy normal, mas não contra a remoção do
site no hPanel: a própria Hostinger informa que remover o website apaga arquivos,
bancos e configurações associados. Mantenha backups fora da conta de hospedagem.

Para object storage S3-compativel (Cloudflare R2, MinIO, Spaces etc.), configure:

```
ARMAZENAMENTO_OBJETO_ENDPOINT=https://xxxx.r2.cloudflarestorage.com
ARMAZENAMENTO_OBJETO_REGIAO=auto
ARMAZENAMENTO_OBJETO_BUCKET=viztto
ARMAZENAMENTO_OBJETO_ACCESS_KEY=...
ARMAZENAMENTO_OBJETO_SECRET_KEY=...
```

Com essas variaveis, novos arquivos usam o bucket (chave = `caminho_relativo` no banco) e o disco local deixa de ser obrigatorio. Migre objetos existentes se ja houver uploads em `./uploads`.

Faca backup coordenado do MySQL e dos uploads (disco ou bucket) conforme [backup.md](backup.md). O banco nao deve ser exposto a internet publica.

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
