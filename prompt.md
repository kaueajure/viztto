# Melhoria de UX do Portal do Cliente — Viztto

Quero fazer um passe específico de UX no **Portal do Cliente do Viztto**, principalmente na experiência do cliente externo que recebe um link da agência para revisar materiais.

O portal atual já está visualmente bom e funcional.

**NÃO quero redesenhar o portal.**

O objetivo desta tarefa é corrigir alguns comportamentos específicos para tornar o fluxo de revisão e aprovação mais intuitivo, seguro e claro para uma pessoa que nunca utilizou o Viztto.

---

# Contexto

O fluxo ideal do cliente externo deve ser extremamente simples:

```text
Receber link
   ↓
Abrir projeto
   ↓
Ver materiais
   ↓
Abrir material
   ↓
Visualizar
   ↓
Comentar / solicitar alteração / aprovar
   ↓
Receber confirmação clara
```

A pessoa não deve precisar aprender o Viztto.

Ela deve conseguir utilizar o portal intuitivamente em poucos segundos.

Use como princípio:

> A agência utiliza o sistema completo.
> O cliente da agência utiliza apenas o necessário para revisar e aprovar.

---

# Escopo

Trabalhe principalmente nos componentes/páginas relacionados ao portal externo, especialmente equivalentes a:

```text
src/pages/portal/PortalProjetoPage.tsx
src/pages/portal/PortalRevisaoPage.tsx
```

e componentes diretamente utilizados por essas telas.

Antes de alterar qualquer coisa:

1. analise a implementação atual;
2. identifique componentes reutilizáveis existentes;
3. entenda os estados atuais de revisão/aprovação;
4. entenda como comentários abertos são calculados;
5. entenda como tipos de material são apresentados;
6. preserve a identidade visual existente.

Não altere páginas internas da agência sem necessidade.

---

# OBJETIVO 1 — NÃO ENTRAR AUTOMATICAMENTE NO MODO DE COMENTÁRIO

Atualmente, ao abrir um material para revisão, o cliente pode entrar imediatamente em um estado equivalente a:

```ts
creationMode = true
```

Isso significa que a tela pode começar já no modo:

```text
Comentando
```

e clicar sobre a arte cria um comentário.

Quero mudar esse comportamento.

## Novo comportamento

Ao abrir uma revisão, o estado inicial deve ser:

```text
Visualização normal
```

O cliente deve conseguir:

* observar o material;
* navegar;
* ampliar/reduzir quando disponível;
* ler comentários existentes;
* compreender a tela;

sem risco de criar um comentário acidentalmente.

O modo de adicionar comentário deve começar **desativado**.

Exemplo conceitual:

```ts
const [creationMode, setCreationMode] = useState(false)
```

Analise a implementação atual e aplique a solução correta.

---

# Botão de comentário

Deve existir uma ação clara:

```text
+ Comentar
```

ou o label equivalente já utilizado pelo design atual.

Ao clicar:

```text
Visualização
   ↓
Modo comentário
```

O botão pode mudar visualmente para:

```text
Comentando
```

ou:

```text
Cancelar comentário
```

dependendo do padrão atual do sistema.

O importante é o usuário perceber claramente se está ou não no modo de criação de comentário.

---

# Estado visual do modo comentário

Quando o modo estiver ativo:

* destaque discretamente o botão;
* se apropriado, altere o cursor sobre a área comentável;
* pode mostrar uma instrução curta.

Por exemplo:

```text
Clique sobre o material para adicionar um comentário.
```

Não utilizar modal para explicar isso.

A experiência precisa continuar rápida.

---

# Depois de criar comentário

Analise o comportamento atual.

Preferencialmente, depois que um comentário for criado com sucesso:

```text
creationMode → false
```

Assim o usuário volta automaticamente para o modo de visualização.

Isso evita que ele clique acidentalmente em outro ponto e crie um segundo comentário.

Se a implementação atual tiver um motivo forte para manter o modo ativo, preserve o comportamento e explique no relatório final.

---

# Mobile

No mobile, esse comportamento é ainda mais importante.

Tocar na imagem nunca deve criar um comentário apenas porque o usuário acabou de entrar na página.

O usuário precisa explicitamente escolher:

