# Viztto — fundação do site

Primeira etapa do site institucional do Viztto: arquitetura React, identidade visual, componentes globais, rotas e uma página interna de Design System.

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

## Rotas

- `/` — placeholder editorial da futura home
- `/produto`, `/recursos`, `/precos`, `/entrar`, `/criar-conta` — estruturas mínimas
- `/design-system` — catálogo visual e interativo completo
- demais caminhos — erro 404

## Organização

O código está separado em componentes de marca, layout, navegação, UI, feedback e seções do Design System. Os tokens centrais ficam em `src/styles/globals.css` e são expostos ao Tailwind em `tailwind.config.js`.

GSAP e ScrollTrigger estão registrados em `src/lib/gsap.ts` para as próximas etapas. As microinterações atuais usam Motion e respeitam `prefers-reduced-motion`.

## Escopo desta etapa

Ainda não há landing page comercial, hero definitivo, preços, autenticação, dashboard, backend ou integrações. Esses pontos dependem das próximas partes do projeto.
