import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import { raizProjeto } from './caminhos-projeto.mjs'

const uploads = await mkdtemp(path.join(path.dirname(raizProjeto), '.smoke-uploads-'))
const exigirProntidao = process.env.SMOKE_EXIGIR_PRONTIDAO === 'true'
const porta = await new Promise((resolve, reject) => {
  const servidor = createServer()
  servidor.once('error', reject)
  servidor.listen(0, '127.0.0.1', () => {
    const endereco = servidor.address()
    const livre = typeof endereco === 'object' && endereco ? endereco.port : 0
    servidor.close((erro) => (erro ? reject(erro) : resolve(livre)))
  })
})

const ambiente = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(porta),
  PORTA: '',
  SEGREDO_SESSAO: 'segredo-exclusivo-do-smoke-test-com-mais-de-32-caracteres',
  URL_APLICACAO: `http://127.0.0.1:${porta}`,
  DIRETORIO_UPLOADS: uploads,
  COOKIE_SEGURO: 'true',
  CONFIAR_PROXY: 'true',
  EXECUTAR_MIGRATIONS: 'false',
  EMAIL_HOST: 'smtp.smoke.local',
  EMAIL_PORTA: '465',
  EMAIL_USUARIO: 'contato@viztto.site',
  EMAIL_SENHA: 'senha-smoke-nao-utilizada',
  EMAIL_REMETENTE: 'contato@viztto.site',
  EMAIL_NOME: 'Viztto',
  ...(exigirProntidao
    ? {}
    : {
        BANCO_HOST: '127.0.0.1',
        BANCO_PORTA: '1',
        BANCO_NOME: 'viztto_smoke_sem_banco',
        BANCO_USUARIO: 'viztto_smoke',
        BANCO_SENHA: 'nao-utilizada',
      }),
}
const entrada = path.join(raizProjeto, 'server.js')
const entradaRequire = entrada.replaceAll('\\', '/')
const processo = spawn(process.execPath, ['--eval', `require(${JSON.stringify(entradaRequire)})`], {
  cwd: path.dirname(raizProjeto),
  env: ambiente,
  stdio: ['ignore', 'pipe', 'pipe'],
})
let saida = ''
processo.stdout.on('data', (parte) => (saida += parte.toString()))
processo.stderr.on('data', (parte) => (saida += parte.toString()))

try {
  const limite = Date.now() + 30_000
  let resposta
  while (Date.now() < limite) {
    if (processo.exitCode !== null)
      throw new Error(`Processo encerrou antes do health check.\n${saida}`)
    try {
      resposta = await fetch(`http://127.0.0.1:${porta}/api/saude`)
      if (resposta.ok) break
    } catch {
      // O processo ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  if (!resposta?.ok) throw new Error(`Health check não respondeu dentro do prazo.\n${saida}`)
  const corpo = await resposta.json()
  if (corpo.estado !== 'ok') throw new Error('Resposta inesperada do health check.')
  for (const rota of ['/', '/entrar', '/criar-conta']) {
    const pagina = await fetch(`http://127.0.0.1:${porta}${rota}`)
    if (!pagina.ok || !pagina.headers.get('content-type')?.includes('text/html'))
      throw new Error(`A rota SPA ${rota} não foi servida corretamente.`)
  }
  const prontidao = await fetch(`http://127.0.0.1:${porta}/api/prontidao`)
  const corpoProntidao = await prontidao.json()
  if (exigirProntidao && (!prontidao.ok || corpoProntidao.estado !== 'pronto'))
    throw new Error('O readiness check não confirmou banco e uploads.')
  if (!exigirProntidao && prontidao.status !== 503)
    throw new Error('O readiness check não sinalizou corretamente a ausência do banco.')
  const apiAusente = await fetch(`http://127.0.0.1:${porta}/api/rota-inexistente`)
  if (apiAusente.ok || !apiAusente.headers.get('content-type')?.includes('json'))
    throw new Error('Uma rota ausente da API não retornou erro JSON.')
  const arquivoAusente = await fetch(`http://127.0.0.1:${porta}/arquivo-inexistente.js`)
  if (arquivoAusente.status !== 404 || arquivoAusente.headers.get('content-type')?.includes('html'))
    throw new Error('Um arquivo ausente caiu incorretamente no fallback SPA.')
  console.log(
    `Smoke test aprovado: entrypoint carregado via require(), SPA, health, readiness ${exigirProntidao ? 'conectado' : 'indisponível controlado'} e fallbacks validados.`,
  )
} finally {
  if (processo.exitCode === null) {
    processo.kill('SIGTERM')
    await new Promise((resolve) => processo.once('exit', resolve))
  }
  await rm(uploads, { recursive: true, force: true })
}
