import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'
import { autenticacaoApi } from '@/services/api/autenticacaoApi'
import { ApiError } from '@/services/api/clienteHttp'

export const TIPOS_EMPRESA = [
  { valor: 'agencia', rotulo: 'Agência' },
  { valor: 'estudio', rotulo: 'Estúdio criativo' },
  { valor: 'freelancer', rotulo: 'Freelancer' },
  { valor: 'marketing', rotulo: 'Equipe de marketing' },
  { valor: 'produtora', rotulo: 'Produtora' },
  { valor: 'consultoria', rotulo: 'Consultoria' },
  { valor: 'outro', rotulo: 'Outros...' },
] as const

export function normalizarSlug(valor: string) {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

type Props = {
  open: boolean
  nomeUsuario: string
  onConcluido: () => void
  onCriar: (dados: { nome: string; slug: string; tipo: string }) => Promise<void>
}

export function CriarEmpresaModal({ open, nomeUsuario, onConcluido, onCriar }: Props) {
  const [usoPessoal, setUsoPessoal] = useState(false)
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [tipo, setTipo] = useState('agencia')
  const [tipoOutro, setTipoOutro] = useState('')
  const [erro, setErro] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'verificando' | 'livre' | 'ocupado'>('idle')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) return
    setUsoPessoal(false)
    setNome('')
    setSlug('')
    setSlugManual(false)
    setTipo('agencia')
    setTipoOutro('')
    setErro('')
    setSlugStatus('idle')
  }, [open])

  useEffect(() => {
    if (!usoPessoal) return
    const base = nomeUsuario.trim() || 'meu-espaco'
    setNome(`Espaço de ${base.split(/\s+/)[0]}`)
    if (!slugManual) setSlug(normalizarSlug(base))
    setTipo('pessoal')
  }, [usoPessoal, nomeUsuario, slugManual])

  useEffect(() => {
    if (usoPessoal || slugManual) return
    setSlug(normalizarSlug(nome))
  }, [nome, usoPessoal, slugManual])

  useEffect(() => {
    const candidato = normalizarSlug(slug)
    if (!candidato || candidato.length < 2) {
      setSlugStatus('idle')
      return
    }
    let ativo = true
    setSlugStatus('idle')
    const timer = window.setTimeout(() => {
      setSlugStatus('verificando')
      void autenticacaoApi
        .slugDisponivel(candidato)
        .then(({ disponivel }) => {
          if (!ativo) return
          setSlugStatus(disponivel ? 'livre' : 'ocupado')
        })
        .catch(() => {
          if (ativo) setSlugStatus('idle')
        })
    }, 3000)
    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
  }, [slug])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErro('')
    const slugFinal = normalizarSlug(slug)
    const nomeFinal = nome.trim()
    const tipoFinal =
      usoPessoal
        ? 'pessoal'
        : tipo === 'outro'
          ? tipoOutro.trim() || 'outro'
          : tipo

    if (!nomeFinal || nomeFinal.length < 2) {
      setErro('Informe o nome da empresa ou do espaço.')
      return
    }
    if (!slugFinal || slugFinal.length < 2) {
      setErro('Informe uma URL válida com pelo menos 2 caracteres.')
      return
    }
    if (!/^[a-z0-9-]+$/.test(slugFinal)) {
      setErro('A URL deve conter apenas letras minúsculas, números e hífens.')
      return
    }
    if (!usoPessoal && tipo === 'outro' && !tipoOutro.trim()) {
      setErro('Descreva o tipo da empresa.')
      return
    }
    if (slugStatus === 'ocupado') {
      setErro('Essa URL já está em uso. Escolha outra.')
      return
    }

    setEnviando(true)
    try {
      await onCriar({ nome: nomeFinal, slug: slugFinal, tipo: tipoFinal.slice(0, 80) })
      onConcluido()
    } catch (falha) {
      if (falha instanceof ApiError && falha.codigo === 'slug_em_uso') {
        setSlugStatus('ocupado')
        setErro('Essa URL já está em uso. Escolha outra.')
      } else {
        setErro(falha instanceof Error ? falha.message : 'Não foi possível criar a empresa.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal open={open} onClose={() => undefined} title="Crie sua empresa" dismissible={false}>
      <form onSubmit={(event) => void submit(event)} className="grid gap-4">
        <p className="text-sm text-secondary">
          Defina como sua empresa aparece no Viztto. Você poderá ajustar detalhes depois.
        </p>
        <Checkbox
          label="É para uso pessoal (não tenho empresa)"
          checked={usoPessoal}
          onChange={setUsoPessoal}
        />
        <Input
          label={usoPessoal ? 'Nome do espaço' : 'Nome da empresa'}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={usoPessoal ? 'Meu espaço' : 'Nome da empresa'}
          required
        />
        <div>
          <Input
            label="URL da empresa"
            value={slug}
            onChange={(e) => {
              setSlugManual(true)
              setSlug(normalizarSlug(e.target.value))
            }}
            hint={`viztto.site/${slug || 'sua-empresa'}`}
            error={slugStatus === 'ocupado' ? 'URL já utilizada por outra empresa.' : undefined}
          />
          {slugStatus === 'verificando' && (
            <p className="mt-1 text-xs text-muted">Verificando disponibilidade...</p>
          )}
          {slugStatus === 'livre' && (
            <p className="mt-1 text-xs text-approval">URL disponível.</p>
          )}
        </div>
        {!usoPessoal && (
          <>
            <Select label="Tipo da empresa" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_EMPRESA.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.rotulo}
                </option>
              ))}
            </Select>
            {tipo === 'outro' && (
              <Input
                label="Descreva o tipo"
                value={tipoOutro}
                onChange={(e) => setTipoOutro(e.target.value)}
                placeholder="Ex.: Educacional, ONG, Startup..."
                required
              />
            )}
          </>
        )}
        {erro && (
          <p role="alert" className="text-sm text-revision">
            {erro}
          </p>
        )}
        <Button type="submit" className="w-full" loading={enviando}>
          Continuar para o Viztto
        </Button>
      </form>
    </Modal>
  )
}
