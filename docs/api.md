# API REST

As rotas de dominio exigem cookie de sessao, exceto as listadas como publicas. Rotas de escrita tambem exigem `X-CSRF-Token`, obtido por `GET /api/autenticacao/csrf`. Respostas de erro seguem `{ "erro": { "codigo", "mensagem", "detalhes?" } }`.

## Publico

- `GET /api/publico/assinaturas/planos` — planos ativos com os dados comerciais exibidos no site

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
  - `aprovar` no app **envia** a versão para o Cliente 2 (`aguardando_revisao`); **nao** define `aprovado`.
  - Aprovar exige o usuario em `participantes_projeto` como `aprovador`, quando houver aprovadores configurados.
  - Override: `admin` da plataforma, `administrador` ou `gestor` do workspace.
  - Somente o portal do Cliente 2 (`POST /api/portal/.../aprovar`) define o material como `aprovado`.
  - O status do projeto e recalculado pelos materiais ativos (`alteracoes_solicitadas` > `aguardando_revisao` > `aguardando_aprovacao` > todos `aprovado`).
- `GET /api/materiais/:materialId/aprovadores` — quem ja aprovou / quem falta na versao atual
- `GET /api/atividades`, `/api/notificacoes`, `/api/workspaces/atual`, `/api/usuarios/equipe`
- `GET /arquivos/:arquivoId` (arquivo autorizado pelo workspace)

Listas de clientes, projetos e materiais aceitam `pagina`, `porPagina` e `busca` e retornam metadados de paginacao.
