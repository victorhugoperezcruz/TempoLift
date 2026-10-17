import { memo, useMemo } from 'react'
import { workoutDays, weekSchedule, SPLIT_TEMPLATES, findTemplateForMap } from '../data/plan.js'
import { getExerciseBundle, getExerciseThumb } from '../services/exercisesApi.js'
import { translateTerms } from '../lib/terms.js'
import CustomSelect from './CustomSelect.jsx'

const routineById = new Map(workoutDays.map((w) => [w.id, w]))

function DayPreview({ workoutId, dayLabel }) {
	const routine = routineById.get(workoutId)
	const firstName = routine?.exercises?.[0]?.[0] ?? null
	const bundle = firstName ? getExerciseBundle(firstName) : null
	const thumb = firstName ? getExerciseThumb(firstName) : null
	const tags = bundle?.primary ? translateTerms([bundle.primary.target, bundle.primary.equipment]).slice(0, 2) : []
	if (!routine) return null
	return (
		<span className="flex min-w-0 flex-col items-center gap-1 text-center">
			{thumb ? (
				<img
					src={thumb}
					alt=""
					loading="lazy"
					decoding="async"
					draggable={false}
					className="h-14 w-14 rounded-xl border border-white/10 object-cover"
					onError={(e) => { e.currentTarget.style.display = 'none' }}
				/>
			) : (
				<span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 text-xs font-black text-zinc-500">TL</span>
			)}
			<span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{dayLabel}</span>
			<span className="max-w-20 truncate text-[11px] font-bold text-white" title={routine.name}>{routine.name}</span>
			{tags.length > 0 && <span className="text-[10px] text-zinc-500">{tags.join(' · ')}</span>}
		</span>
	)
}

// Modal para personalizar la semana: elegir un split famoso (PPL,
// Upper/Lower, Arnold, Full-body…) con su explicación y preview animado
// por día, o asignar rutina a cada día a mano (Lun-Dom fijos).
const SplitPickerModal = memo(function SplitPickerModal({ theme = 'dark', weekMap, onApply, onSelectDay, onClose }) {
	const currentId = useMemo(() => findTemplateForMap(weekMap), [weekMap])
	const routineOptions = useMemo(
		() => workoutDays.map((w) => ({ value: String(w.id), label: `${w.name} · ${w.focus}` })),
		[],
	)
	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label="Personaliza tu semana">
			<div className="glass-card modal-card m-auto w-full max-w-lg rounded-2xl p-5">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="text-lg font-black text-white">Personaliza tu semana</h3>
						<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Elige un split famoso o arma la tuya día por día</p>
					</div>
					<button type="button" onClick={onClose} aria-label="Cerrar personalización" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-white/25 hover:text-white">×</button>
				</div>

				<div className="mt-4 flex flex-col gap-3">
					{SPLIT_TEMPLATES.map((t) => {
						const isCurrent = currentId === t.id
						return (
							<section key={t.id} className={`glass-inset rounded-2xl p-4 ${isCurrent ? 'border border-green-500/40' : ''}`} aria-label={`Split ${t.name}`}>
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="text-[10px] font-bold uppercase tracking-widest text-red-500">{t.tag} · {t.days} {t.days === 1 ? 'día' : 'días'}</p>
										<h4 className="mt-0.5 text-base font-black text-white">{t.name}</h4>
										<p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{t.level}</p>
									</div>
									<button
										type="button"
										disabled={isCurrent}
										onClick={() => onApply(t)}
										className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition ${isCurrent ? 'cursor-default border border-green-500/40 bg-green-500/10 text-green-300' : 'bg-red-500 text-white hover:brightness-110'}`}
									>
										{isCurrent ? 'En uso ✓' : 'Usar'}
									</button>
								</div>
								<p className="mt-2 text-xs leading-relaxed text-zinc-400">{t.description}</p>
								<div className="mt-3 flex flex-wrap gap-3">
									{t.map.map((slot, i) => (
										slot.rest ? null : <DayPreview key={`${t.id}-${i}`} workoutId={slot.workoutId} dayLabel={weekSchedule[i]?.day ?? ''} />
									))}
								</div>
								<p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
									{t.map.map((slot, i) => (slot.rest ? null : `${weekSchedule[i]?.fullDay ?? ''}: ${routineById.get(slot.workoutId)?.name ?? ''}`)).filter(Boolean).join(' · ')}
								</p>
							</section>
						)
					})}
				</div>

				<div className="mt-5 border-t border-white/10 pt-4">
					<h4 className="text-sm font-black text-white">O arma la tuya día por día</h4>
					<p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Los días quedan fijos (Lun-Dom). Cada rutina solo puede estar una vez por semana; si ya está en otro día, elige otra o pon descanso.</p>
					<div className="mt-3 flex flex-col gap-2">
						{weekSchedule.map((entry, idx) => {
							const slot = weekMap[idx] ?? { rest: true }
							return (
								<label key={entry.day} className="flex items-center gap-3">
									<span className="w-10 shrink-0 text-xs font-bold uppercase tracking-widest text-zinc-500">{entry.day}</span>
									<span className="min-w-0 flex-1">
										<CustomSelect
											value={slot.rest ? '' : String(slot.workoutId)}
											onChange={(v) => onSelectDay(idx, v === '' ? null : Number(v))}
											options={routineOptions}
											placeholder="Descanso"
											ariaLabel={`Rutina del ${entry.fullDay}`}
										/>
									</span>
								</label>
							)
						})}
					</div>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="mt-5 min-h-12 w-full rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25"
				>
					Listo
				</button>
			</div>
		</div>
	)
})

export default SplitPickerModal
