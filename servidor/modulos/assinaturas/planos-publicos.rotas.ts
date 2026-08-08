import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { banco } from '../../configuracao/banco.js'
import { planosAssinatura } from '../../banco/esquema/index.js'

export const planosPublicosRotas = Router()

planosPublicosRotas.get('/planos', async (_req, res) => {
  const dados = await banco
    .select({
      codigo: planosAssinatura.codigo,
      nome: planosAssinatura.nome,
      descricao: planosAssinatura.descricao,
      valorMensal: planosAssinatura.valorMensal,
      moeda: planosAssinatura.moeda,
      beneficios: planosAssinatura.beneficios,
    })
    .from(planosAssinatura)
    .where(eq(planosAssinatura.ativo, true))
    .orderBy(asc(planosAssinatura.valorMensal))

  res.setHeader('Cache-Control', 'no-store')
  res.json({ dados })
})