```text
Comentar
```

antes que o toque na área visual tenha esse significado.

---

# OBJETIVO 2 — CONFIRMAÇÃO AO APROVAR COM COMENTÁRIOS PENDENTES

Este é um ponto importante de segurança de UX.

Hoje pode existir um fluxo no qual, se houver comentários abertos, o frontend simplesmente envia algo equivalente a:

```ts
confirmarPendencias: true
```

ao clicar em:

```text
Aprovar
```

Isso permite que o cliente aprove um material mesmo tendo comentários ainda abertos, sem uma confirmação explícita suficientemente clara.

Quero corrigir isso.

---

# Novo comportamento de aprovação

Quando o cliente clicar em:

```text
Aprovar
```

primeiro determine quantos comentários ainda estão pendentes/abertos.

## Caso não existam comentários pendentes

Se:

```text
comentariosAbertos === 0
```

o fluxo pode seguir normalmente.

Pode aprovar diretamente ou manter a confirmação atual caso ela já exista por padrão.

Não adicionar uma etapa desnecessária se o fluxo atual já for seguro.

---

## Caso existam comentários pendentes

Se:

```text
comentariosAbertos > 0
```

NÃO envie imediatamente a aprovação.

Abra uma confirmação explícita.

Exemplo:

```text
Existem comentários pendentes

Este material ainda possui 3 comentários em aberto.

Ao aprovar esta versão, você estará confirmando o material mesmo com esses comentários pendentes.

Deseja continuar?

[ Voltar ] [ Aprovar mesmo assim ]
```

Adapte singular/plural:

```text
1 comentário pendente
```

e:

```text
3 comentários pendentes
```

---

# Modal/dialog

Utilize o componente de dialog/modal já existente no Viztto, caso exista.

Não criar um modal completamente diferente do restante do design system.

O modal deve:

* prender foco corretamente;
* fechar com ESC;
* permitir voltar;
* não fechar acidentalmente durante envio;
* ter semântica acessível;
* bloquear submissão duplicada.

---

# Botões

A ação principal deve ser clara:

```text
Aprovar mesmo assim
```

Não use apenas:

```text
Confirmar
```

porque isso é ambíguo.

A ação secundária:

```text
Voltar
```

ou:

```text
Cancelar
```

Use o padrão de nomenclatura atual do Viztto.

---

# Envio para API

Somente depois da confirmação explícita, envie:

```ts
confirmarPendencias: true
```

Se não houver comentários pendentes, mantenha:

```ts
confirmarPendencias: false
```

ou o comportamento esperado pela API atual.

Não altere o contrato do backend desnecessariamente se ele já suporta essa lógica.

---

# Concorrência

Antes de aprovar, utilize o estado atual conhecido de comentários.

Se a arquitetura permitir facilmente, após clicar em aprovar considere o estado mais recente já disponível na tela.

Não crie requests extras desnecessários apenas para isso, salvo se houver risco concreto de inconsistência.

---

# OBJETIVO 3 — ESTADO APROVADO MUITO MAIS CLARO

Depois que o cliente aprovar o material, quero que a página deixe extremamente claro que a ação foi concluída.

Atualmente, apenas remover/desabilitar botões não é suficiente.

O cliente precisa sair da tela pensando:

> Pronto. Eu aprovei isso.

---

# Confirmação imediatamente após aprovação

Quando a API confirmar a aprovação com sucesso, apresente um estado visual claro.

Exemplo:

```text
✓ Versão aprovada

Sua aprovação foi registrada com sucesso.
Nenhuma ação adicional é necessária.
```

Pode utilizar uma pequena microanimação do check.

Nada exagerado.

Não usar:

* confete;
* partículas;
* animação longa;
* popup comemorativo enorme.

---

# Estado persistente

Não quero que essa mensagem exista apenas como toast temporário.

Se o usuário atualizar a página e o material continuar aprovado, a própria interface deve mostrar claramente:

```text
✓ Aprovado
```

ou:

```text
✓ Versão aprovada
```

em local de alta visibilidade.

Por exemplo próximo:

* ao nome do material;
* ao status;
* às ações principais.

---

# Data/hora da aprovação

Se o backend já fornece de forma confiável quando a versão/material foi aprovada, mostrar:

