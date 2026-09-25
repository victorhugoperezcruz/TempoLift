import { memo } from 'react'
import { FINE_POINTER } from '../lib/format.js'
import UnitToggle from './UnitToggle.jsx'
import SearchCombobox from './SearchCombobox.jsx'

// Modal de ejercicio extra: modo `create` (nombre + peso + reps + series, la
// primera serie queda anotada) y modo `log` (solo peso + reps de la serie N).
// Los extras suman kcal e historial pero NO cambian el completado del día.
export const CustomExerciseModal = memo(function CustomExerciseModal({
	mode, theme = 'dark', unit, onSwitchUnit,
	name, setName, dbNames, dbLoading,
	weight, setWeight, reps, setReps, sets, setSets,
	setNumber, targetSets, lastSet,
	onSubmit, onClose,
}) {
	const isCreate = mode === 'create'
	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label={isCreate ? 'Agregar ejercicio extra' : `Anotar serie ${setNumber}`}>
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<h3 className="text-lg font-black text-white">
					{isCreate ? 'Agregar ejercicio' : `${name} · Serie ${setNumber}/${targetSets}`}
				</h3>
				<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
					{isCreate
						? 'Extra del día · no cambia el completado de la rutina'
						: (lastSet ? `Anterior: ${lastSet.weight} ${unit} × ${lastSet.reps} reps` : 'Extra del día')}
				</p>
				<form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3">
					<UnitToggle unit={unit} onSwitch={onSwitchUnit} />
					{isCreate && (
						<>
							<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
								Ejercicio
								<SearchCombobox
									value={name}
									onChange={setName}
									options={dbNames}
									loading={dbLoading}
									placeholder="Buscar o escribir ejercicio…"
									ariaLabel="Buscar o escribir ejercicio extra"
								/>
							</label>
							<div className="flex items-center justify-between gap-3">
								<span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Series</span>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setSets(Math.max(1, (parseInt(sets, 10) || 2) - 1))}
										disabled={(parseInt(sets, 10) || 2) <= 1}
										aria-label="Menos series"
										className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
									>
										−
									</button>
									<strong className="w-8 text-center text-xl font-black tabular-nums text-white" aria-live="polite">{sets}</strong>
									<button
										type="button"
										onClick={() => setSets(Math.min(4, (parseInt(sets, 10) || 2) + 1))}
										disabled={(parseInt(sets, 10) || 2) >= 4}
										aria-label="Más series"
										className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
									>
										+
									</button>
								</div>
							</div>
						</>
					)}
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Peso ({unit})
						<input
							type="number"
							min="0"
							step="0.5"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
							placeholder={unit === 'kg' ? 'ej. 60' : 'ej. 135'}
							autoFocus={FINE_POINTER}
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Repeticiones
						<input
							type="number"
							min="0"
							step="1"
							value={reps}
							onChange={(e) => setReps(e.target.value)}
							placeholder="ej. 10"
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="min-h-12 flex-1 rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25"
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="min-h-12 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition"
						>
							{isCreate ? 'Agregar' : 'Confirmar'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
})
