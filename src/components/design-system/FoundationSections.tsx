import { BrandSymbol, Logo } from '@/components/brand/Logo'
import { Card } from '@/components/ui/DataDisplay'
import { ShowcaseSection, Swatch } from './Showcase'

export function BrandFoundation() {
  return (
    <>
      <ShowcaseSection
        id="marca"
        index="01"
        title="Marca"
        note="Wordmark temporário e símbolo de colaboração convergente."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex min-h-44 items-center justify-center">
            <Logo />
          </Card>
          <Card className="flex min-h-44 items-center justify-center bg-ink">
            <BrandSymbol className="h-16 w-16" />
          </Card>
        </div>
      </ShowcaseSection>
      <ShowcaseSection
        id="cores"
        index="02"
        title="Paleta"
        note="Azul institucional, verde de aprovação e coral de revisão."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <Swatch name="Background" value="#F5F3ED" className="bg-background" />
          <Swatch name="Surface" value="#FFFFFF" className="bg-surface" />
          <Swatch name="Ink" value="#111318" className="bg-ink" />
          <Swatch name="Viztto blue" value="#3854F6" className="bg-brand" />
          <Swatch name="Brand soft" value="#E7EBFF" className="bg-brand-soft" />
          <Swatch name="Approval" value="#B7ED52" className="bg-approval" />
          <Swatch name="Approval soft" value="#EFFBD6" className="bg-approval-soft" />
          <Swatch name="Revision" value="#FF6955" className="bg-revision" />
          <Swatch name="Warning" value="#F5BA3D" className="bg-warning" />
          <Swatch name="Border" value="#D9D7D0" className="bg-line" />
        </div>
      </ShowcaseSection>
      <ShowcaseSection
        id="tipo"
        index="03"
        title="Tipografia"
        note="Instrument Sans conduz a interface; Instrument Serif adiciona voz editorial."
      >
        <div className="grid gap-8">
          <div>
            <p className="eyebrow mb-3">Display · Instrument Sans</p>
            <p className="display">
              Revisão
              <br />
              sem ruído.
            </p>
          </div>
          <div className="border-t border-line pt-7">
            <p className="font-serif text-5xl leading-none sm:text-7xl">
              Ideias ficam <em>melhores</em>
              <br />
              quando vistas juntas.
            </p>
          </div>
          <div className="grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
            <div>
              <p className="heading-lg">Título de seção</p>
              <p className="mt-3 text-secondary">Hierarquia forte e quebra intencional.</p>
            </div>
            <div className="space-y-3">
              <p className="body-lg">
                Texto de destaque para introduções importantes e explicações de produto.
              </p>
              <p className="text-base text-secondary">
                Corpo de texto para descrever fluxos, decisões e contextos.
              </p>
              <p className="text-xs text-muted">Legenda · versão publicada hoje às 10:08</p>
            </div>
          </div>
        </div>
      </ShowcaseSection>
      <ShowcaseSection id="fundacao" index="04" title="Espaço, borda e sombra">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="rounded-sm">
            <p className="eyebrow">Raio sm · 8</p>
            <div className="mt-6 h-16 rounded-sm bg-brand-soft" />
          </Card>
          <Card className="rounded-lg">
            <p className="eyebrow">Raio lg · 18</p>
            <div className="mt-6 h-16 rounded-lg bg-approval-soft" />
          </Card>
          <Card className="rounded-xl shadow-raised">
            <p className="eyebrow">Raio xl · 26</p>
            <div className="mt-6 h-16 rounded-xl bg-revision-soft" />
          </Card>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3 rounded-lg border border-line bg-surface p-5 sm:grid-cols-8">
          {[1, 2, 3, 4, 6, 8, 12, 16].map((n) => (
            <div key={n}>
              <div className="bg-brand" style={{ height: `${n * 4}px` }} />
              <p className="mt-2 text-[10px] text-muted">{n * 4}px</p>
            </div>
          ))}
        </div>
      </ShowcaseSection>
    </>
  )
}
