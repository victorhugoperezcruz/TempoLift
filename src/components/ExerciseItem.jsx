import { memo, useMemo, useRef, useState } from 'react'
import { formatRest } from '../lib/format.js'
import { translateTerm, translateTerms } from '../lib/terms.js'
import { ATTRIBUTION, DATASET_REPO, getMediaCandidates, getRepoVideoUrl } from '../services/exercisesApi.js'

// lb (número, como se guarda) → texto en la unidad visible del usuario.
const LB_PER_KG = 2.20462

function formatLb(lb, unit) {
  const n = Number(lb)
  if (!Number.isFinite(n)) return '—'
  const v = unit === 'kg' ? n / LB_PER_KG : n
  return String(Math.round(v * 10) / 10)
}

function shortDate(iso) {
  const t = new Date(iso)
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString()
}

function useMediaRunner(candidates, posters) {
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  // Aplana una sola vez: gifs y luego posters como último recurso
  const sources = useMemo(() => [...candidates, ...posters], [candidates, posters])
  const src = sources[idx] ?? null
  const onError = () => {
    if (idx + 1 < sources.length) setIdx(idx + 1)
    else setFailed(true)
  }
  // Reset al cambiar de variante
  const key = sources[0] ?? 'none'
  return { src, failed, onError, resetKey: key }
}

function MainViewer({ entry, enlarged, onToggleSize }) {
  const media = useMemo(() => getMediaCandidates(entry), [entry])
  const { src, failed, onError, resetKey } = useMediaRunner(media.gifs, media.images)
  const [loaded, setLoaded] = useState(false)

  if (!entry.gif) {
    // Ejercicio de peso corporal sin GIF en el dataset: tarjeta instructiva
    return (
      <div className="gif-wrap hang-card">
        <p className="hang-title">Peso corporal · barra</p>
        <p className="hang-text">{entry.es}</p>
      </div>
    )
  }

  return (
    <div className={`gif-wrap ${enlarged ? 'enlarged' : ''}`}>
      {!loaded && !failed && <span className="spinner" aria-hidden="true" />}
      {!failed && src ? (
        <button
          key={resetKey}
          type="button"
          className="gif-btn"
          onClick={onToggleSize}
          aria-label={enlarged ? 'Reducir animación' : 'Ampliar animación'}
          title={enlarged ? 'Clic para reducir' : 'Clic para ampliar'}
        >
          <img
            src={src}
            alt={`Animación de ${entry.name}`}
            className="exercise-gif"
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={onError}
            onLoad={() => setLoaded(true)}
          />
        </button>
      ) : (
        <div className="gif-fallback">
          <p>Animación no disponible offline</p>
        </div>
      )}
      <span className="gif-badge">GIF · {entry.id}</span>
      <span className="gif-zoom-hint" aria-hidden="true">{enlarged ? 'Reducir' : 'Ampliar'}</span>
    </div>
  )
}

