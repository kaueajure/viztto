# Viztto — site institucional

Landing page institucional do Viztto, plataforma de revisão, feedback, controle de versões e aprovação de materiais criativos.

## Executar

Requer Node.js 20.19+ (ou 22.12+) e npm.

```bash
npm install
npm run dev
```

Build e verificações:

```bash
npm run lint
npm run build
npm run preview
```

## Nota comercial

Os preços e limites exibidos na landing page são provisórios e deverão ser validados antes do lançamento público do Viztto.

## Rotas

- `/` — landing page comercial
- `/produto`, `/recursos`, `/precos`, `/entrar`, `/criar-conta` — estruturas mínimas
- `/contato`, `/termos`, `/privacidade` — placeholders institucionais
- `/design-system` — catálogo visual e interativo completo
- demais caminhos — erro 404

## Organização

O código está separado em componentes de marca, layout, navegação, UI, feedback, demonstrações do produto e seções comerciais. Os tokens centrais ficam em `src/styles/globals.css` e são expostos ao Tailwind em `tailwind.config.js`.

GSAP e ScrollTrigger conduzem a transformação narrativa da home. As microinterações usam Motion e respeitam `prefers-reduced-motion`.

## Fora do escopo atual

Ainda não há autenticação funcional, dashboard, backend, banco de dados, upload real, pagamentos ou integrações.
