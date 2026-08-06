import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { banco, pool } from '../../configuracao/banco.js'
import {
  arquivos, clientes, comentarios, materiais, membrosWorkspace, projetos, usuarios,
  versoesMaterial, workspaces,
} from '../esquema/index.js'

const ids = {
  marina: '11111111-1111-4111-8111-111111111111', rafael: '22222222-2222-4222-8222-222222222222', bianca: '33333333-3333-4333-8333-333333333333',
  workspace: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', lume: 'aaaa0001-0000-4000-8000-000000000001', norte: 'aaaa0002-0000-4000-8000-000000000002', origem: 'aaaa0003-0000-4000-8000-000000000003', metabit: 'aaaa0004-0000-4000-8000-000000000004',
  projeto: 'bbbb0001-0000-4000-8000-000000000001', material: 'cccc0001-0000-4000-8000-000000000001',
  arquivo2: 'dddd0002-0000-4000-8000-000000000002', arquivo4: 'dddd0004-0000-4000-8000-000000000004',
} as const
const projetoIds = [ids.projeto, 'bbbb0002-0000-4000-8000-000000000002', 'bbbb0003-0000-4000-8000-000000000003', 'bbbb0004-0000-4000-8000-000000000004', 'bbbb0005-0000-4000-8000-000000000005', 'bbbb0006-0000-4000-8000-000000000006']
const nomesProjetos = ['Campanha de agosto','Rebranding institucional','Lancamento da nova colecao','Video de apresentacao','Landing page institucional','Calendario editorial']

async function copiarDemonstracao(nome: string) {
  const origem = path.resolve('public/demo', nome); const destinoDir = path.resolve('uploads/imagens'); const destino = path.join(destinoDir, nome)
  await mkdir(destinoDir, { recursive: true }); await copyFile(origem, destino)
  const conteudo = await readFile(destino)
  return { caminhoRelativo: `imagens/${nome}`, tamanho: conteudo.length, checksum: createHash('sha256').update(conteudo).digest('hex') }
}

