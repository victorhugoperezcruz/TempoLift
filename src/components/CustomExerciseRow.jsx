import { memo } from 'react'
import { displayWeight } from '../lib/weights.js'

// Fila de ejercicio extra del día: no abre acordeón ni cuenta para el
// completado de la rutina (cierra con cardio). `blocked` la atenúa en descanso.
const CustomExerciseRow = memo(function CustomExerciseRow({ custom, unit, blocked, confirmRemove, onLog, onUnmark, onRemove }) {
	const done = custom.sets.length
	const complete = done >= custom.targetSets
	const last = custom.sets[custom.sets.length - 1] ?? null
	return (
		<div className={`exercise-row mt-2 ${complete ? 'is-checked' : done > 0 ? 'is-partial' : ''}`}>
			<div className="exercise-main">
				<button
					type="button"
					role="checkbox"
					aria-checked={complete}
					aria-label={complete ? `Desmarcar ${custom.name}` : `Marcar serie ${done + 1} de ${custom.name}`}
					onClick={complete ? onUnmark : onLog}
					disabled={blocked}
					className={`custom-check ${complete ? 'checked' : ''} ${!complete && done > 0 ? 'partial' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true" className="check-svg">
						<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className="check-ripple" aria-hidden="true" />
				</button>
				<span className="exercise-text">
					<span className="exercise-title">
						<span className={complete ? 'line-through-anim' : ''}>{custom.name}</span>
					</span>
					<span className="exercise-note">Extra · {done}/{custom.targetSets} series · no cuenta para el completado</span>
				</span>
				<span className="exercise-reps">{last ? `${displayWeight(last.weight, unit)} ${unit} × ${last.reps}` : `${custom.targetSets}×`}</span>
				<button
					type="button"
					onClick={onRemove}
					aria-label={confirmRemove ? `Toca de nuevo para quitar ${custom.name}` : `Quitar ${custom.name}`}
					title={confirmRemove ? 'Toca de nuevo para quitar' : 'Quitar ejercicio extra'}
					className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm transition ${confirmRemove ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300'}`}
				>
					×
				</button>
			</div>
			{!complete && (
				<div className="mt-2 flex">
					<button
						type="button"
						className="set-btn"
						disabled={blocked}
						onClick={onLog}
						aria-label={`Marcar serie ${done + 1} de ${custom.name}`}
					>
						Marcar serie {done + 1}
					</button>
				</div>
			)}
		</div>
	)
})

export default CustomExerciseRow
