import { memo } from 'react'
import { FINE_POINTER } from '../lib/format.js'
import { displayWeight } from '../lib/weights.js'
import { weightHintFor } from '../data/plan.js'
import { cardioKcalFor, warmupKcalFor } from '../lib/health.js'
import UnitToggle from './UnitToggle.jsx'

// Modal para anotar peso y reps de una serie (Serie 1/2).
export const WeightModal = memo(function WeightModal({
	modal, planIds, lastW, unit,
	weightInput, setWeightInput, repsInput, setRepsInput,
	onSubmit, onClose, onSwitchUnit, theme = 'dark',
}) {
	if (!modal) return null
	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label={`Anotar serie ${modal.setNumber}`}>
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<h3 className="text-lg font-black text-white">{modal.name} · Serie {modal.setNumber}/2</h3>
				<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
					{(() => {
						const exId = planIds?.byIndex?.[modal.index]
						const prev = exId ? lastW[exId] : null
						if (prev?.weight_kg == null) return 'Sin registros previos · marca tu base'
						return `Último: ${displayWeight(prev.weight_kg, unit)} ${unit} × ${prev.reps ?? '—'} reps`
					})()}
				</p>
				<form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3">
					<UnitToggle unit={unit} onSwitch={onSwitchUnit} />
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Peso ({unit})
						<input
							type="number"
							min="0"
							step="0.5"
							value={weightInput}
							onChange={(e) => setWeightInput(e.target.value)}
							placeholder={`ej. ${weightHintFor(modal.name, unit)}`}
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
							value={repsInput}
							onChange={(e) => setRepsInput(e.target.value)}
							placeholder="ej. 8"
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
							Confirmar
						</button>
					</div>
				</form>
			</div>
		</div>
	)
})

// Modal de cardio final (Fase 3): minutos + kcal opcionales de la máquina.
export const CardioModal = memo(function CardioModal({
	cardioInput, setCardioInput, cardioMachineInput, setCardioMachineInput,
	bodyKg, onSubmit, onClose, theme = 'dark',
}) {
	const machinePreview = parseFloat(cardioMachineInput)
	const hasMachine = Number.isFinite(machinePreview) && machinePreview >= 0
	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label="Anotar cardio">
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<h3 className="text-lg font-black text-white">Cardio final · 1 marca</h3>
				<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Caminadora 4-5 km/h · inclinación 10-12</p>
				<div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3" role="note">
					<p className="text-xs font-bold uppercase tracking-widest text-amber-300">Revisa la máquina</p>
					<p className="mt-1 text-xs leading-relaxed text-zinc-300">Fíjate en la pantalla de la caminadora e introduce las calorías que muestra. Si lo dejas vacío, las estimamos con el peso de tu perfil ({bodyKg} kg).</p>
				</div>
				<form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3">
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Tiempo (min)
						<input
							type="number"
							min="1"
							max="180"
							step="1"
							value={cardioInput}
							onChange={(e) => setCardioInput(e.target.value)}
							placeholder="ej. 25"
							autoFocus={FINE_POINTER}
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Calorías de la máquina (opcional)
						<input
							type="number"
							min="0"
							max="5000"
							step="1"
							value={cardioMachineInput}
							onChange={(e) => setCardioMachineInput(e.target.value)}
							placeholder="ej. 180"
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<p className="text-sm text-zinc-400" aria-live="polite">
						{hasMachine ? `Usaremos ${Math.round(machinePreview)} kcal de la máquina` : `≈ ${Math.round(cardioKcalFor(cardioInput || 0, bodyKg))} kcal estimadas con ${bodyKg} kg`}
					</p>
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
							Confirmar
						</button>
					</div>
				</form>
			</div>
		</div>
	)
})

// Modal de calentamiento (Fase 1): minutos + kcal opcionales de la máquina.
export const WarmupModal = memo(function WarmupModal({
	warmupInput, setWarmupInput, warmupMachineInput, setWarmupMachineInput,
	bodyKg, onSubmit, onClose, theme = 'dark',
}) {
	const machinePreview = parseFloat(warmupMachineInput)
	const hasMachine = Number.isFinite(machinePreview) && machinePreview >= 0
	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label="Anotar calentamiento">
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<h3 className="text-lg font-black text-white">Calentamiento · 1 marca</h3>
				<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Caminadora 5 km/h · inclinación 0</p>
				<div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3" role="note">
					<p className="text-xs font-bold uppercase tracking-widest text-amber-300">Revisa la máquina</p>
					<p className="mt-1 text-xs leading-relaxed text-zinc-300">Fíjate en la pantalla de la caminadora e introduce las calorías que muestra. Si lo dejas vacío, las estimamos con el peso de tu perfil ({bodyKg} kg).</p>
				</div>
				<form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-3">
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Tiempo (min)
						<input
							type="number"
							min="1"
							max="60"
							step="1"
							value={warmupInput}
							onChange={(e) => setWarmupInput(e.target.value)}
							placeholder="ej. 7"
							autoFocus={FINE_POINTER}
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Calorías de la máquina (opcional)
						<input
							type="number"
							min="0"
							max="5000"
							step="1"
							value={warmupMachineInput}
							onChange={(e) => setWarmupMachineInput(e.target.value)}
							placeholder="ej. 60"
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<p className="text-sm text-zinc-400" aria-live="polite">
						{hasMachine ? `Usaremos ${Math.round(machinePreview)} kcal de la máquina` : `≈ ${Math.round(warmupKcalFor(warmupInput, bodyKg))} kcal estimadas con ${bodyKg} kg`}
					</p>
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
							Confirmar
						</button>
					</div>
				</form>
			</div>
		</div>
	)
})