```text
Aprovado em 08/08/2026 às 14:32
```

ou no padrão de datas atual do projeto.

Se essa informação não existir atualmente, **não invente dados** e não altere banco apenas para esta melhoria sem necessidade.

Nesse caso mostre apenas:

```text
✓ Versão aprovada
```

---

# Depois da aprovação

As ações devem refletir o estado.

Se o fluxo atual não permite nova aprovação:

* remover/desabilitar botão Aprovar;
* evitar solicitar alteração após aprovação caso a regra de negócio não permita;
* impedir submissões duplicadas.

Não mudar regras de negócio existentes sem analisar o backend.

---

# Recarregamento

Teste:

```text
aprovar
↓
F5
↓
continua mostrando claramente ✓ Aprovado
```

O estado não pode depender apenas de React state local criado no momento do clique.

Use os dados retornados pela API.

---

# OBJETIVO 4 — MELHORAR PREVIEW DE VÍDEO E PDF NA LISTAGEM DO PORTAL

Na página em que o cliente vê os materiais do projeto, imagens já podem possuir uma representação visual melhor.

Quero melhorar a diferenciação de:

```text
Imagem
Vídeo
PDF
```

sem transformar isso em uma grande nova funcionalidade.

---

# Imagens

Manter thumbnail atual se estiver funcionando corretamente.

Não alterar sem necessidade.

---

# Vídeos

Em vez de mostrar apenas uma caixa genérica com:

```text
Vídeo
```

quero uma apresentação visual melhor.

Opções, em ordem de preferência:

### Opção A — thumbnail real

Se o sistema já possui thumbnail/frame disponível de forma simples e sem gerar processamento adicional complexo:

```text
[ thumbnail do vídeo ]
        ▶
```

### Opção B — preview controlado

Se for seguro/performance aceitável, pode utilizar o próprio `<video>` de forma não-autoplay:

```html
<video preload="metadata">
```

com visual estático e overlay:

```text
▶
```

Mas NÃO carregar vídeos inteiros desnecessariamente na listagem.

### Opção C — fallback elegante

Se gerar thumbnail real exigir nova infraestrutura:

mostrar um card visual coerente com o design:

```text
▶
Vídeo
MP4
```

com aparência premium.

Não introduza processamento backend grande apenas para esse item.

---

# PDF

Idealmente:

```text
[ miniatura da primeira página ]
PDF
```

Mas novamente:

NÃO quero adicionar uma infraestrutura pesada de renderização de PDF apenas para isso.

Se o projeto já possui forma fácil de gerar/exibir preview, utilize.

Caso contrário, faça um fallback visual melhor:

```text
┌─────────────────┐
│                 │
│       PDF       │
│                 │
│    documento    │
└─────────────────┘
```

com ícone e tratamento visual coerentes.

O objetivo principal é o usuário identificar o tipo de material rapidamente.

---

# Ícones

Utilize biblioteca de ícones já instalada.

Não adicionar nova dependência.

Exemplos conceituais:

```text
Image
Play
FileText
```

Use os ícones existentes equivalentes.

---

# NÃO USAR AUTOPLAY

Vídeos da listagem NÃO devem começar automaticamente.

Não tocar áudio.

Não carregar conteúdo excessivo.

---

# OBJETIVO 5 — CLAREZA DAS AÇÕES PRINCIPAIS

Faça uma revisão pontual na tela de revisão.

As três ações conceituais são:

```text
Comentar
Solicitar alterações
Aprovar
```

Elas devem possuir hierarquia clara.

---

# Aprovar

Deve parecer a ação positiva/final.

Não necessariamente precisa ser gigantesca.

Mas deve ser fácil encontrar.

---

# Solicitar alterações

Precisa estar visualmente distinta de Aprovar.

Não usar o mesmo peso visual se isso gerar ambiguidade.

---

# Comentar

Deve parecer uma ferramenta de feedback, não uma decisão final.

Agora que o modo de comentário não começa automaticamente, o CTA precisa ser fácil de localizar.

---

# Não adicionar novas ações

Não invente:

* “Talvez”
* “Revisar depois”
* “Salvar”
* “Enviar”
* outros estados.

