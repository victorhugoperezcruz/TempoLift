import { workoutDays, sameSlot } from '../data/plan.js'
import BackgroundOrbs from '../components/BackgroundOrbs.jsx'
import RestPill from '../components/RestPill.jsx'
import Snackbar from '../components/Snackbar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import MoveButtons from '../components/MoveButtons.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'

export default function HomePage({
	theme, editingWeek, setEditingWeek, resetWeekOrder, trainingCount,
	dayRows, weekMap, moveWeekDay, seriesByDay, cardioByDay, warmupByDay,
	doneIds, resetWeekdayLabel, tryOpenDay,
	currentView, handleNav, isResting, restLabel, restLeft, returnToTraining,
	snack, closeSnack, onboarding,
}) {
	return (
		<>
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`}>
			<BackgroundOrbs />
			<header className="relative z-10 flex items-center justify-between py-6">
				<div className="flex items-center gap-3">
					<div className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
					<span className="text-lg font-black tracking-tight">TempoLift</span>
				</div>
			</header>
			<section className="relative z-10 pb-8 pt-8">
				<p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-red-500">Tu plan de hoy</p>
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
					<div>
						<h1 className="hero-title max-w-xs text-5xl font-black leading-[0.95] tracking-tight">Tu semana.</h1>
						<p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">Visualiza tu entrenamiento y llega preparado a cada sesión.</p>
					</div>
					<button
						type="button"
						onClick={() => setEditingWeek((v) => !v)}
						aria-pressed={editingWeek}
						className={`w-fit self-start rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${editingWeek ? 'border-red-500/60 bg-red-500 text-white' : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-white'}`}
					>
						{editingWeek ? 'Listo' : 'Editar'}
					</button>
				</div>
			</section>
			<section className="view-switch glass-card relative z-10 overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
				<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Calendario semanal</p>
						<h2 className="mt-1 text-xl font-black text-white">Lunes a domingo</h2>
					</div>
					{editingWeek ? (
						<button type="button" onClick={resetWeekOrder} className="text-xs font-bold uppercase tracking-widest text-zinc-500 transition hover:text-red-400">
							Restablecer
						</button>
					) : (
						<span className="text-xs font-bold uppercase tracking-widest text-red-500">{trainingCount} {trainingCount === 1 ? 'sesión' : 'sesiones'}</span>
					)}
				</div>
				{editingWeek && (
					<p className="border-b border-white/10 px-5 py-2 text-xs leading-relaxed text-zinc-500">Mueve cada rutina a otro día con las flechas. Los días quedan fijos (Lun-Dom), nada se abre mientras editas y el orden se guarda solo para tu usuario.</p>
				)}
				<div className="day-list">
					{dayRows.map((entry, idx) => {
						const day = workoutDays.find((workout) => workout.id === entry.workoutId)
						// Nombre del contenido para las etiquetas ("Mover X al Jueves").
						// Si el vecino tiene lo mismo (dos descansos), la flecha se apaga.
						const contentName = entry.rest ? 'Descanso' : (day?.name ?? 'Rutina')
						const upName = idx > 0 ? dayRows[idx - 1].fullDay : ''
						const downName = idx < dayRows.length - 1 ? dayRows[idx + 1].fullDay : ''
						const moveBox = editingWeek && (
							<MoveButtons
								upLabel={`Mover ${contentName} al ${upName}`}
								downLabel={`Mover ${contentName} al ${downName}`}
								canUp={idx > 0 && !sameSlot(weekMap[idx], weekMap[idx - 1])}
								canDown={idx < dayRows.length - 1 && !sameSlot(weekMap[idx], weekMap[idx + 1])}
								onMove={(dir) => moveWeekDay(idx, dir)}
							/>
						)
						if (entry.rest) {
							return (
								<div key={entry.day} style={{ '--d': `${idx * 45}ms` }} className="day-row is-rest flex min-h-24 items-center justify-between gap-2 px-5 py-4">
									<span className="flex items-center gap-4">
										<span className="w-10 text-xs font-bold uppercase tracking-widest text-zinc-500">{entry.day}</span>
										<span>
											<strong className="block text-lg font-black text-white">Descanso</strong>
											<span className="mt-1 block text-sm text-zinc-500">Recuperación y movilidad</span>
										</span>
									</span>
									{moveBox || <span className="text-sm text-zinc-600">—</span>}
								</div>
							)
						}
						const done = Object.values(seriesByDay[day.id] ?? {}).filter((v) => v === 2).length + (cardioByDay[day.id] ? 1 : 0) + (warmupByDay[day.id] ? 1 : 0)
						const total = day.exercises.length + 2
						// Completada esta semana de entreno: bloqueada hasta el reinicio.
						const isDoneWeek = doneIds.has(day.id)
						const pct = isDoneWeek ? 100 : (total ? Math.round((done / total) * 100) : 0)
						if (editingWeek) {
							return (
								<div key={entry.day} style={{ '--d': `${idx * 45}ms` }} className="day-row flex min-h-24 w-full flex-col justify-center gap-2 px-5 py-4 text-left">
									<span className="flex items-center justify-between gap-2">
										<span className="flex items-center gap-4">
											<span className={`day-badge flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
											<span>
												<strong className="block text-lg font-black text-white">{day.name}</strong>
												<span className="mt-1 block text-sm text-zinc-500">{day.focus} · {done}/{total} ✓</span>
											</span>
										</span>
										{moveBox}
									</span>
									<span className={`day-progress ${done === total ? 'done' : ''}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={`Progreso de ${day.name}`}>
										<span style={{ width: `${pct}%` }} />
									</span>
								</div>
							)
						}
						return (
							<button key={entry.day} type="button" onClick={() => tryOpenDay(day.id)} style={{ '--d': `${idx * 45}ms` }} className={`day-row group flex min-h-24 w-full flex-col justify-center gap-2 px-5 py-4 text-left${isDoneWeek ? ' is-done' : ''}`} aria-label={isDoneWeek ? `${day.name} completada esta semana` : day.name}>
								<span className="flex items-center justify-between gap-2">
									<span className="flex items-center gap-4">
										<span className={`day-badge flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
										<span>
											<strong className="block text-lg font-black text-white">{day.name}</strong>
											<span className="mt-1 block text-sm text-zinc-500">{isDoneWeek ? `Completado ✓ · Se desbloquea el ${resetWeekdayLabel}` : `${day.focus} · ${done}/${total} ✓`}</span>
										</span>
									</span>
									{isDoneWeek
										? <span className="text-2xl text-green-500" aria-hidden="true">✓</span>
										: <span className="text-2xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-red-500">→</span>}
								</span>
								<span className={`day-progress ${isDoneWeek || done === total ? 'done' : ''}`} role="progressbar" aria-valuenow={isDoneWeek ? total : done} aria-valuemin={0} aria-valuemax={total} aria-label={`Progreso de ${day.name}`}>
									<span style={{ width: `${pct}%` }} />
								</span>
							</button>
						)
						})}
					</div>
			</section>
			<footer className="relative z-10 mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-widest text-zinc-600">
				<span>Plan de {trainingCount} {trainingCount === 1 ? 'día' : 'días'}</span>
				<span>Fuerza + cardio</span>
			</footer>
			</main>
			{isResting && (
				<RestPill label={restLabel} seconds={restLeft} onReturn={returnToTraining} theme={theme} />
			)}
			<Snackbar snack={snack} onClose={closeSnack} theme={theme} />
			<BottomNav value={currentView} onChange={handleNav} theme={theme} />
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
