import { z } from 'zod'

export const consultaPaginada = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(30),
  busca: z.string().trim().max(200).optional(),
})

export const paginar = (pagina: number, porPagina: number, total: number, dados: unknown[]) => ({
  dados,
  paginacao: { pagina, porPagina, total, totalPaginas: Math.ceil(total / porPagina) },
})
