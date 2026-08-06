import { Link } from 'react-router'

type Section = { title: string; paragraphs: string[]; items?: string[] }

function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string
  intro: string
  sections: Section[]
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <p className="eyebrow">Documentos legais</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm text-muted">Vigente desde 6 de agosto de 2026.</p>
      <p className="mt-8 text-lg leading-8 text-secondary">{intro}</p>
      <div className="mt-12 space-y-10">
        {sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`legal-${index}`}>
            <h2 id={`legal-${index}`} className="text-xl font-semibold text-ink">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-7 text-secondary">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="mt-4 list-disc space-y-2 pl-6 text-secondary">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <div className="mt-14 flex flex-wrap gap-4 border-t border-line pt-8 text-sm">
        <Link className="font-semibold text-brand" to="/termos">
          Termos de Uso
        </Link>
        <Link className="font-semibold text-brand" to="/privacidade">
          Política de Privacidade
        </Link>
        <a className="font-semibold text-brand" href="mailto:contato@viztto.site">
          contato@viztto.site
        </a>
      </div>
    </main>
  )
}

export function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro="Estes Termos regulam o acesso e o uso do Viztto, uma plataforma para gestão de projetos, arquivos, revisões, comentários e aprovações entre equipes e clientes."
      sections={[
        {
          title: '1. Aceitação e conta',
          paragraphs: [
            'Ao criar uma conta, aceitar um convite ou utilizar o serviço, você concorda com estes Termos e com a Política de Privacidade. Você deve fornecer informações verdadeiras, manter suas credenciais protegidas e comunicar imediatamente qualquer acesso não autorizado.',
          ],
        },
        {
          title: '2. Workspaces e permissões',
          paragraphs: [
            'O responsável pelo workspace administra membros, funções e conteúdos. Cada membro deve usar apenas as permissões concedidas. A pessoa ou organização que criou o workspace é responsável por garantir que possui autorização para incluir clientes, arquivos e dados pessoais.',
          ],
        },
        {
          title: '3. Conteúdo enviado',
          paragraphs: [
            'Você mantém a titularidade dos materiais enviados e concede ao Viztto autorização limitada para armazenar, processar, exibir e transmitir esses conteúdos exclusivamente para operar o serviço.',
          ],
          items: [
            'Não envie conteúdo ilegal, malicioso ou que viole direitos de terceiros.',
            'Garanta que possui direitos e autorizações sobre arquivos, marcas e dados enviados.',
            'Mantenha cópias próprias de conteúdos essenciais.',
          ],
        },
        {
          title: '4. Uso aceitável',
          paragraphs: [
            'É proibido tentar contornar controles de acesso, explorar vulnerabilidades, sobrecarregar a infraestrutura, distribuir malware, acessar dados de terceiros ou usar o serviço para atividades ilícitas. Podemos restringir acessos que ofereçam risco à plataforma ou a outras pessoas.',
          ],
        },
        {
          title: '5. Disponibilidade e alterações',
          paragraphs: [
            'Podemos realizar manutenções, corrigir falhas e alterar funcionalidades. Buscaremos preservar a continuidade e comunicar mudanças materiais, mas não garantimos operação ininterrupta. Funcionalidades identificadas como experimentais podem mudar ou ser descontinuadas.',
          ],
        },
        {
          title: '6. Planos, pagamentos e cancelamento',
          paragraphs: [
            'Quando houver contratação paga, preço, ciclo, limites e regras de cancelamento serão apresentados antes da confirmação. O cancelamento impede novas cobranças, sem prejuízo de valores já devidos. Regras específicas da oferta prevalecem quando informadas claramente.',
          ],
        },
        {
          title: '7. Suspensão e encerramento',
          paragraphs: [
            'Você pode deixar de usar o serviço a qualquer momento. Podemos suspender ou encerrar contas em caso de violação destes Termos, risco de segurança, obrigação legal ou inadimplência, respeitando aviso prévio quando razoavelmente possível.',
          ],
        },
        {
          title: '8. Responsabilidade',
          paragraphs: [
            'Na extensão permitida pela legislação aplicável, o Viztto não responde por decisões tomadas com base em conteúdos dos usuários, falhas de serviços de terceiros, perda causada por credenciais comprometidas pelo usuário ou danos indiretos. Nada nestes Termos exclui direitos que não possam ser afastados por lei.',
          ],
        },
        {
          title: '9. Lei aplicável e contato',
          paragraphs: [
            'Estes Termos são regidos pelas leis brasileiras. Dúvidas, solicitações ou notificações podem ser enviadas para contato@viztto.site. Eventuais conflitos serão tratados no foro competente conforme a legislação de proteção ao consumidor e demais normas aplicáveis.',
          ],
        },
      ]}
    />
  )
}

