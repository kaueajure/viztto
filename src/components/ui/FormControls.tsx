import { ChevronDown } from 'lucide-react'
import {
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

function FieldWrap({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string
  hint?: string
  error?: string
  id: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {(hint || error) && (
        <span className={cn('text-xs font-normal', error ? 'text-revision' : 'text-muted')}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <FieldWrap label={label} hint={hint} error={error} id={fieldId}>
      <input
        id={fieldId}
        className={cn(
          'min-h-11 rounded-md border bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-muted hover:border-line-strong focus:border-brand disabled:border-line-subtle disabled:bg-surface-secondary disabled:text-disabled',
          error ? 'border-revision' : 'border-line',
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
    </FieldWrap>
  )
}
export function Textarea({
  label,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <FieldWrap label={label} id={fieldId}>
      <textarea
        id={fieldId}
        className={cn(
          'min-h-28 resize-y rounded-md border border-line bg-surface p-3.5 text-sm text-ink outline-none transition placeholder:text-muted hover:border-line-strong focus:border-brand disabled:bg-surface-secondary disabled:text-disabled',
          className,
        )}
        {...props}
      />
    </FieldWrap>
  )
}
export function Select({
  label,
  children,
  className,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <FieldWrap label={label} id={fieldId}>
      <span className="relative">
        <select
          id={fieldId}
          className={cn(
            'min-h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 pr-10 text-sm text-ink outline-none transition hover:border-line-strong focus:border-brand disabled:bg-surface-secondary disabled:text-disabled',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
        />
      </span>
    </FieldWrap>
  )
}

type ChoiceProps = { label: string; checked?: boolean; onChange?: (value: boolean) => void }
export function Checkbox({ label, checked = false, onChange }: ChoiceProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 accent-brand"
      />
      <span>{label}</span>
    </label>
  )
}
export function Radio({ label, checked = false, onChange }: ChoiceProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="radio"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 accent-brand"
      />
      <span>{label}</span>
    </label>
  )
}
export function Switch({ label, checked = false, onChange }: ChoiceProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-4 w-4 rounded-full bg-surface transition-transform',
            checked ? 'translate-x-1' : '-translate-x-4',
          )}
        />
      </button>
      <span>{label}</span>
    </label>
  )
}
