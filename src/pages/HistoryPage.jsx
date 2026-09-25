import { parseSessionExtras } from '../lib/health.js'
import { displayWeight } from '../lib/weights.js'
import BackgroundOrbs from '../components/BackgroundOrbs.jsx'
import RestPill from '../components/RestPill.jsx'
import Snackbar from '../components/Snackbar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import UnitToggle from '../components/UnitToggle.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'
import { HistorySkeleton, SetsSkeleton } from '../components/Skeleton.jsx'

export default function HistoryPage({
	theme, showHistorySkel, sbLoading, historyHasData, sbSessions, sbRoutines,
	openSession, sessionSets, setsLoading, showSetsSkel,
	editingSet, setEditingSet, editWeight, setEditWeight, editReps, setEditReps,
	weightUnit, switchWeightUnit, startEditSet, saveEditSet, toggleSession, deleteSession,
	confirmDelete, setMsg, currentView, handleNav,
	isResting, restLabel, restLeft, returnToTraining,
	snack, closeSnack, onboarding,
}) {
	return (
		<>
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
			<BackgroundOrbs />
			<header className="relative z-10 flex items-center justify-between py-6">
				<div className="flex items-center gap-3">
					<div className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
					<span className="text-lg font-black tracking-tight">TempoLift</span>
				</div>
			</header>
			<div className="relative z-10">
				{showHistorySkel ? (
					<HistorySkeleton />
				) : (
				<section className="glass-card rounded-2xl p-5" aria-busy={sbLoading}>
					<h1 className="text-2xl font-black">Historial</h1>
					<p className="mt-1 text-sm text-zinc-400">{historyHasData ? `${sbSessions.filter((s) => s.ended_at).length} ${sbSessions.filter((s) => s.ended_at).length === 1 ? 'entrenamiento' : 'entrenamientos'}` : (sbLoading ? 'Cargando…' : '0 entrenamientos')}</p>
					<div className="mt-4 flex flex-col gap-2">
						{!historyHasData && !sbLoading && (
							<p className="text-sm text-zinc-500">Aún no tienes entrenamientos terminados. Completa tu primera rutina para verla aquí.</p>
						)}
						{sbSessions.filter((s) => s.ended_at).map((s) => {
							const routineName = sbRoutines.find((r) => r.id === s.routine_id)?.name
							const open = openSession === s.id
							const rows = sessionSets[s.id] ?? []
							const extras = parseSessionExtras(s.notes)
							const cardioInfo = extras.cardio
							const warmupInfo = extras.warmup
							return (
								<div key={s.id} className="glass-inset rounded-xl px-4 py-3">
									<button type="button" onClick={() => toggleSession(s)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
										<span>
											<span className="block text-sm font-bold text-white">{routineName ?? 'Entrenamiento'}</span>
											<span className="mt-1 block text-xs text-zinc-500">{new Date(s.started_at).toLocaleString()} · Terminada{warmupInfo ? (warmupInfo.machineKcal != null ? ` · Calent. ${warmupInfo.minutes} min (${warmupInfo.machineKcal} kcal máq.)` : ` · Calent. ${warmupInfo.minutes} min`) : ''}{cardioInfo ? (cardioInfo.machineKcal != null ? ` · Cardio ${cardioInfo.minutes} min (${cardioInfo.machineKcal} kcal máq.)` : ` · Cardio ${cardioInfo.minutes} min (~${Math.round(cardioInfo.kcal)} kcal)`) : ''}</span>
										</span>
										<span className="text-xl text-zinc-500">{open ? '▾' : '▸'}</span>
									</button>
									{open && (
										<div className="mt-3 border-t border-white/10 pt-3">
											{(s.id === openSession && showSetsSkel) ? (
												<SetsSkeleton />
											) : setsLoading && rows.length === 0 ? (
												<p className="text-sm text-zinc-500">Cargando series…</p>
											) : rows.length === 0 ? (
												<p className="text-sm text-zinc-500">Sin series registradas.</p>
											) : (
												<ul className="flex flex-col gap-2">
													{rows.map((row) => (
														<li key={row.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
															{editingSet === row.id ? (
																<div className="flex flex-col gap-2">
																	<p className="text-sm font-bold text-white">{row.exercises?.name ?? 'Ejercicio'} · Serie {row.set_number}</p>
																	<UnitToggle unit={weightUnit} onSwitch={switchWeightUnit} />
																	<div className="flex gap-2">
																		<input
																			type="number"
																			min="0"
																			step="0.5"
																			value={editWeight}
																			onChange={(e) => setEditWeight(e.target.value)}
																			placeholder={weightUnit === 'kg' ? 'kg' : 'lb'}
																			aria-label={`Peso en ${weightUnit === 'kg' ? 'kilogramos' : 'libras'}`}
																			className="glass-inset min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600"
																		/>
																		<input
																			type="number"
																			min="0"
																			step="1"
																			value={editReps}
																			onChange={(e) => setEditReps(e.target.value)}
																			placeholder="reps"
																			aria-label="Repeticiones"
																			className="glass-inset min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600"
																		/>
																	</div>
																	<div className="flex gap-2">
																		<button type="button" onClick={() => setEditingSet(null)} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300">
																			Cancelar
																		</button>
																		<button type="button" onClick={() => saveEditSet(row)} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">
																			Guardar
																		</button>
																	</div>
																</div>
															) : (
																<div className="flex items-center justify-between gap-2">
																	<p className="text-sm text-zinc-300">{row.exercises?.name ?? 'Ejercicio'} · S{row.set_number} — <strong className="text-white">{displayWeight(row.weight_kg, weightUnit)} {weightUnit} × {row.reps}</strong></p>
																	<button type="button" onClick={() => startEditSet(row)} className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25 hover:text-white">
																		Editar
																	</button>
																</div>
															)}
														</li>
													))}
												</ul>
											)}
											<button
												type="button"
												onClick={() => deleteSession(s)}
												className={`mt-3 w-full rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition ${confirmDelete === s.id ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300'}`}
											>
												{confirmDelete === s.id ? 'Toca de nuevo para eliminar' : 'Eliminar entrenamiento'}
											</button>
											{setMsg && (
												<p className="mt-2 text-xs text-zinc-400">{setMsg}</p>
											)}
										</div>
									)}
								</div>
							)
						})}
					</div>
				</section>
				)}
			</div>
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
