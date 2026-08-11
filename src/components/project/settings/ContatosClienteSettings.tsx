import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/FormControls'
import { contatosClienteApi, type ContatoCliente } from '@/services/api/contatosClienteApi'
import { SettingsSection } from './SettingsSection'

type Props = {
  clienteId: string
}

const contatoVazio = {
  nome: '',
  email: '',
  podeComentar: true,
  podeSolicitarAlteracoes: true,
  podeAprovar: false,
}

export function ContatosClienteSettings({ clienteId }: Props) {
  const [contatos, setContatos] = useState<ContatoCliente[]>([])
  const [form, setForm] = useState(contatoVazio)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!clienteId) return
    setCarregando(true)
    setErro('')
    try {
      const { dados } = await contatosClienteApi.listar(clienteId)
      setContatos(dados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar os contatos.')
    } finally {
      setCarregando(false)
    }
  }, [clienteId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const resetForm = () => {
    setForm(contatoVazio)
    setEditandoId(null)
  }

  const salvar = async () => {
    setMsg('')
    setErro('')
    setSalvando(true)
    try {
      if (editandoId) {
        await contatosClienteApi.atualizar(clienteId, editandoId, form)
        setMsg('Contato atualizado.')
      } else {
        await contatosClienteApi.criar(clienteId, form)
        setMsg('Contato adicionado.')
      }
      resetForm()
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o contato.')
    } finally {
      setSalvando(false)
    }
  }

  const editar = (contato: ContatoCliente) => {
    setEditandoId(contato.id)
    setForm({
      nome: contato.nome,
      email: contato.email,
      podeComentar: contato.podeComentar,
      podeSolicitarAlteracoes: contato.podeSolicitarAlteracoes,
      podeAprovar: contato.podeAprovar,
    })
  }

  const remover = async (contatoId: string) => {
    setMsg('')
    setErro('')
    try {
      await contatosClienteApi.remover(clienteId, contatoId)
      setMsg('Contato removido.')
      if (editandoId === contatoId) resetForm()
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível remover o contato.')
    }
  }

  return (
    <SettingsSection
      title="Contatos do cliente (portal)"
      description="Pessoas do Cliente 2 que revisam, comentam e aprovam no portal. A aprovação final só pode ser feita por quem tiver permissão para aprovar."
    >
      {carregando ? (
        <p className="text-sm text-muted">Carregando contatos...</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {contatos.map((contato) => {
            const perms = [
              contato.podeComentar ? 'comentar' : null,
              contato.podeSolicitarAlteracoes ? 'solicitar alterações' : null,
              contato.podeAprovar ? 'aprovar' : null,
            ].filter(Boolean)
            return (
              <li
                key={contato.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{contato.nome}</p>
                  <p className="text-xs text-muted">{contato.email}</p>
                  <p className="mt-1 text-xs text-secondary">
                    {perms.length ? perms.join(' · ') : 'Sem permissões'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => editar(contato)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-9 px-3 text-xs"
                    onClick={() => void remover(contato.id)}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            )
          })}
          {!contatos.length && (
            <li className="p-4 text-sm text-muted">Nenhum contato cadastrado para este cliente.</li>
          )}
        </ul>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Input
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm((atual) => ({ ...atual, nome: e.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((atual) => ({ ...atual, email: e.target.value }))}
        />
        <div className="sm:col-span-2 grid gap-2">
          <Checkbox
            label="Pode comentar"
            checked={form.podeComentar}
            onChange={(checked) => setForm((atual) => ({ ...atual, podeComentar: checked }))}
          />
          <Checkbox
            label="Pode solicitar alterações"
            checked={form.podeSolicitarAlteracoes}
            onChange={(checked) =>
              setForm((atual) => ({ ...atual, podeSolicitarAlteracoes: checked }))
            }
          />
          <Checkbox
            label="Pode aprovar"
            checked={form.podeAprovar}
            onChange={(checked) => setForm((atual) => ({ ...atual, podeAprovar: checked }))}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" loading={salvando} onClick={() => void salvar()}>
          {editandoId ? 'Salvar contato' : 'Adicionar contato'}
        </Button>
        {editandoId && (
          <Button type="button" variant="secondary" onClick={resetForm}>
            Cancelar edição
          </Button>
        )}
        {msg && (
          <p role="status" className="text-sm text-approval">
            {msg}
          </p>
        )}
        {erro && (
          <p role="alert" className="text-sm text-revision">
            {erro}
          </p>
        )}
      </div>
    </SettingsSection>
  )
}