Preserve o fluxo simples.

---

# OBJETIVO 6 — FEEDBACK DURANTE REQUESTS

Revise as três principais ações:

```text
adicionar comentário
solicitar alterações
aprovar
```

Durante requests:

* evitar clique duplicado;
* mostrar loading apropriado;
* manter label compreensível.

Exemplo:

```text
Aprovando...
```

```text
Enviando...
```

Não deixar o botão parecer travado sem explicação.

---

# Erros

Se a API falhar:

* não alterar visualmente para aprovado antes da confirmação;
* apresentar erro compreensível;
* permitir tentar novamente;
* preservar o texto/comentário digitado quando possível.

Não mostrar mensagens técnicas da API diretamente se forem inadequadas para cliente final.

---

# OBJETIVO 7 — EMPTY STATES

Revise rapidamente estados vazios do portal.

Por exemplo:

```text
Nenhum material disponível para revisão.
```

deve ser claro.

Evite telas praticamente vazias.

Pode adicionar explicação curta:

```text
Ainda não há materiais disponíveis para revisão neste projeto.
```

Não adicionar CTA administrativo para o cliente externo.

---

# OBJETIVO 8 — LINKS INVÁLIDOS OU EXPIRADOS

Sem alterar a segurança atual, revise a experiência se:

* token for inválido;
* projeto não existir;
* acesso tiver sido revogado;
* link estiver incorreto.

Não mostrar apenas:

```text
Erro 401
```

ou:

```text
Forbidden
```

Quero uma tela amigável:

```text
Este link não está disponível

O acesso pode ter sido atualizado ou revogado.
Solicite um novo link para a pessoa que enviou este projeto.
```

Se a implementação atual já possui estado equivalente bom, preserve.

Não revelar detalhes de segurança.

---

# NÃO REDESENHAR O PORTAL

Reforçando:

NÃO quero alterar completamente:

* layout;
* identidade visual;
* estrutura;
* header;
* organização dos materiais;
* workspace de revisão.

Faça melhorias incrementais.

O portal atualmente já é fácil de entender.

O objetivo é passar de uma experiência boa para uma experiência praticamente impossível de usar errado.

---

# PRINCÍPIO DE UX

Durante toda a implementação, pense em uma pessoa que:

* recebeu o link por WhatsApp ou e-mail;
* nunca ouviu falar de Viztto;
* não recebeu treinamento;
* quer gastar menos de dois minutos revisando uma arte.

Essa pessoa precisa conseguir:

```text
abrir
↓
entender
↓
comentar se necessário
↓
aprovar ou pedir alteração
↓
saber que terminou
```

sem perguntar para a agência como funciona.

---

# NÃO EXPOR TERMOS INTERNOS

No portal externo, evite introduzir palavras como:

* workspace;
* tenant;
* workflow;
* revisão interna;
* versão técnica;
* status interno.

Utilize linguagem natural para o cliente.

---

# MOBILE É PRIORIDADE

O cliente externo provavelmente pode abrir o link diretamente pelo WhatsApp no celular.

Portanto teste cuidadosamente mobile.

Breakpoints mínimos:

```text
375px
390px
430px
768px
1024px
1280px
1440px
```

Especialmente em:

```text
375px
390px
430px
```

---

# No mobile, garantir

* material ocupa espaço suficiente;
* botões continuam fáceis de tocar;
* ações não saem da viewport;
* comentários são utilizáveis;
* modal de aprovação cabe na tela;
* teclado virtual não quebra formulário de comentário;
* não existe scroll horizontal;
* nenhum overlay impede interação;
* não existe hover como requisito funcional.

---

# TOUCH TARGETS

Ações importantes precisam ter área de toque confortável.

Evite botões extremamente pequenos para:

```text
Comentar
Aprovar
Solicitar alterações
```

---

# PREFERS REDUCED MOTION

Se houver animações novas:

respeite:

```css
prefers-reduced-motion: reduce
```

Microanimação de confirmação pode virar apenas:

```text
opacity
```

quando reduced motion estiver ativado.

---

# ACESSIBILIDADE

Preserve ou melhore:

* heading hierarchy;
* labels;
* focus visible;
* keyboard navigation;
* `aria-label`;
* dialog semantics;
* contraste;
* estados disabled;
* mensagens de erro.

