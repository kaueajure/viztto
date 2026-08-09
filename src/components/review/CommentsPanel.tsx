import { Check, MessageSquare, Pencil, Reply, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Avatar, Badge, EmptyState } from '@/components/ui/DataDisplay'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Interactive'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'
import { formatVideoTimestamp } from '@/lib/formatVideoTimestamp'
import type { MaterialVersion, ReviewComment } from '@/types/domain'

type Filter = 'all' | 'open' | 'resolved' | 'current'

const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export function CommentsPanel({
  comments,
  versions,
  activeVersionId,
  selectedId,
  onSelect,
  onReply,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
}: {
  comments: ReviewComment[]
  versions: MaterialVersion[]
  activeVersionId: string
  selectedId: string | null
  onSelect: (comment: ReviewComment) => void
  onReply: (commentId: string, text: string) => void
  onResolve: (commentId: string) => void
  onReopen: (commentId: string) => void
  onEdit: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
}) {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>('current')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [replying, setReplying] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [editing, setEditing] = useState<ReviewComment | null>(null)
  const [deleting, setDeleting] = useState<ReviewComment | null>(null)
  const roots = useRef<Record<string, HTMLDivElement | null>>({})
  const openCount = comments.filter((comment) => comment.status === 'open').length
  const visible = useMemo(() => {
    const selected = comments.filter((comment) => {
      if (filter === 'open') return comment.status === 'open'
      if (filter === 'resolved') return comment.status === 'resolved'
      if (filter === 'current') return comment.versionId === activeVersionId
      return true
    })
    return selected.sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    )
  }, [comments, filter, sort, activeVersionId])

  useEffect(() => {
    if (!selectedId) return
    roots.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  const versionNumber = (versionId: string) =>
    versions.find((version) => version.id === versionId)?.number ?? '?'

  return (
    <section aria-label="Comentários da revisão" className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Comentários</h2>
          <span className="text-xs text-secondary">
            {comments.length} total · {openCount} abertos
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Select
            label="Filtrar"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="all">Todos</option>
            <option value="open">Abertos</option>
            <option value="resolved">Resolvidos</option>
            <option value="current">Versão visualizada</option>
          </Select>
          <Select
            label="Ordenar"
            value={sort}
            onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </Select>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {visible.map((comment) => {
            const number = comments.findIndex((item) => item.id === comment.id) + 1
            return (
              <div
                ref={(element) => {
                  roots.current[comment.id] = element
                }}
                key={comment.id}
                data-comment-id={comment.id}
                className={cn(
                  'rounded-md border bg-surface p-3 transition-colors',
                  selectedId === comment.id ? 'border-brand ring-2 ring-brand/15' : 'border-line',
                )}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelect(comment)}
                >
                  <div className="flex items-start gap-2">
                    <Avatar name={comment.authorName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{comment.authorName}</strong>
                        <Badge tone={comment.status === 'open' ? 'revision' : 'approval'}>
                          #{number} · {comment.status === 'open' ? 'Aberto' : 'Resolvido'}
                        </Badge>
                        <Badge>v{versionNumber(comment.versionId)}</Badge>
                        {comment.timestampSeconds != null && (
                          <Badge>{formatVideoTimestamp(comment.timestampSeconds)}</Badge>
                        )}
                        {comment.pdfPage != null && <Badge>Pág. {comment.pdfPage}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted">{date(comment.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">{comment.text}</p>
                </button>
                {comment.replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l border-line pl-3">
                    {comment.replies.map((item) => (
                      <div key={item.id} className="text-sm">
                        <p>
                          <strong>{item.authorName}</strong>{' '}
                          <span className="text-xs text-muted">· {date(item.createdAt)}</span>
                        </p>
                        <p className="mt-1 line-clamp-3 text-secondary">{item.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {replying === comment.id && (
                  <form
                    className="mt-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!reply.trim()) return
                      onReply(comment.id, reply)
                      setReply('')
                      setReplying(null)
                    }}
                  >
                    <Textarea
                      autoFocus
                      label="Sua resposta"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button type="submit">Responder</Button>
                      <Button type="button" variant="ghost" onClick={() => setReplying(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-2">
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2 text-xs"
                    onClick={() => {
                      setReplying(comment.id)
                      setReply('')
                    }}
                  >
                    <Reply className="h-3.5 w-3.5" /> Responder
                  </Button>
                  {comment.status === 'open' ? (
                    <Button
                      variant="ghost"
                      className="min-h-9 px-2 text-xs"
                      onClick={() => onResolve(comment.id)}
                    >
                      <Check className="h-3.5 w-3.5" /> Resolver
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="min-h-9 px-2 text-xs"
                      onClick={() => onReopen(comment.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                    </Button>
                  )}
                  {comment.authorId === user?.id && (
                    <>
                      <Button
                        variant="ghost"
                        className="min-h-9 px-2 text-xs"
                        onClick={() => setEditing(comment)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-9 px-2 text-xs text-revision"
                        onClick={() => setDeleting(comment)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {!visible.length && (
            <EmptyState
              icon={MessageSquare}
              title="Nenhum comentário neste filtro"
              description="Altere o filtro ou adicione um comentário sobre o material."
            />
          )}
        </div>
      </div>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Editar comentário">
        {editing && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!editing.text.trim()) return
              onEdit(editing.id, editing.text)
              setEditing(null)
            }}
          >
            <Input
              label="Comentário"
              value={editing.text}
              onChange={(event) => setEditing({ ...editing, text: event.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Excluir comentário?">
        <p className="text-sm text-secondary">
          O comentário e suas respostas serão removidos desta versão. Essa ação não pode ser
          desfeita.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (deleting) onDelete(deleting.id)
              setDeleting(null)
            }}
          >
            Excluir comentário
          </Button>
        </div>
      </Modal>
    </section>
  )
}
