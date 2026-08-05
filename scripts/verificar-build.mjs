import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { artefatosObrigatorios, raizProjeto } from './caminhos-projeto.mjs'

const ausentes = []
for (const artefato of artefatosObrigatorios) {
  try {
    await access(artefato)
  } catch {
    ausentes.push(path.relative(raizProjeto, artefato))
  }
}

const migrations = path.join(raizProjeto, 'servidor', 'banco', 'migrations')
if (!ausentes.includes(path.relative(raizProjeto, migrations))) {
  const arquivos = await readdir(migrations)
  if (!arquivos.some((arquivo) => arquivo.endsWith('.sql'))) ausentes.push('servidor/banco/migrations/*.sql')
}

if (ausentes.length) {
  console.error('Build incompleto. Artefatos ausentes:')
  for (const ausente of ausentes) console.error(`- ${ausente}`)
  console.error(`Diretório do projeto: ${raizProjeto}`)
  process.exit(1)
}

console.log('Build validado: frontend, backend e migrations disponíveis.')