Não tornar o portal dependente de mouse.

---

# NÃO ALTERAR BACKEND SEM NECESSIDADE

Antes de alterar API ou banco, verifique se os endpoints atuais já oferecem as informações necessárias.

Preferir mudanças de frontend quando suficiente.

Alterar backend apenas se realmente necessário para garantir comportamento correto.

Se alterar backend:

* manter isolamento de workspace;
* manter validação do token do portal;
* manter autorização existente;
* não expor dados internos;
* adicionar/ajustar testes.

---

# NÃO QUEBRAR WHITE-LABEL

O portal pode utilizar personalização da agência.

Preserve:

* logo;
* cor principal;
* identidade do workspace/agência;
* comportamento white-label existente.

As novas confirmações/status devem respeitar esses tokens quando apropriado.

Não hardcodar a cor do Viztto se o portal estiver usando branding da agência.

---

# NÃO QUEBRAR TIPOS DE MATERIAL

Teste:

```text
imagem
vídeo
PDF
```

nas duas áreas:

```text
listagem do projeto
↓
tela de revisão
```

As melhorias não podem fazer imagem funcionar enquanto vídeo/PDF quebram.

---

# TESTES AUTOMATIZADOS

Analise os testes existentes.

Se houver Playwright/E2E do portal, atualize ou adicione casos.

Quero pelo menos cobertura conceitual para:

## Caso 1

```text
abrir portal
→ abrir material
→ NÃO estar em modo comentário
```

## Caso 2

```text
clicar Comentar
→ clicar material
→ criar comentário
```

## Caso 3

```text
material sem comentários abertos
→ Aprovar
→ aprovação concluída
```

## Caso 4

```text
material com comentários abertos
→ Aprovar
→ modal aparece
→ cancelar
→ NÃO aprovar
```

## Caso 5

```text
material com comentários abertos
→ Aprovar
→ Aprovar mesmo assim
→ aprovação concluída
```

## Caso 6

```text
material aprovado
→ recarregar página
→ estado ✓ Aprovado continua visível
```

Se for inviável adicionar todos agora, priorize 1, 4, 5 e 6.

---

# VALIDAÇÕES TÉCNICAS

Ao finalizar, executar:

```bash
npm run typecheck
npm run lint
npm run build
```

Também executar:

```bash
npm test
```

se os testes estiverem configurados corretamente no ambiente.

Se houver E2E disponível:

```bash
npm run test:e2e
```

ou script equivalente existente no projeto.

Não inventar scripts.

Verifique primeiro o `package.json`.

---

# NÃO IGNORAR ERROS

Se algum comando falhar devido às alterações feitas:

corrija.

Não finalize com:

```text
“já existia antes”
```

sem verificar.

Se o erro realmente for externo à tarefa/preexistente, documente claramente no relatório final.

---

# CRITÉRIOS DE ACEITAÇÃO

Considere esta tarefa concluída somente se:

## Comentários

* [ ] revisão inicia em modo visualização;
* [ ] clicar na arte não cria comentário sem ativar modo comentário;
* [ ] existe CTA claro de Comentar;
* [ ] modo comentário possui indicação visual;
* [ ] mobile também exige ativação explícita.

## Aprovação

* [ ] material sem comentários abertos pode ser aprovado normalmente;
* [ ] material com comentários abertos mostra confirmação;
* [ ] quantidade de comentários aparece corretamente;
* [ ] Cancelar não aprova;
* [ ] “Aprovar mesmo assim” envia a confirmação esperada;
* [ ] botão fica protegido contra clique duplicado.

## Estado aprovado

* [ ] aprovação bem-sucedida tem confirmação clara;
* [ ] estado aprovado continua visível após reload;
* [ ] usuário sabe que não precisa fazer mais nada;
* [ ] nenhuma aprovação falsa é mostrada se API falhar.

## Materiais

* [ ] imagem continua funcionando;
* [ ] vídeo possui identificação/preview melhor;
* [ ] PDF possui identificação/preview melhor;
* [ ] nenhum vídeo usa autoplay;
* [ ] listagem continua performática.

## Mobile

