import { spawnSync } from 'node:child_process'

if (process.env.VIZTTO_IGNORAR_BUILD_POS_INSTALL === 'true') {
  console.log('Build do postinstall ignorado explicitamente neste ambiente.')
  process.exit(0)
}

const npmCli = process.env.npm_execpath
if (!npmCli) {
  console.error('Não foi possível localizar o executável do npm para realizar o build.')
  process.exit(1)
}

console.log('Preparando os artefatos de produção do Viztto...')
const resultado = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
  env: process.env,
  stdio: 'inherit',
})

if (resultado.error) {
  console.error('Não foi possível executar o build do Viztto.', resultado.error.message)
  process.exit(1)
}

process.exit(resultado.status ?? 1)
