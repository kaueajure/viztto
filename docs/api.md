# API REST

Todas as rotas de dominio exigem cookie de sessao. Rotas de escrita tambem exigem `X-CSRF-Token`, obtido por `GET /api/autenticacao/csrf`. Respostas de erro seguem `{ "erro": { "codigo", "mensagem", "detalhes?" } }`.

## Autenticacao

- `POST /api/autenticacao/cadastro`
- `POST /api/autenticacao/verificar-email`
- `POST /api/autenticacao/reenviar-verificacao`
- `GET /api/autenticacao/slug-disponivel`
- `POST /api/autenticacao/onboarding`
- `POST /api/autenticacao/entrar`
- `POST /api/autenticacao/trocar-workspace`
- `GET /api/autenticacao/sessao`
- `POST /api/autenticacao/sair`

## Dominio

- CRUD: `/api/clientes`, `/api/projetos`, `/api/materiais`
- `POST /api/materiais/:materialId/versoes` (`multipart/form-data`, campo `imagem`)
- `GET|POST /api/materiais/:materialId/comentarios`
- `PATCH|DELETE /api/comentarios/:comentarioId`
- `POST /api/comentarios/:comentarioId/respostas|resolver|reabrir`
- `POST /api/materiais/:materialId/aprovar|solicitar-alteracoes|reabrir`
- `GET /api/atividades`, `/api/notificacoes`, `/api/workspaces/atual`, `/api/usuarios/equipe`
- `GET /arquivos/:arquivoId` (arquivo autorizado pelo workspace)

Listas de clientes, projetos e materiais aceitam `pagina`, `porPagina` e `busca` e retornam metadados de paginacao.

