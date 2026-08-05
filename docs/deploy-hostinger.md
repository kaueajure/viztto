# Deploy gerenciado na Hostinger

Este guia cobre **Node.js Web App gerenciado**, não VPS. A Hostinger instala dependências, executa o build configurado e inicia o arquivo de entrada. O projeto não usa `postinstall`, evitando uma segunda compilação durante a mesma implantação.

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

O build selecionado deve ser `npm run build`. Se o hPanel exibir uma lista de comandos, confirme esse valor antes de implantar. O fluxo é:

```text
npm ci
→ npm run limpar
→ npm run build:frontend
→ npm run build:backend
→ npm run build:verificar
→ node server.js
```

O loader gerenciado da Hostinger carrega o entrypoint com `require()`. Por isso, `server.js` não possui top-level await: ele dispara o import dinâmico do backend ESM compilado e trata a rejeição da Promise. O smoke test reproduz esse carregamento antes de validar as rotas.

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
```

Não configure `PORT=3000`: a porta injetada pela Hostinger tem prioridade. `PORTA` existe apenas como fallback local.

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
