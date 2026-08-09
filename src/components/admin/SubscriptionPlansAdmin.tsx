import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/DataDisplay'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/FormControls'
import {
  assinaturasApi,
  type IntegracaoMercadoPago,
  type PlanoAssinatura,
  type RecursosPlano,
} from '@/services/api/assinaturasApi'

function limiarParaInput(valor: number | null) {
  return valor == null ? '' : String(valor)
}

function limiarDeInput(valor: string): number | null {
  const texto = valor.trim()
  if (!texto) return null
  const n = Number(texto)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

function limparBeneficios(linhas: string[]) {
  return linhas.map((linha) => linha.trim()).filter(Boolean)
}

const RECURSOS_ADMIN: Array<{
  campo: keyof RecursosPlano
  titulo: string
  explicacao: string
}> = [
  {
    campo: 'permiteComentariosImagem',
    titulo: 'Comentar em imagens',
    explicacao: 'Permite enviar imagens e marcar comentários em pontos da imagem.',
  },
  {
    campo: 'permiteComentariosPdf',
    titulo: 'Comentar em PDF',
    explicacao: 'Permite enviar PDFs e comentar nesses arquivos.',
  },
  {
    campo: 'permiteComentariosVideo',
    titulo: 'Comentar em vídeo',
    explicacao: 'Permite enviar vídeos e comentar nesses materiais.',
  },
  {
    campo: 'permiteLinksPortalCliente',
    titulo: 'Link de revisão para o cliente',
    explicacao:
      'Gera link e senha para o cliente revisar o projeto sem criar conta no Viztto.',
  },
  {
    campo: 'permiteIdentidadePersonalizada',
    titulo: 'Configurar portal próprio',
    explicacao:
      'Libera cor, logo e portal de revisão sem a marca Viztto (URL e visual da empresa).',
  },
  {
    campo: 'permiteFuncoesAvancadas',
    titulo: 'Funções avançadas na equipe',
    explicacao:
      'Permite convidar com papéis gestor, criativo e atendimento (além de administrador e visualizador).',
  },
  {
    campo: 'permiteVariosAprovadores',
    titulo: 'Vários aprovadores no projeto',
    explicacao: 'Permite configurar mais de um aprovador por projeto.',
  },
  {
    campo: 'permiteHistoricoAvancado',
    titulo: 'Histórico avançado',
    explicacao: 'Libera histórico mais completo de atividades e versões (quando a tela existir).',
  },
  {
    campo: 'permitePrioridadeSuporte',
    titulo: 'Prioridade no suporte',
    explicacao: 'Marca o workspace como elegível a atendimento prioritário.',
  },
  {
    campo: 'permiteCalendarioEditorial',
    titulo: 'Calendário editorial',
    explicacao: 'Reserva o recurso de calendário (ainda sem tela no produto).',
  },
  {
    campo: 'permiteRelatorios',
    titulo: 'Relatórios',
    explicacao: 'Reserva o recurso de relatórios (ainda sem tela no produto).',
  },
]

export function SubscriptionPlansAdmin() {
  const [plans, setPlans] = useState<PlanoAssinatura[]>([])
  const [beneficiosTexto, setBeneficiosTexto] = useState<Record<string, string>>({})
  const [integration, setIntegration] = useState<IntegracaoMercadoPago | null>(null)
  const [busy, setBusy] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    const response = await assinaturasApi.listarPlanosAdmin()
    setPlans(response.dados)
    setIntegration(response.integracao)
    setBeneficiosTexto(
      Object.fromEntries(
        response.dados.map((plan) => [plan.id, (plan.beneficios ?? []).join('\n')]),
      ),
    )
  }
  useEffect(() => {
    void load().catch((cause) =>
      setFeedback({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Não foi possível carregar os planos.',
      }),
    )
  }, [])

  const run = async (key: string, action: () => Promise<{ mensagem: string }>) => {
    setBusy(key)
    setFeedback(null)
    try {
      const result = await action()
      setFeedback({ kind: 'success', text: result.mensagem })
      await load()
    } catch (cause) {
      setFeedback({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Não foi possível concluir.',
      })
    } finally {
      setBusy('')
    }
  }
  const change = (id: string, patch: Partial<PlanoAssinatura>) =>
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)))

  return (
    <section aria-labelledby="admin-plans-title" className="grid gap-5">
      <div>
        <h3 id="admin-plans-title" className="text-xl font-semibold text-ink">
          Planos de assinatura
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Edite nome, preço, benefícios, limites e recursos. Limite vazio = ilimitado. Ao salvar um
          plano pago, também sincroniza com o Mercado Pago.
        </p>
      </div>
      {integration && !integration.configurada && (
        <p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
          {integration.problemaConfiguracao ??
            'A integração ainda não está configurada. A edição local continua disponível.'}
        </p>
      )}
      {feedback && (
        <p
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={feedback.kind === 'error' ? 'text-sm text-revision' : 'text-sm text-approval'}
        >
          {feedback.text}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-secondary p-3">
        <p className="max-w-xl text-sm text-muted">
          Reconcilia carências e vigências Pix vencidas (revoga para gratuito). Pode ser agendado via
          cron apontando para o endpoint ou script.
        </p>
        <Button
          variant="secondary"
          loading={busy === 'reconciliar'}
          onClick={() => {
            void run('reconciliar', () => assinaturasApi.reconciliarAdmin())
          }}
        >
          Reconciliar assinaturas
        </Button>
      </div>
      <div className="grid gap-4">
        {plans.map((plan) => {
          const amount = Number(plan.valorMensal)
          const textoBeneficios =
            beneficiosTexto[plan.id] ?? (plan.beneficios ?? []).join('\n')
          return (
            <article
              key={plan.id}
              className="rounded-lg border border-line bg-surface-secondary p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Input
                    label="Nome"
                    value={plan.nome}
                    onChange={(event) => change(plan.id, { nome: event.target.value })}
                  />
                  <Textarea
                    className="mt-3"
                    label="Descrição"
                    value={plan.descricao}
                    onChange={(event) => change(plan.id, { descricao: event.target.value })}
                  />
                </div>
                <Badge tone={plan.ativo ? 'approval' : 'neutral'}>
                  {plan.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Input
                  label="Preço mensal (R$)"
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  value={Number.isFinite(amount) ? amount : ''}
                  onChange={(event) => change(plan.id, { valorMensal: event.target.value })}
                />
                <label className="flex min-h-11 items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={plan.ativo}
                    onChange={(event) => change(plan.id, { ativo: event.target.checked })}
                  />
                  Disponível para assinatura
                </label>
              </div>

              <Textarea
                className="mt-4"
                label="Benefícios exibidos (um por linha)"
                value={textoBeneficios}
                onChange={(event) => {
                  const texto = event.target.value
                  setBeneficiosTexto((atual) => ({ ...atual, [plan.id]: texto }))
                  change(plan.id, { beneficios: limparBeneficios(texto.split('\n')) })
                }}
              />

              <p className="mt-5 text-sm font-semibold text-ink">Limites numéricos</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(
                  [
                    ['maxProjetosAtivos', 'Máx. projetos ativos'],
                    ['maxMembros', 'Máx. pessoas na equipe'],
                    ['maxClientes', 'Máx. clientes'],
                    ['maxArmazenamentoGb', 'Máx. armazenamento (GB)'],
                    ['maxWorkspaces', 'Máx. workspaces'],
                  ] as const
                ).map(([campo, label]) => (
                  <Input
                    key={campo}
                    label={label}
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={limiarParaInput(plan[campo])}
                    onChange={(event) =>
                      change(plan.id, { [campo]: limiarDeInput(event.target.value) })
                    }
                  />
                ))}
              </div>

              <p className="mt-5 text-sm font-semibold text-ink">Recursos do plano</p>
              <p className="mt-1 text-xs text-muted">
                Marque o que este plano libera de verdade. Os itens com “ainda sem tela” ficam
                reservados para quando o módulo existir.
              </p>
              <div className="mt-3 grid gap-3">
                {RECURSOS_ADMIN.map((recurso) => (
                  <label
                    key={recurso.campo}
                    className="flex gap-3 rounded-md border border-line bg-surface p-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-brand"
                      checked={Boolean(plan[recurso.campo])}
                      onChange={(event) =>
                        change(plan.id, { [recurso.campo]: event.target.checked })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{recurso.titulo}</span>
                      <span className="mt-0.5 block text-xs text-muted">{recurso.explicacao}</span>
                    </span>
                  </label>
                ))}
              </div>

              <p className="mt-3 truncate text-xs text-muted">
                {plan.mercadoPagoPlanoId
                  ? `Mercado Pago: ${plan.mercadoPagoPlanoId}`
                  : 'Ainda não sincronizado'}
              </p>
              <div className="mt-4">
                <Button
                  className="w-full sm:w-auto"
                  loading={busy === `save-${plan.codigo}`}
                  onClick={() =>
                    void run(`save-${plan.codigo}`, () =>
                      assinaturasApi.atualizarPlano(plan.codigo, {
                        nome: plan.nome.trim(),
                        descricao: plan.descricao.trim(),
                        valorMensal: amount,
                        ativo: plan.ativo,
                        beneficios: limparBeneficios(
                          (beneficiosTexto[plan.id] ?? (plan.beneficios ?? []).join('\n')).split(
                            '\n',
                          ),
                        ),
                        maxProjetosAtivos: plan.maxProjetosAtivos,
                        maxMembros: plan.maxMembros,
                        maxClientes: plan.maxClientes,
                        maxArmazenamentoGb: plan.maxArmazenamentoGb,
                        maxWorkspaces: plan.maxWorkspaces,
                        permiteIdentidadePersonalizada: plan.permiteIdentidadePersonalizada,
                        permiteCalendarioEditorial: plan.permiteCalendarioEditorial,
                        permiteRelatorios: plan.permiteRelatorios,
                        permiteComentariosImagem: plan.permiteComentariosImagem,
                        permiteComentariosVideo: plan.permiteComentariosVideo,
                        permiteComentariosPdf: plan.permiteComentariosPdf,
                        permiteLinksPortalCliente: plan.permiteLinksPortalCliente,
                        permiteVariosAprovadores: plan.permiteVariosAprovadores,
                        permiteHistoricoAvancado: plan.permiteHistoricoAvancado,
                        permitePrioridadeSuporte: plan.permitePrioridadeSuporte,
                        permiteFuncoesAvancadas: plan.permiteFuncoesAvancadas,
                      }),
                    )
                  }
                >
                  {Number(plan.valorMensal) > 0 ? 'Salvar e sincronizar' : 'Salvar plano'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