function VariantCarousel({ items, activeId, onSelect }) {
  const trackRef = useRef(null)

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  if (items.length <= 1) return null

  return (
    <div className="carousel">
      <div className="carousel-head">
        <p className="detail-alts-title">Variantes · misma zona ({translateTerm(items[0].bodyPart) ?? items[0].bodyPart})</p>
        <div className="carousel-nav">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Variantes anteriores" className="carousel-btn">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="carousel-icon">
              <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Variantes siguientes" className="carousel-btn">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="carousel-icon">
              <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={trackRef} className="carousel-track" role="listbox" aria-label="Variantes del ejercicio">
        {items.map((v) => {
          const thumb = v.image
            ? `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/${v.image}`
            : null
          const active = v.id === activeId
          return (
            <button
              key={v.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onSelect(v.id)}
              className={`variant-card ${active ? 'active' : ''}`}
              title={`${v.name} — ${translateTerm(v.equipment) ?? v.equipment}`}
            >
              {thumb ? (
                <img src={thumb} alt="" loading="lazy" decoding="async" draggable={false} className="variant-thumb" onError={(e) => {
                  const el = e.currentTarget
                  if (!el.dataset.fbk && v.image) {
                    el.dataset.fbk = '1'
                    el.src = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${v.image}`
                  } else {
                    el.style.display = 'none'
                  }
                }} />
              ) : (
                <span className="variant-thumb variant-thumb-icon" aria-hidden="true">TL</span>
              )}
              <span className="variant-name">{v.id === items[0].id ? `${v.name} · principal` : v.name}</span>
              <span className="variant-equip">{translateTerm(v.equipment) ?? v.equipment}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExerciseItem({ name, reps, note, index, checked, partial, blocked, restLeft = 0, lastWeight, lastReps, weightUnit = 'lb', history, onToggle, expanded, onExpand, bundle }) {
  const [activeId, setActiveId] = useState(null)
  const [enlarged, setEnlarged] = useState(false)
  const primary = bundle?.primary ?? null
  const active = bundle?.items.find((v) => v.id === (activeId ?? primary?.id)) ?? primary
  // Pasos de la variante ACTIVA (cambian con el carrusel); si la variante no
  // trae propios, se usan los de la principal. Sin párrafo de texto.
  const steps = (active?.steps?.length > 0 ? active.steps : primary?.steps) ?? []
  // Serie en curso (misma máquina de estados que la casilla: onToggle la avanza).
  const series = checked ? 2 : partial ? 1 : 0
  const resting = blocked && restLeft > 0

  return (
    <div className={`exercise-row ${checked ? 'is-checked' : ''} ${partial ? 'is-partial' : ''} ${expanded ? 'is-expanded' : ''}`}>
      <div className="exercise-main">
        {/* Checkmark 100% custom: sin input vanilla. Serie 1 = ámbar, serie 2 = verde */}
        <button
          type="button"
          role="checkbox"
          aria-checked={partial ? 'mixed' : checked}
          aria-label={checked ? `Desmarcar ${name}` : partial ? `Marcar serie 2 de ${name}` : `Marcar serie 1 de ${name}`}
          onClick={onToggle}
          className={`custom-check ${checked ? 'checked' : ''} ${partial ? 'partial' : ''}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="check-svg">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="check-ripple" aria-hidden="true" />
        </button>

        <button type="button" onClick={onExpand} className="exercise-text" aria-expanded={expanded}>
          <span className="exercise-title">
            <span className={`exercise-num ${checked ? 'done' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
            <span className={checked ? 'line-through-anim' : ''}>{name}</span>
          </span>
          <span className="exercise-note">{note}</span>
        </button>

        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-label={expanded ? `Ocultar animación de ${name}` : `Ver animación de ${name}`}
          className={`expand-btn ${expanded ? 'open' : ''}`}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="expand-icon">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="exercise-foot">
        {/* El objetivo del plan es estático: se muestra tu última marca y el
            plan queda como referencia en el tooltip. Sin historial, el plan. */}
        <span className="exercise-reps" title={lastWeight != null ? `Plan: ${reps}` : undefined}>
          {lastWeight != null ? `${lastWeight} ${weightUnit} × ${lastReps ?? '—'}` : reps}
        </span>
        {(checked || partial) && (
          <span className="foot-chip series-chip">{checked ? '2/2 ✓' : `1/2${blocked ? ' · descansa' : ''}`}</span>
        )}
        {/* Affordance explícito: la casilla sola no dejaba claro que son 2
            marcas. Mismo onToggle (misma máquina de estados y descanso). */}
        {series === 0 && (
          <button
            type="button"
            className="set-btn"
            disabled={blocked}
            onClick={onToggle}
            aria-label={`Marcar serie 1 de ${name}`}
            title="Anota el peso y las repeticiones de la serie 1"
          >
            Marcar serie 1
          </button>
        )}
        {series === 1 && (
          <button
            type="button"
            className="set-btn"
            disabled={blocked}
            onClick={onToggle}
            aria-label={resting ? `Serie 2 de ${name} disponible al terminar el descanso` : `Marcar serie 2 de ${name}`}
            title={resting ? 'Descansa antes de la serie 2' : 'Anota el peso y las repeticiones de la serie 2'}
          >
            {resting ? (
              <>Serie 2 · <span aria-hidden="true" className="tabular-nums">{formatRest(restLeft)}</span></>
            ) : (
              'Marcar serie 2'
            )}
          </button>
        )}
        {primary && (
          <>
            <span className="foot-chip">{translateTerm(primary.target) ?? primary.target}</span>
            <span className="foot-chip dim">{translateTerm(primary.equipment) ?? primary.equipment}</span>
          </>
        )}
      </div>

      {/* Solo se monta al expandir: menos DOM, menos GIFs, menos lag */}
      {expanded && (
        <div className="exercise-detail open">
          <div className="exercise-detail-inner">
            {primary && active ? (
              <>
                <MainViewer
                  entry={active}
                  enlarged={enlarged}
                  onToggleSize={() => setEnlarged((v) => !v)}
                />
                <div className="detail-tags">
                  {translateTerms([active.target, active.bodyPart, active.equipment]).map((t) => (
                    <span key={t} className="detail-chip">{t}</span>
                  ))}
                </div>
                {history && history.length > 0 && (
                  <div className="glass-inset rounded-xl p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Tu historial</p>
                    <ul className="mt-2 flex flex-col gap-1">
                      {history.map((h, i) => (
                        <li key={`${h.created_at}-${h.set_number}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-white">{formatLb(h.weight_kg, weightUnit)} {weightUnit} × {h.reps} reps</span>
                          <span className="shrink-0 text-zinc-500">{shortDate(h.created_at)}{h.set_number ? ` · S${h.set_number}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="detail-name">{active.name}</p>
                {bundle?.pair && active.id === primary.id && (
                  <p className="detail-pair">Biserie: alterna con <strong>{bundle.pair.name}</strong> ({translateTerm(bundle.pair.equipment) ?? bundle.pair.equipment})</p>
                )}
                {steps.length > 0 && (
                  <div>
                    <p className="detail-steps-title">Cómo hacerlo</p>
                    <ol className="detail-steps">
                      {steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {bundle?.items && (
                  <VariantCarousel items={bundle.items} activeId={active.id} onSelect={(id) => { setActiveId(id); setEnlarged(false) }} />
                )}
                <p className="detail-attrib">
                  <span>{ATTRIBUTION}</span>
                  <a href={getRepoVideoUrl(active)} target="_blank" rel="noreferrer">ver en el dataset ↗</a>
                </p>
              </>
            ) : (
              <div className="detail-error">
                <p>No se encontró animación para este ejercicio.</p>
                <p className="detail-hint">{note} · {reps}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ExerciseItem)
