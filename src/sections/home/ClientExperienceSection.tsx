import { Check } from 'lucide-react'
import { ClientMobileFlow } from '@/components/client-experience/ClientMobileFlow'
import { Container } from '@/components/layout/Container'

const benefits = [
  'Acesso pelo navegador',
  'Experiência responsiva',
  'Conta opcional para o cliente',
  'Links protegidos',
  'Vários aprovadores',
  'Registro de aprovação',
]

export function ClientExperienceSection() {
  return (
    <section
      id="experiencia-cliente"
      aria-labelledby="client-title"
      className="scroll-mt-24 py-20 md:py-28"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="eyebrow">Fácil para quem cria. Simples para quem aprova.</p>
            <h2 id="client-title" className="heading-lg mt-4">
              Seu cliente só precisa{' '}
              <span className="font-serif font-normal text-brand">abrir o link.</span>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-secondary">
            O cliente acessa pelo navegador, revisa o material, comenta e aprova sem instalar um
            aplicativo e sem criar uma conta obrigatoriamente.
          </p>
        </div>
        <div className="mt-14 grid gap-12 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
          <ClientMobileFlow />
          <aside className="border-l border-line pl-6">
            <p className="eyebrow">Na experiência de aprovação</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-brand">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-7 text-xs leading-relaxed text-muted">
              Os detalhes de controle de acesso serão definidos antes do lançamento comercial.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  )
}
