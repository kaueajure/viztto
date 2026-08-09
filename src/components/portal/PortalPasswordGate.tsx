import { useState, type FormEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/FormControls'
import { comTokenPortal } from '@/lib/portalPaths'
import { json, requisicaoApi } from '@/services/api/clienteHttp'

export function PortalPasswordGate({
  projectId,
  token,
  onUnlocked,
}: {
  projectId: string
  token: string
  onUnlocked: () => void
}) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setCarregando(true)
    setErro('')
    try {
      await requisicaoApi(comTokenPortal(`/api/portal/projetos/${projectId}/desbloquear`, token), {
        method: 'POST',
        body: json({ senha }),
      })
      onUnlocked()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Senha incorreta.')
    } finally {
      setCarregando(false)
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#080b12] px-5 text-[#f6f8fb]">
      <form
        onSubmit={(e) => void enviar(e)}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl"
      >
        <LockKeyhole className="h-8 w-8 text-[#b8ff4f]" aria-hidden />
        <h1 className="mt-5 text-2xl font-semibold">Portal protegido</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Digite a senha enviada pela equipe para acessar este projeto.
        </p>
        <div className="mt-6">
          <Input
            label="Senha"
            type="password"
            autoFocus
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        {erro && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {erro}
          </p>
        )}
        <Button className="mt-5 w-full" type="submit" loading={carregando}>
          Entrar no portal
        </Button>
      </form>
    </main>
  )
}