export function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="Esta Política explica como o Viztto trata dados pessoais de usuários, convidados e clientes, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD)."
      sections={[
        {
          title: '1. Dados tratados',
          paragraphs: ['Tratamos dados fornecidos no cadastro, uso do produto e suporte.'],
          items: [
            'Identificação e contato, como nome e e-mail.',
            'Dados do workspace, função, preferências e convites.',
            'Arquivos, comentários e demais conteúdos inseridos no serviço.',
            'Dados técnicos, como endereço IP, navegador, registros de acesso e eventos de segurança.',
            'Dados de cobrança, quando aplicável, processados também por provedores de pagamento.',
          ],
        },
        {
          title: '2. Finalidades e bases legais',
          paragraphs: [
            'Usamos os dados para criar e autenticar contas, operar workspaces, entregar notificações, armazenar materiais, permitir revisões, prevenir fraude, prestar suporte e cumprir obrigações legais. O tratamento se baseia principalmente na execução do contrato, legítimo interesse, cumprimento de obrigação legal e consentimento quando exigido.',
          ],
        },
        {
          title: '3. Papéis no tratamento',
          paragraphs: [
            'Para dados de membros da conta, o Viztto atua normalmente como controlador. Para dados e conteúdos que uma organização inclui no workspace por conta própria, o Viztto pode atuar como operador, seguindo instruções dessa organização, que permanece responsável pela base legal e pelos direitos dos titulares.',
          ],
        },
        {
          title: '4. Compartilhamento',
          paragraphs: [
            'Podemos compartilhar dados com fornecedores essenciais de hospedagem, banco de dados, armazenamento, e-mail, monitoramento, suporte e pagamentos, limitados ao necessário para prestar o serviço. Também podemos compartilhar informações para cumprir ordem legal, proteger direitos ou viabilizar operação societária legítima. Não vendemos dados pessoais.',
          ],
        },
        {
          title: '5. Armazenamento e segurança',
          paragraphs: [
            'Adotamos controles técnicos e organizacionais compatíveis com o risco, incluindo credenciais protegidas por hash, tokens com expiração, isolamento por workspace e registros de acesso. Nenhum sistema é absolutamente invulnerável; incidentes relevantes serão tratados e comunicados conforme a legislação.',
          ],
        },
        {
          title: '6. Retenção e exclusão',
          paragraphs: [
            'Mantemos dados pelo tempo necessário para prestar o serviço, cumprir obrigações legais, resolver disputas e preservar segurança. Após o encerramento, dados podem permanecer em backups por período limitado e ser eliminados ou anonimizados de forma segura.',
          ],
        },
        {
          title: '7. Direitos do titular',
          paragraphs: [
            'Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, informação sobre compartilhamento, revisão de decisões automatizadas, anonimização, bloqueio ou eliminação quando aplicável, além de revogar consentimento. Podemos solicitar comprovação de identidade antes de responder.',
          ],
        },
        {
          title: '8. Cookies e sessões',
          paragraphs: [
            'Usamos cookies estritamente necessários para autenticação, proteção contra requisições indevidas e acesso ao portal. Eles não são utilizados, nesta versão, para publicidade comportamental de terceiros.',
          ],
        },
        {
          title: '9. Transferências e atualizações',
          paragraphs: [
            'Fornecedores podem processar dados fora do Brasil mediante salvaguardas adequadas. Podemos atualizar esta Política para refletir mudanças legais ou operacionais; alterações relevantes serão destacadas no produto ou enviadas pelos canais disponíveis.',
          ],
        },
        {
          title: '10. Contato',
          paragraphs: [
            'Para exercer direitos ou esclarecer dúvidas sobre privacidade, escreva para contato@viztto.site. Responderemos dentro dos prazos aplicáveis e encaminharemos a solicitação ao responsável adequado quando o workspace atuar como controlador.',
          ],
        },
      ]}
    />
  )
}
