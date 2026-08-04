# Deploy em Hostinger VPS

1. Instale Node.js 22 LTS, MySQL 8/MariaDB e um gerenciador de processo (systemd ou PM2).
2. Crie banco e usuario exclusivos com `utf8mb4_unicode_ci`; nao use `root` na aplicacao.
3. Clone o repositorio, execute `npm ci` e crie `.env` fora do controle de versao.
4. Defina `NODE_ENV=production`, `COOKIE_SEGURO=true`, `CONFIAR_PROXY=true`, `URL_APLICACAO=https://dominio-real` e um `SEGREDO_SESSAO` aleatorio longo.
5. Execute `npm run banco:migrar`. O seed e opcional e nao deve ser usado em producao sem decisao explicita.
6. Execute `npm run build` e `npm start` sob um usuario sem privilegios.
7. Configure Nginx para HTTPS, proxy para a `PORTA` interna, limite de corpo coerente com o upload e cabecalhos `X-Forwarded-*`.
8. Garanta escrita apenas no `DIRETORIO_UPLOADS` e leitura do `dist`.
9. Configure firewall, rotacao de logs, monitoramento, reinicio automatico e backup.

Antes da abertura publica, substitua o dominio pendente do sitemap e valide a entrega de e-mail. Nunca exponha MySQL à internet publica.

