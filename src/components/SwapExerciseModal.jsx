import { memo, useMemo, useState } from 'react'
import { getExerciseMeta, getExerciseThumb, getSubstitutes } from '../services/exercisesApi.js'
import { translateTerms } from '../lib/terms.js'
import { lastWeightForName } from '../data/plan.js'
import { displayWeight } from '../lib/weights.js'

// "95 lb × 8" a partir de una fila { weight_kg (lb), reps }.
function formatLog(log, unit) {
	if (!log || log.weight_kg == null) return null
	return `${displayWeight(log.weight_kg, unit)} ${unit} × ${log.reps ?? '—'}`
}

function OptionRow({ name, selected, onPick, log, unit, historyReady, badge }) {
	const meta = getExerciseMeta(name)
	const thumb = getExerciseThumb(name)
	const tags = meta ? translateTerms([meta.target, meta.equipment]).slice(0, 2) : []
	const last = formatLog(log, unit)
	return (
		<li>
			<button
				type="button"
				onClick={() => onPick(name)}
				aria-pressed={selected}
				className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${selected ? 'border-red-500/60 bg-red-500/10' : 'border-white/10 hover:border-white/25'}`}
			>
				{thumb ? (
					<img src={thumb} alt="" loading="lazy" decoding="async" draggable={false} className="h-11 w-11 shrink-0 rounded-lg border border-white/10 object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
				) : (
					<span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[10px] font-black text-zinc-500">TL</span>
				)}
				<span className="min-w-0 flex-1">
					<span className="block text-sm font-bold leading-snug text-white">{name}</span>
					{tags.length > 0 && <span className="mt-0.5 block text-[11px] text-zinc-500">{tags.join(' · ')}</span>}
					{badge && <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-red-400">{badge}</span>}
					{last ? (
						<span className="mt-1 inline-block rounded-md border border-green-500/35 bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
							Ya lo hiciste · {last}
						</span>
					) : historyReady ? (
						<span className="mt-1 block text-[10px] uppercase tracking-wider text-zinc-600">Nuevo · sin peso previo</span>
					) : null}
				</span>
				{selected && <span aria-hidden="true" className="shrink-0 font-black text-red-500">✓</span>}
			</button>
		</li>
	)
}

// Normaliza texto para búsqueda sin acentos ni mayúsculas.
function norm(str) {
	return String(str ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
}

// Modal para sustituir un ejercicio de la rutina por otro del catálogo.
// Arriba: volver al original del plan y los ejercicios que ya hiciste (con
// su último peso, que se recupera al elegirlos). Luego mismo músculo, misma
// zona y el catálogo completo con buscador. El cambio se guarda en la rutina.
const SwapExerciseModal = memo(function SwapExerciseModal({ theme = 'dark', currentName, reps, note, originalName = null, lastByName = null, weightUnit = 'lb', todaySeries = 0, onConfirm, onClose }) {
	const [showAll, setShowAll] = useState(false)
	const [catalogSearch, setCatalogSearch] = useState('')
	const [selected, setSelected] = useState(currentName)
	const historyReady = lastByName != null
	const logFor = (name) => lastWeightForName(name, lastByName)
	const { sameMuscle, sameZone, rest } = useMemo(() => getSubstitutes(currentName), [currentName])
	const allCatalog = useMemo(() => [...sameMuscle, ...sameZone, ...rest], [sameMuscle, sameZone, rest])
	const showOriginal = Boolean(originalName && originalName !== currentName && getExerciseMeta(originalName))
	// Ejercicios con historial (mismo músculo o zona), del más reciente al más viejo.
	const done = useMemo(() => {
		if (!lastByName) return []
		return [...sameMuscle, ...sameZone]
			.filter((n) => n !== originalName || !showOriginal)
			.map((n) => ({ n, log: lastWeightForName(n, lastByName) }))
			.filter((x) => x.log)
			.sort((a, b) => String(b.log.created_at ?? '').localeCompare(String(a.log.created_at ?? '')))
			.map((x) => x.n)
	}, [lastByName, sameMuscle, sameZone, originalName, showOriginal])
	// Sin duplicados: lo que ya sale arriba no se repite abajo.
	const shownAbove = useMemo(() => new Set([...done, ...(showOriginal ? [originalName] : [])]), [done, showOriginal, originalName])
	const muscleList = sameMuscle.filter((n) => !shownAbove.has(n))
	const zoneList = sameZone.filter((n) => !shownAbove.has(n))
	const filteredCatalog = useMemo(() => {
		const q = norm(catalogSearch)
		if (!q) return rest
		return allCatalog.filter((name) => {
			if (norm(name).includes(q)) return true
			const meta = getExerciseMeta(name)
			if (!meta) return false
			const tags = translateTerms([meta.target, meta.bodyPart, meta.equipment])
			return tags.some((t) => norm(t).includes(q))
		})
	}, [catalogSearch, rest, allCatalog])
	const currentMeta = useMemo(() => getExerciseMeta(currentName), [currentName])
	const currentTags = currentMeta ? translateTerms([currentMeta.target, currentMeta.bodyPart, currentMeta.equipment]) : []
	const currentThumb = getExerciseThumb(currentName)
	const currentLast = formatLog(logFor(currentName), weightUnit)
	const changed = selected !== currentName
	const selectedLast = changed ? formatLog(logFor(selected), weightUnit) : null
	const row = (n, badge) => (
		<OptionRow key={n} name={n} selected={selected === n} onPick={setSelected} log={logFor(n)} unit={weightUnit} historyReady={historyReady} badge={badge} />
	)

	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label={`Cambiar ${currentName}`}>
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h3 className="text-lg font-black text-white">Cambiar ejercicio</h3>
						<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{reps}{note ? ` · ${note}` : ''}</p>
					</div>
					<button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-white/25 hover:text-white">×</button>
				</div>

				<p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Ahora en tu rutina</p>
				<div className="glass-inset flex items-center gap-3 rounded-xl p-3">
					{currentThumb ? (
						<img src={currentThumb} alt="" loading="lazy" decoding="async" draggable={false} className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
					) : (
						<span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[10px] font-black text-zinc-500">TL</span>
					)}
					<span className="min-w-0">
						<span className="block text-sm font-bold leading-snug text-white">{currentName}</span>
						{currentTags.length > 0 && <span className="mt-0.5 block text-[11px] text-zinc-500">{currentTags.join(' · ')}</span>}
						{currentLast && <span className="mt-0.5 block text-[11px] font-bold text-zinc-300">Tu último: {currentLast}</span>}
					</span>
				</div>

				<p className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
					Tu peso se guarda <strong className="text-white">por ejercicio</strong>. Cambiar no borra nada: si eliges uno que ya hiciste recuperas su último peso, y si vuelves a este, también.
				</p>
				{todaySeries > 0 && (
					<p className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
						Hoy ya marcaste {todaySeries === 2 ? 'las 2 series' : '1 serie'} de este ejercicio. Al cambiarlo se quitan esas marcas de hoy (tu historial guardado no se toca).
					</p>
				)}

				{showOriginal && (
					<>
						<p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Volver al original del plan</p>
						<ul className="flex flex-col gap-2">{row(originalName)}</ul>
					</>
				)}
				{done.length > 0 && (
					<>
						<p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-green-400">Ya los hiciste · recuperas tu peso</p>
						<ul className="flex max-h-56 flex-col gap-2 overflow-y-auto overscroll-contain">{done.map((n) => row(n))}</ul>
					</>
				)}
				{muscleList.length > 0 && (
					<>
						<p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Mismo músculo · recomendado</p>
						<ul className="flex max-h-56 flex-col gap-2 overflow-y-auto overscroll-contain">{muscleList.map((n) => row(n))}</ul>
					</>
				)}
				{zoneList.length > 0 && (
					<>
						<p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Misma zona</p>
						<ul className="flex max-h-44 flex-col gap-2 overflow-y-auto overscroll-contain">{zoneList.map((n) => row(n))}</ul>
					</>
				)}
				<button
					type="button"
					onClick={() => {
						setShowAll((v) => {
							if (v) setCatalogSearch('')
							return !v
						})
					}}
					aria-expanded={showAll}
					className="mt-3 w-full rounded-xl border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25 hover:text-white"
				>
					{showAll ? 'Ocultar catálogo completo' : `Ver todo el catálogo (${rest.length})`}
				</button>
				{showAll && (
					<div className="mt-2 flex flex-col gap-2">
						<div className="relative flex items-center">
							<input
								type="search"
								value={catalogSearch}
								onChange={(e) => setCatalogSearch(e.target.value)}
								placeholder="Buscar ejercicio, músculo o equipo…"
								aria-label="Buscar ejercicio en el catálogo"
								autoComplete="off"
								className="glass-inset w-full rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none"
							/>
							{catalogSearch && (
								<button
									type="button"
									onClick={() => setCatalogSearch('')}
									aria-label="Limpiar búsqueda"
									className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition hover:text-white"
								>
									×
								</button>
							)}
						</div>
						{filteredCatalog.length > 0 ? (
							<ul className="flex max-h-56 flex-col gap-2 overflow-y-auto overscroll-contain">
								{filteredCatalog.map((n) => row(n))}
							</ul>
						) : (
							<p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-zinc-500">
								No se encontraron ejercicios para «{catalogSearch.trim()}»
							</p>
						)}
					</div>
				)}

				{changed && (
					<p className="mt-4 rounded-xl border border-white/10 px-3 py-2 text-[11px] leading-relaxed text-zinc-300" aria-live="polite">
						{selectedLast
							? <>Cambiarás a <strong className="text-white">{selected}</strong> y empiezas con tu último peso: <strong className="text-green-400">{selectedLast}</strong>.</>
							: historyReady
								? <>Cambiarás a <strong className="text-white">{selected}</strong>. Es nuevo para ti: empezarás sin peso previo.</>
								: <>Cambiarás a <strong className="text-white">{selected}</strong>.</>}
					</p>
				)}
				<div className="mt-4 flex gap-2">
					<button
						type="button"
						onClick={onClose}
						className="min-h-12 flex-1 rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!changed}
						onClick={() => onConfirm(selected)}
						className="min-h-12 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
					>
						{changed ? 'Cambiar' : 'Elige uno'}
					</button>
				</div>
			</div>
		</div>
	)
})

export default SwapExerciseModal
