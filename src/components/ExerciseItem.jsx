import { memo, useMemo, useRef, useState } from 'react'
import { ATTRIBUTION, DATASET_REPO, getMediaCandidates, getRepoVideoUrl } from '../services/exercisesApi.js'

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
        <p className="detail-alts-title">Variantes · misma zona ({items[0].bodyPart})</p>
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
              title={`${v.name} — ${v.equipment}`}
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
              <span className="variant-equip">{v.equipment}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExerciseItem({ name, reps, note, index, checked, partial, blocked, lastWeight, weightUnit = 'lb', onToggle, expanded, onExpand, bundle }) {
  const [activeId, setActiveId] = useState(null)
  const [enlarged, setEnlarged] = useState(false)
  const primary = bundle?.primary ?? null
  const active = bundle?.items.find((v) => v.id === (activeId ?? primary?.id)) ?? primary
  const steps = primary?.steps ?? []

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
        <span className="exercise-reps">{reps}</span>
        {(checked || partial) && (
          <span className="foot-chip series-chip">{checked ? '2/2 ✓' : `1/2${blocked ? ' · descansa' : ''}`}</span>
        )}
        {!checked && !partial && lastWeight != null && (
          <span className="foot-chip dim">Últ: {lastWeight} {weightUnit}</span>
        )}
        {primary && (
          <>
            <span className="foot-chip">{primary.target}</span>
            <span className="foot-chip dim">{primary.equipment}</span>
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
                  {[active.target, active.bodyPart, active.equipment].filter(Boolean).map((t) => (
                    <span key={t} className="detail-chip">{t}</span>
                  ))}
                </div>
                <p className="detail-name">{active.name}</p>
                {bundle?.pair && active.id === primary.id && (
                  <p className="detail-pair">Biserie: alterna con <strong>{bundle.pair.name}</strong> ({bundle.pair.equipment})</p>
                )}
                {primary.es && <p className="detail-instructions">{primary.es}</p>}
                {steps.length > 0 && (
                  <ol className="detail-steps">
                    {steps.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
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
