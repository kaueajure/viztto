import { pool } from '../configuracao/banco.js'
import { reconciliarAssinaturasVencidas } from '../servicos/assinatura-plano.servico.js'

try {
  const resultado = await reconciliarAssinaturasVencidas()
  console.log(
    `Reconciliacao concluida. ${resultado.revogadas} assinatura(s) revogada(s) em ${resultado.processadasEm}.`,
  )
} finally {
  await pool.end()
}