try {
  const [existente] = await banco.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, 'estudio-aurora')).limit(1)
  if (existente) {
    console.log('Seed ja aplicado; nenhum registro foi duplicado.')
  } else {
    const agora = new Date('2026-08-01T12:00:00.000Z'); const senhaHash = await bcrypt.hash('Viztto@123', 12)
    const [img2, img4] = await Promise.all([copiarDemonstracao('review-campaign-v2.svg'), copiarDemonstracao('review-campaign-v4.svg')])
    await banco.transaction(async (tx) => {
      await tx.insert(usuarios).values([
        { id: ids.marina, nome: 'Marina Costa', email: 'marina@viztto.local', senhaHash, emailVerificadoEm: agora, admin: true, ativo: true, criadoEm: agora, atualizadoEm: agora },
        { id: ids.rafael, nome: 'Rafael Lima', email: 'rafael@viztto.local', senhaHash, emailVerificadoEm: agora, ativo: true, criadoEm: agora, atualizadoEm: agora },
        { id: ids.bianca, nome: 'Bianca Alves', email: 'bianca@viztto.local', senhaHash, emailVerificadoEm: agora, ativo: true, criadoEm: agora, atualizadoEm: agora },
      ])
      await tx.insert(workspaces).values({ id: ids.workspace, nome: 'Estudio Aurora', slug: 'estudio-aurora', plano: 'studio', criadoPorUsuarioId: ids.marina, criadoEm: agora, atualizadoEm: agora })
      await tx.insert(membrosWorkspace).values([
        { id: 'eeee0001-0000-4000-8000-000000000001', workspaceId: ids.workspace, usuarioId: ids.marina, funcao: 'administrador', status: 'ativo', entrouEm: agora, criadoEm: agora, atualizadoEm: agora },
        { id: 'eeee0002-0000-4000-8000-000000000002', workspaceId: ids.workspace, usuarioId: ids.rafael, funcao: 'criativo', status: 'ativo', entrouEm: agora, criadoEm: agora, atualizadoEm: agora },
        { id: 'eeee0003-0000-4000-8000-000000000003', workspaceId: ids.workspace, usuarioId: ids.bianca, funcao: 'atendimento', status: 'ativo', entrouEm: agora, criadoEm: agora, atualizadoEm: agora },
      ])
      const clientela = [[ids.lume,'Lume Cosmeticos','Lume'],[ids.norte,'Norte Arquitetura','Norte'],[ids.origem,'Origem Cafe','Origem'],[ids.metabit,'Metabit','Metabit Tecnologia']] as const
      await tx.insert(clientes).values(clientela.map(([id,nome,empresa]) => ({ id, workspaceId: ids.workspace, nome, empresa, status: 'ativo' as const, criadoPorUsuarioId: ids.marina, criadoEm: agora, atualizadoEm: agora })))
      const clientesProjeto = [ids.lume, ids.norte, ids.origem, ids.lume, ids.metabit, ids.origem]
      await tx.insert(projetos).values(projetoIds.map((id, indice) => ({ id, workspaceId: ids.workspace, clienteId: clientesProjeto[indice]!, nome: nomesProjetos[indice]!, tipo: indice === 3 ? 'Video' : 'Campanha', status: indice === 0 ? 'alteracoes_solicitadas' as const : 'em_revisao' as const, criadoPorUsuarioId: ids.marina, criadoEm: agora, atualizadoEm: agora })))
      await tx.insert(arquivos).values([
        { id: ids.arquivo2, workspaceId: ids.workspace, nomeOriginal: 'review-campaign-v2.svg', nomeArmazenado: 'review-campaign-v2.svg', caminhoRelativo: img2.caminhoRelativo, mimeType: 'image/svg+xml', extensao: 'svg', tamanhoBytes: img2.tamanho, largura: 1200, altura: 800, checksum: img2.checksum, criadoPorUsuarioId: ids.marina, criadoEm: agora },
        { id: ids.arquivo4, workspaceId: ids.workspace, nomeOriginal: 'review-campaign-v4.svg', nomeArmazenado: 'review-campaign-v4.svg', caminhoRelativo: img4.caminhoRelativo, mimeType: 'image/svg+xml', extensao: 'svg', tamanhoBytes: img4.tamanho, largura: 1200, altura: 800, checksum: img4.checksum, criadoPorUsuarioId: ids.marina, criadoEm: agora },
      ])
      const versoes = [1,2,3,4].map((numero) => ({ id: `ffff000${numero}-0000-4000-8000-00000000000${numero}`, materialId: ids.material, arquivoId: numero < 3 ? ids.arquivo2 : ids.arquivo4, numero, nome: numero === 4 ? 'Versao atual' : `Ajuste ${numero}`, atual: numero === 4, aprovada: false, criadaPorUsuarioId: numero % 2 ? ids.marina : ids.rafael, criadoEm: new Date(agora.getTime() + numero * 3600_000) }))
      await tx.insert(materiais).values({ id: ids.material, workspaceId: ids.workspace, projetoId: ids.projeto, nome: 'Carrossel principal', tipo: 'imagem', status: 'alteracoes_solicitadas', versaoAtualId: null, criadoPorUsuarioId: ids.marina, criadoEm: agora, atualizadoEm: agora })
      await tx.insert(versoesMaterial).values(versoes)
      await tx.update(materiais).set({ versaoAtualId: versoes[3]!.id }).where(eq(materiais.id, ids.material))
      await tx.insert(comentarios).values([
        { id: '99990001-0000-4000-8000-000000000001', workspaceId: ids.workspace, materialId: ids.material, versaoMaterialId: versoes[3]!.id, usuarioId: ids.marina, texto: 'Podemos aumentar o contraste deste titulo?', posicaoX: '0.3400000', posicaoY: '0.2800000', status: 'aberto', criadoEm: agora, atualizadoEm: agora },
        { id: '99990002-0000-4000-8000-000000000002', workspaceId: ids.workspace, materialId: ids.material, versaoMaterialId: versoes[3]!.id, usuarioId: ids.rafael, texto: 'Ajustar o respiro entre o texto e a assinatura.', posicaoX: '0.7000000', posicaoY: '0.6800000', status: 'aberto', criadoEm: agora, atualizadoEm: agora },
      ])
    })
    console.log('Seed aplicado. Acesso: marina@viztto.local / Viztto@123')
  }
} finally { await pool.end() }

