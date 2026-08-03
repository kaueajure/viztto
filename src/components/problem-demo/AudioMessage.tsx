import { Mic, Play } from 'lucide-react'

const waveform = [8, 16, 11, 22, 15, 28, 12, 20, 9, 24, 14, 18, 7, 16, 10]

export function AudioMessage() {
  return (
    <article className="w-full max-w-[320px] rounded-lg border border-line bg-surface-elevated p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning text-brand-contrast">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <div aria-hidden="true" className="flex h-8 items-center gap-1">
            {waveform.map((height, index) => (
              <span key={index} className="w-1 rounded-full bg-secondary/70" style={{ height }} />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Mic className="h-3 w-3" /> Áudio
            </span>
            <span>1:48</span>
          </div>
        </div>
      </div>
    </article>
  )
}
