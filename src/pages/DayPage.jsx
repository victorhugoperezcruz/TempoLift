import { useEffect, useState } from 'react'
import { globalPhases, globalRules } from '../data/plan.js'
import { formatRest } from '../lib/format.js'
import { displayWeight } from '../lib/weights.js'
import { getExerciseBundle } from '../services/exercisesApi.js'
import BackgroundOrbs from '../components/BackgroundOrbs.jsx'
import Phase from '../components/Phase.jsx'
import ExerciseItem from '../components/ExerciseItem.jsx'
import CustomExerciseRow from '../components/CustomExerciseRow.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Snackbar from '../components/Snackbar.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'
import { WeightModal, CardioModal, WarmupModal } from '../components/WorkoutModals.jsx'
import { CustomExerciseModal } from '../components/CustomExerciseModal.jsx'
import { DaySkeleton } from '../components/Skeleton.jsx'

export default function DayPage({
	theme, goBack, trainingRows, selectedDay, trainingCount, selectedWorkout,
	doneCount, totalExercises, progress, allDone, missingLabels,
	dayTotalKcal, dayStrengthKcal, cardioDone, cardioMinutes, cardioMachineKcal, dayCardioKcal,
	warmupDone, warmupMinutes, warmupMachineKcal, dayWarmupKcal, dayVolumeKg,
	openCardio, unmarkCardio, openWarmup, unmarkWarmup,
	syncError, isResting, restLabel, restLeft, restSeries, skipRest,
	dayComplete, saveStatus, resetDay, showDaySkel, openPhase, togglePhase,
	seriesMap, planIds, lastW, recentW, weightUnit, weightModal, cardioModal, warmupModal,
	expandedKey, toggleExpand, handleToggleCheck, handleNav,
	weightMod, cardioMod, warmupMod, snack, closeSnack, onboarding,
	customs, customBlocked, onAddCustom, onLogCustom, onUnmarkCustom, onRemoveCustom, removeArmedCustomId,
	customCreateMod, customLogMod,
}) {
	// Resumen de fuerza para la cabecera del acordeón (visible colapsado).
	const strengthDone = Object.values(seriesMap ?? {}).filter((v) => v === 2).length
	const strengthTotal = selectedWorkout.exercises.length
	// Borde rojo solo al hacer scroll: la card es sticky y sin marcas se
	// pierde entre el contenido al deslizar. En reposo no resalta.
	const [stuck, setStuck] = useState(false)
	useEffect(() => {
		const onScroll = () => {
			const next = window.scrollY > 12
			setStuck((prev) => (prev === next ? prev : next))
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])
	return (
		<>
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`}>
			<BackgroundOrbs />
			<header className="relative z-10 flex items-center justify-start py-6">
				<button type="button" onClick={goBack} className="back-btn flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400" aria-label="Volver a los días">
					<span className="text-2xl leading-none text-red-500">‹</span> Días
				</button>
			</header>
			<div className="relative z-10 mb-6">
				<p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-red-500">Día {trainingRows.findIndex((r) => r.workoutId === selectedDay) + 1 || selectedWorkout.id} / {trainingCount}</p>
				<h1 className="text-4xl font-black tracking-tight">{selectedWorkout.name}</h1>
				<p className="mt-2 text-lg text-zinc-400">{selectedWorkout.focus}</p>
			</div>

			{/* Progreso fijo arriba al hacer scroll */}
			<div className={`glass-card sticky progress-pin top-2 z-20 mb-5 rounded-2xl p-4${stuck ? ' is-stuck' : ''}`}>
				<div className="mb-2 flex items-center justify-between text-sm">
					<span className="font-bold uppercase tracking-widest text-zinc-400">Progreso del día</span>
					<strong className="text-red-500">{doneCount}/{totalExercises}</strong>
				</div>
				<div className="progress-track" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={totalExercises} aria-label="Progreso del día">
					<div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
				</div>
				<p className="mt-2 text-xs text-zinc-500">
					{allDone ? '¡Día completado! Reiniciando…' : doneCount === 0 ? 'Marca fuerza (2 series por ejercicio), calentamiento y cardio final' : `${totalExercises - doneCount} por completar${missingLabels.length > 0 ? ` · falta: ${missingLabels.join(' + ')}` : ''}`}
				</p>
				<p className="mt-1 text-xs font-bold text-zinc-400" aria-live="polite">
					~{Math.round(dayTotalKcal)} kcal est. (fuerza ~{Math.round(dayStrengthKcal)}{cardioDone ? ` + cardio ~${Math.round(dayCardioKcal)}` : ''}{warmupDone ? ` + calent. ~${Math.round(dayWarmupKcal)}` : ''}) · {Math.round(dayVolumeKg)} kg movidos
				</p>
				{syncError && !allDone && (
					<p className="mt-2 text-xs text-amber-400">Aviso: {syncError}. El día no se guardará en tu historial.</p>
				)}
				{isResting && (
					<div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center" role="status" aria-live="assertive">
						<p className="text-xs font-bold uppercase tracking-widest text-red-400">Descanso{restLabel ? ` · ${restLabel}` : ''}</p>
						<p className="mt-1 text-3xl font-black tabular-nums text-white">{formatRest(restLeft)}</p>
						<div className="mt-2 flex items-center justify-center gap-2">
							<p className="text-xs text-zinc-400">{restSeries === 1 ? 'Descansa y toca la casilla otra vez para la serie 2' : 'Ejercicio completado · descansa antes del siguiente'}</p>
							<button type="button" onClick={skipRest} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300 transition hover:border-white/25">
								Omitir
							</button>
						</div>
					</div>
				)}
			</div>

			{dayComplete && (
				<div className="complete-banner glass-card relative z-10 mb-5" role="status">
					<span className="complete-pop" aria-hidden="true">
						<svg viewBox="0 0 24 24" className="complete-svg"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
					</span>
					<div>
						<strong>¡Día terminado!</strong>
						<p>{saveStatus.state === 'saved' ? `Guardado en tu historial ✓ · ~${Math.round(dayTotalKcal)} kcal` : saveStatus.state === 'saving' ? 'Guardando en tu historial…' : saveStatus.state === 'error' ? `No se pudo guardar: ${saveStatus.msg}` : 'Todos los checks se reiniciarán solos, sin recargar la página.'}</p>
					</div>
					<button type="button" className="complete-btn" onClick={() => resetDay(selectedWorkout.id)}>Reiniciar ahora</button>
				</div>
			)}

			{showDaySkel ? (
				<div className="relative z-10" aria-busy="true">
					<DaySkeleton rows={selectedWorkout.exercises.length} />
				</div>
			) : (
			<div className="routine-card glass-card relative z-10 rounded-2xl px-5">
				<Phase phase={globalPhases.warmup} open={openPhase === 'warmup'} onToggle={() => togglePhase('warmup')} status={warmupDone ? `${warmupMinutes} min` : null} statusDone={warmupDone}>
					<div className="glass-inset rounded-xl p-4 text-base text-zinc-300">{globalPhases.warmup.notes}</div>
					<div className={`exercise-row mt-2 ${warmupDone ? 'is-checked' : ''}`}>
						<div className="exercise-main">
							<button
								type="button"
								role="checkbox"
								aria-checked={warmupDone}
							aria-label={warmupDone ? 'Desmarcar calentamiento' : 'Marcar calentamiento y anotar minutos'}
							onClick={warmupDone ? unmarkWarmup : openWarmup}
							disabled={weightModal != null || cardioModal != null || warmupModal != null || customCreateMod != null || customLogMod != null}
								className={`custom-check ${warmupDone ? 'checked' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true" className="check-svg">
									<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								<span className="check-ripple" aria-hidden="true" />
							</button>
							<span className="exercise-text">
								<span className="exercise-title">
									<span className={warmupDone ? 'line-through-anim' : ''}>Calentamiento</span>
								</span>
								<span className="exercise-note">{warmupDone ? (warmupMachineKcal != null ? `${warmupMinutes} min · ${warmupMachineKcal} kcal máquina` : `${warmupMinutes} min · ~${Math.round(dayWarmupKcal)} kcal`) : 'Una sola marca · te pide los minutos'}</span>
							</span>
							<span className="exercise-reps">{warmupDone ? '✓' : '1×'}</span>
						</div>
					</div>
				</Phase>
				<Phase phase={{ title: 'Fuerza', label: 'Fase 2', detail: `${selectedWorkout.exercises.length} ejercicios · toca para ver animación` }} open={openPhase === 'strength'} onToggle={() => togglePhase('strength')} status={`${strengthDone}/${strengthTotal} completados`} statusDone={strengthTotal > 0 && strengthDone === strengthTotal}>
					<div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm glass-inset">
						<span className="text-zinc-300">Regla global</span>
						<strong className="text-red-500">{globalRules.tempo} · {globalRules.rest}</strong>
					</div>
					<div className={`exercise-list ${isResting ? 'opacity-80' : ''}`}>
						{selectedWorkout.exercises.map(([name, reps, note], index) => {
							const key = `${selectedWorkout.id}-${index}`
							const series = seriesMap[index] ?? 0
							const exerciseId = planIds?.byIndex?.[index]
							const prev = exerciseId ? lastW[exerciseId] : null
							return (
								<ExerciseItem
									key={key}
									name={name}
									reps={reps}
									note={note}
									index={index}
										checked={series === 2}
										partial={series === 1}
										blocked={isResting || weightModal != null || cardioModal != null || warmupModal != null || customCreateMod != null || customLogMod != null}
										restLeft={restLeft}
									lastWeight={prev?.weight_kg != null ? displayWeight(prev.weight_kg, weightUnit) : null}
									lastReps={prev?.reps ?? null}
									weightUnit={weightUnit}
									history={exerciseId ? (recentW[exerciseId] ?? null) : null}
									onToggle={() => handleToggleCheck(selectedWorkout.id, index, name, reps)}
									expanded={expandedKey === key}
									onExpand={() => toggleExpand(key)}
									bundle={getExerciseBundle(name)}
								/>
							)
						})}
						{customs.map((c) => (
							<CustomExerciseRow
								key={c.id}
								custom={c}
								unit={weightUnit}
								blocked={customBlocked}
								confirmRemove={removeArmedCustomId === c.id}
								onLog={() => onLogCustom(c.id)}
								onUnmark={() => onUnmarkCustom(c.id)}
								onRemove={() => onRemoveCustom(c.id)}
							/>
						))}
						<button
							type="button"
							onClick={onAddCustom}
							disabled={customBlocked}
							className="add-exercise"
							aria-label="Agregar ejercicio extra al día"
							title={customBlocked ? 'Termina el descanso para agregar' : 'Agrega un ejercicio fuera del plan'}
						>
							<span aria-hidden="true">+</span> Agregar ejercicio
						</button>
					</div>
				</Phase>
				<Phase phase={globalPhases.cardio} open={openPhase === 'cardio'} onToggle={() => togglePhase('cardio')} status={cardioDone ? `${cardioMinutes} min` : null} statusDone={cardioDone}>
					<div className="glass-inset rounded-xl p-4 text-base text-zinc-300">{globalPhases.cardio.notes}</div>
					<div className={`exercise-row mt-2 ${cardioDone ? 'is-checked' : ''}`}>
						<div className="exercise-main">
							<button
								type="button"
								role="checkbox"
								aria-checked={cardioDone}
							aria-label={cardioDone ? 'Desmarcar cardio' : 'Marcar cardio y anotar minutos'}
							onClick={cardioDone ? unmarkCardio : openCardio}
							disabled={weightModal != null || cardioModal != null || warmupModal != null || customCreateMod != null || customLogMod != null}
								className={`custom-check ${cardioDone ? 'checked' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true" className="check-svg">
									<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								<span className="check-ripple" aria-hidden="true" />
							</button>
							<span className="exercise-text">
								<span className="exercise-title">
									<span className={cardioDone ? 'line-through-anim' : ''}>Cardio final</span>
								</span>
								<span className="exercise-note">{cardioDone ? (cardioMachineKcal != null ? `${cardioMinutes} min · ${cardioMachineKcal} kcal máquina` : `${cardioMinutes} min · ~${Math.round(dayCardioKcal)} kcal`) : 'Una sola marca · te pide los minutos'}</span>
							</span>
							<span className="exercise-reps">{cardioDone ? '✓' : '1×'}</span>
						</div>
					</div>
				</Phase>
			</div>
			)}
			<p className="relative z-10 mt-6 text-center text-xs uppercase tracking-widest text-zinc-600">Escucha tu cuerpo · Mantén el control</p>
			</main>
			{weightModal && (
				<WeightModal
					theme={theme}
					modal={weightModal}
					planIds={planIds}
					lastW={lastW}
					unit={weightUnit}
					weightInput={weightMod.weightInput}
					setWeightInput={weightMod.setWeightInput}
					repsInput={weightMod.repsInput}
					setRepsInput={weightMod.setRepsInput}
					onSubmit={weightMod.onSubmit}
					onClose={weightMod.onClose}
					onSwitchUnit={weightMod.onSwitchUnit}
				/>
			)}
			{cardioModal && (
				<CardioModal
					theme={theme}
					cardioInput={cardioMod.cardioInput}
					setCardioInput={cardioMod.setCardioInput}
					cardioMachineInput={cardioMod.cardioMachineInput}
					setCardioMachineInput={cardioMod.setCardioMachineInput}
					bodyKg={cardioMod.bodyKg}
					onSubmit={cardioMod.onSubmit}
					onClose={cardioMod.onClose}
				/>
			)}
			{warmupModal && (
				<WarmupModal
					theme={theme}
					warmupInput={warmupMod.warmupInput}
					setWarmupInput={warmupMod.setWarmupInput}
					warmupMachineInput={warmupMod.warmupMachineInput}
					setWarmupMachineInput={warmupMod.setWarmupMachineInput}
					bodyKg={warmupMod.bodyKg}
					onSubmit={warmupMod.onSubmit}
					onClose={warmupMod.onClose}
				/>
			)}
			{customCreateMod && (
				<CustomExerciseModal
					mode="create"
					theme={theme}
					unit={customCreateMod.unit}
					onSwitchUnit={customCreateMod.onSwitchUnit}
					name={customCreateMod.name}
					setName={customCreateMod.setName}
					dbNames={customCreateMod.dbNames}
					dbLoading={customCreateMod.dbLoading}
					weight={customCreateMod.weight}
					setWeight={customCreateMod.setWeight}
					reps={customCreateMod.reps}
					setReps={customCreateMod.setReps}
					sets={customCreateMod.sets}
					setSets={customCreateMod.setSets}
					onSubmit={customCreateMod.onSubmit}
					onClose={customCreateMod.onClose}
				/>
			)}
			{customLogMod && (
				<CustomExerciseModal
					mode="log"
					theme={theme}
					unit={customLogMod.unit}
					onSwitchUnit={customLogMod.onSwitchUnit}
					name={customLogMod.name}
					setNumber={customLogMod.setNumber}
					targetSets={customLogMod.targetSets}
					lastSet={customLogMod.lastSet}
					weight={customLogMod.weight}
					setWeight={customLogMod.setWeight}
					reps={customLogMod.reps}
					setReps={customLogMod.setReps}
					onSubmit={customLogMod.onSubmit}
					onClose={customLogMod.onClose}
				/>
			)}
			<Snackbar snack={snack} onClose={closeSnack} theme={theme} />
			{/* En rutina del día ninguna pestaña va activa: el detalle no es
			Inicio/Historial/Perfil, así que value={null} deja el navbar sin
			marcar (sin aria-current). Al tocar una pestaña, handleNav cierra el día. */}
			<BottomNav value={null} onChange={handleNav} theme={theme} />
			{onboarding.show && (
				<OnboardingModal
					theme={theme}
					form={onboarding.form}
					setForm={onboarding.setForm}
					unit={onboarding.unit}
					onSwitchUnit={onboarding.onSwitchUnit}
					error={onboarding.error}
					saving={onboarding.saving}
					onSubmit={onboarding.onSubmit}
					onSkip={onboarding.onSkip}
				/>
			)}
		</>
	)
}