* [ ] 375px funciona;
* [ ] 390px funciona;
* [ ] 430px funciona;
* [ ] nenhuma ação importante fica fora da viewport;
* [ ] não existe overflow horizontal.

## Qualidade

* [ ] white-label preservado;
* [ ] reduced-motion preservado;
* [ ] acessibilidade não regrediu;
* [ ] nenhuma biblioteca desnecessária adicionada;
* [ ] TypeScript passa;
* [ ] lint passa;
* [ ] build passa.

---

# ORDEM DE IMPLEMENTAÇÃO

Sugestão:

```text
1. Analisar PortalRevisaoPage atual
2. Alterar estado inicial do modo comentário
3. Criar confirmação para aprovação com pendências
4. Melhorar estado persistente de aprovado
5. Revisar loading/error states
6. Melhorar cards de vídeo/PDF
7. Revisar mobile
8. Atualizar/adicionar testes
9. Rodar validações
```

Não comece redesenhando componentes antes de entender o comportamento atual.

---

# O QUE NÃO FAZER

Não:

* refazer o Hero;
* alterar homepage;
* alterar dashboard;
* alterar páginas internas sem necessidade;
* criar novo design system;
* adicionar bibliotecas pesadas;
* criar tutorial;
* criar onboarding para o cliente;
* adicionar login obrigatório ao portal;
* criar novos menus;
* transformar o portal em dashboard;
* adicionar funcionalidades fora do escopo;
* alterar copy comercial do site.

---

# RESULTADO ESPERADO

Quero que o fluxo final seja:

```text
Cliente recebe link
        ↓
Abre projeto

“Materiais para revisar”
        ↓
Escolhe material
        ↓
Visualiza normalmente

        ┌───────────────────────────┐
        │                           │
        │         MATERIAL          │
        │                           │
        └───────────────────────────┘

[ Comentar ]

[ Solicitar alterações ] [ Aprovar ]
```

Se quiser comentar:

```text
Comentar
   ↓

“Clique no material para adicionar um comentário”

   ↓

● ← clica no ponto

   ↓

escreve comentário

   ↓

enviar

   ↓

volta para visualização
```

Se quiser aprovar sem pendências:

```text
Aprovar
   ↓

✓ Versão aprovada

Sua aprovação foi registrada.
Nenhuma ação adicional é necessária.
```

Se houver comentários pendentes:

```text
Aprovar
   ↓

┌────────────────────────────────────────┐
│ Existem 3 comentários pendentes       │
│                                        │
│ Deseja aprovar esta versão mesmo      │
│ assim?                                 │
│                                        │
│ [ Voltar ]   [ Aprovar mesmo assim ]  │
└────────────────────────────────────────┘
```

É essa previsibilidade que quero.

---

# PERGUNTA FINAL DE UX

Antes de concluir, faça uma revisão manual simulando:

> “Sou cliente de uma agência, recebi este link no WhatsApp e nunca vi o Viztto.”

Pergunte:

1. Sei imediatamente o que estou vendo?
2. Sei como abrir um material?
3. Consigo observar a arte sem criar comentário por acidente?
4. Sei como comentar?
5. Sei claramente a diferença entre comentar, pedir alteração e aprovar?
6. Existe risco de aprovar por engano?
7. Depois de aprovar, tenho certeza de que terminou?
8. Consigo fazer tudo pelo celular sem treinamento?

Se alguma resposta for “não”, refine antes de considerar concluído.

---

# RELATÓRIO FINAL

Ao terminar, me informe objetivamente:

1. arquivos alterados;
2. componentes criados;
3. como o modo comentário foi alterado;
4. como funciona a confirmação de aprovação com pendências;
5. como o estado aprovado passou a funcionar;
6. como vídeo e PDF são apresentados;
7. mudanças feitas para mobile;
8. testes criados/alterados;
9. resultado de typecheck;
10. resultado de lint;
11. resultado de build;
12. resultado dos testes;
13. qualquer decisão que tenha divergido deste documento e o motivo.

Não faça mudanças adicionais apenas para “melhorar” o portal.

A prioridade desta tarefa é:

**fazer o cliente externo revisar e aprovar materiais com o mínimo possível de dúvida e com o mínimo possível de chance de erro.**
