import { sessionsByWeek, dayStreak, VOLUME_CHARTS } from '../lib/health.js'
import { displayWeight } from '../lib/weights.js'
import { weekGoalTip } from '../data/plan.js'
import BackgroundOrbs from '../components/BackgroundOrbs.jsx'
import RestPill from '../components/RestPill.jsx'
import Snackbar from '../components/Snackbar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import UnitToggle from '../components/UnitToggle.jsx'
import CustomSelect from '../components/CustomSelect.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'
import { ProfileSkeleton } from '../components/Skeleton.jsx'
import { CalorieBars, WeekBars, TrendLine } from '../components/Charts.jsx'

export default function ProfilePage({
	theme, showProfileSkel, sbLoading, statsLoading, sbSessions, statsRows, statsError,
	enabledVolumeCharts = [], toggleVolumeChart, setAllVolumeCharts,
	exerciseRecords, showAllRecords, setShowAllRecords, session,
	weightUnit, switchWeightUnit, weekGoal, changeWeekGoal,
	profile, bodyKg, profileForm, setProfileForm, profileMsg, profileSaving, saveProfileForm,
	toggleTheme, dataMsg, confirmWipe, wipeHistory, signOut,
	currentView, handleNav, isResting, restLabel, restLeft, returnToTraining,
	snack, closeSnack, onboarding,
}) {
	// Carga inicial con latencia: skeleton estilo imagen.
	// En refetch con datos ya visibles no se usa (stale-while-revalidate).
	// Va dentro del <main> con el tema para que en modo claro el esqueleto
	// sea gris (.theme-light .skel) y no oscuro.
	if (showProfileSkel) {
		return (
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`}>
				<BackgroundOrbs />
				<div className="relative z-10 pt-6">
					<ProfileSkeleton />
				</div>
			</main>
		)
	}
	const finished = sbSessions.filter((s) => s.ended_at)
	const last = finished[0]
	const email = session.user?.email ?? ''
	const initial = (email.charAt(0) || 'T').toUpperCase()
	// statsRows viene en orden reciente → antiguo: se invierte para graficar cronológico
	const chronoRows = [...statsRows].reverse()
	const chartData = chronoRows.slice(-10)
	// Resúmenes en lenguaje simple para acompañar cada gráfica
	const kcalAvg = chartData.length > 0 ? chartData.reduce((a, r) => a + r.totalKcal, 0) / chartData.length : 0
	const kcalBest = chartData.length > 0 ? chartData.reduce((a, b) => (b.totalKcal > a.totalKcal ? b : a)) : null
	const weekData = sessionsByWeek(finished.map((s) => s.started_at), 8)
	const thisWeek = weekData.length > 0 ? weekData[weekData.length - 1].value : 0
	// Series por cada gráfica de volumen (por parte del cuerpo + total general).
	// Cada gráfica de parte del cuerpo filtra solo las sesiones donde se trabajó
	// esa zona, evitando picos irreales al alternar días de pierna con brazo.
	const volumeSeriesByChart = Object.fromEntries(
		VOLUME_CHARTS.map((c) => {
			if (c.id === 'total') {
				const withVol = chronoRows.filter((r) => r.volumeKg > 0)
				const source = (withVol.length > 0 ? withVol : chronoRows).slice(-10)
				return [
					c.id,
					source.map((r) => ({
						id: `${r.id}-total`,
						label: `${r.name} · ${r.label}`,
						short: r.short,
						value: r.volumeKg,
						bodyPart: r.bodyPartsLabel || r.name,
						breakdown: r.breakdownLabel || '',
					})),
				]
			}
			const source = chronoRows.filter((r) => (r.volumeByPart?.[c.id] ?? 0) > 0).slice(-10)
			return [
				c.id,
				source.map((r) => ({
					id: `${r.id}-${c.id}`,
					label: `${r.name} · ${r.label}`,
					short: r.short,
					value: r.volumeByPart[c.id],
					bodyPart: c.label,
				})),
			]
		}),
	)
	const allVolumeEnabled = VOLUME_CHARTS.every((c) => enabledVolumeCharts.includes(c.id))
	const noneVolumeEnabled = enabledVolumeCharts.length === 0
	const activeVolumeCharts = VOLUME_CHARTS.filter((c) => enabledVolumeCharts.includes(c.id))
	const visibleRecords = showAllRecords ? exerciseRecords : exerciseRecords.slice(0, 6)
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
				<div className="flex flex-col gap-4">
					<section className="glass-card rounded-2xl p-5 text-center">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-xl font-black text-white">{initial}</div>
						<h1 className="mt-3 text-xl font-black">Mi perfil</h1>
						<p className="mt-1 break-all text-sm text-zinc-400">{email || session.user?.id}</p>
					</section>
					<section className="glass-card rounded-2xl p-5" aria-busy={sbLoading || statsLoading}>
						<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Stats · últimas 20 sesiones</h2>
						<div className="mt-3 grid grid-cols-4 gap-2 text-center">
							<div className="glass-inset rounded-xl px-1 py-3">
								<p className="text-xl font-black text-white">{sbLoading && finished.length === 0 ? '…' : finished.length}</p>
								<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Sesiones</p>
							</div>
							<div className="glass-inset rounded-xl px-1 py-3">
								<p className="text-xl font-black text-white">{statsLoading && statsRows.length === 0 ? '…' : Math.round(statsRows.reduce((a, r) => a + r.totalKcal, 0)).toLocaleString()}</p>
								<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Kcal tot.</p>
							</div>
							<div className="glass-inset rounded-xl px-1 py-3">
								<p className="text-xl font-black text-white">{statsLoading && statsRows.length === 0 ? '…' : (statsRows.length === 0 ? '0' : Math.round(statsRows.reduce((a, r) => a + r.totalKcal, 0) / statsRows.length))}</p>
								<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Kcal/ses.</p>
							</div>
							<div className="glass-inset rounded-xl px-1 py-3">
								<p className="text-xl font-black text-white">{sbLoading && finished.length === 0 ? '…' : dayStreak(finished.map((s) => s.started_at))}</p>
								<p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">Racha días</p>
							</div>
						</div>
						<p className="mt-3 text-xs leading-relaxed text-zinc-500">
							{sbLoading && finished.length === 0 ? 'Cargando tu actividad…' : last ? `Último entreno: ${new Date(last.started_at).toLocaleString()}` : 'Completa tu primera rutina y aparecerá aquí.'}
						</p>
					</section>
							<section className="glass-card rounded-2xl p-5" aria-label="Unidades de peso">
								<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Unidades</h2>
								<p className="mt-1 text-xs leading-relaxed text-zinc-500">Elige en qué unidad ves tus récords, historial y pesos en toda la app.</p>
								<div className="mt-3">
									<UnitToggle unit={weightUnit} onSwitch={switchWeightUnit} />
								</div>
								<p className="mt-2 text-xs leading-relaxed text-zinc-500" aria-live="polite">Actualmente: {weightUnit === 'kg' ? 'kilogramos (kg)' : 'libras (lb)'}</p>
							</section>
							<section className="glass-card rounded-2xl p-5">
								<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Meta semanal</h2>
						<div className="mt-3 flex items-center justify-between gap-3">
							<p className="text-sm text-zinc-400">Sesiones por semana</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => changeWeekGoal(-1)}
									disabled={weekGoal <= 1}
									aria-label="Bajar meta semanal"
									className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
								>
									−
								</button>
								<strong className="w-8 text-center text-xl font-black tabular-nums text-white" aria-live="polite">{weekGoal}</strong>
								<button
									type="button"
									onClick={() => changeWeekGoal(1)}
									disabled={weekGoal >= 7}
									aria-label="Subir meta semanal"
									className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-base text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
								>
									+
								</button>
							</div>
						</div>
						<span className={`day-progress mt-3 ${thisWeek >= weekGoal ? 'done' : ''}`} role="progressbar" aria-valuenow={Math.min(thisWeek, weekGoal)} aria-valuemin={0} aria-valuemax={weekGoal} aria-label="Progreso de la meta semanal">
							<span style={{ width: `${Math.round((Math.min(thisWeek, weekGoal) / weekGoal) * 100)}%` }} />
						</span>
						<p className="mt-2 text-xs leading-relaxed text-zinc-500">
							{thisWeek >= weekGoal
								? `Meta cumplida: ${thisWeek} de ${weekGoal}. Mantén el ritmo.`
								: `Esta semana llevas ${thisWeek} de ${weekGoal}. Te ${weekGoal - thisWeek === 1 ? 'falta 1' : `faltan ${weekGoal - thisWeek}`}.`}
						</p>
						<p className={`mt-1 text-xs leading-relaxed ${weekGoal >= 7 ? 'text-amber-300/90' : 'text-zinc-400'}`} aria-live="polite">
							{weekGoalTip(weekGoal)}
						</p>
					</section>
					<section className="glass-card rounded-2xl p-5">
						<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Gráficas</h2>
						{statsError ? (
							<p className="mt-3 text-sm text-red-400">No se pudieron cargar: {statsError}</p>
						) : chartData.length === 0 ? (
							statsLoading ? (
							<p className="mt-3 text-sm text-zinc-500">Calculando tus stats…</p>
							) : (
							<p className="mt-3 text-sm text-zinc-500">Sin sesiones terminadas todavía. Tus gráficas aparecen aquí.</p>
							)
						) : (
						<div className="mt-3 flex flex-col gap-5">
							<div>
								<div className="mb-1 flex items-center justify-between">
									<p className="text-sm font-bold text-white">Calorías por sesión</p>
									<p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
										<span className="inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden="true" /> Fuerza
										<span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> Cardio
										<span className="inline-block h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" /> Calent.
									</p>
								</div>
								<CalorieBars data={chartData.map((r) => ({ id: r.id, label: `${r.name} · ${r.label}`, short: r.short, strength: r.strengthKcal, cardio: r.cardioKcal, warmup: r.warmupKcal }))} />
								<p className="mt-1 text-xs leading-relaxed text-zinc-500">
									Promedio ~{Math.round(kcalAvg)} kcal por sesión{kcalBest ? ` · Tu mejor: ~${Math.round(kcalBest.totalKcal)} kcal el ${kcalBest.label}` : ''}. El número sobre cada barra es el total de esa sesión.
								</p>
							</div>
							<div>
								<p className="mb-1 text-sm font-bold text-white">Constancia semanal</p>
								<WeekBars data={weekData} goal={weekGoal} />
								<p className="mt-1 text-xs leading-relaxed text-zinc-500">
									Esta semana llevas {thisWeek} de {weekGoal} sesiones de tu meta. Las barras verdes la cumplen; la roja es la semana en curso.
								</p>
							</div>
							<div>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="text-sm font-bold text-white">Peso total movido por sesión</p>
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() => setAllVolumeCharts(true)}
											disabled={allVolumeEnabled}
											className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
										>
											Todas
										</button>
										<button
											type="button"
											onClick={() => setAllVolumeCharts(false)}
											disabled={noneVolumeEnabled}
											className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
										>
											Ninguna
										</button>
									</div>
								</div>
								<p className="mt-1 text-xs leading-relaxed text-zinc-500">
									Habilita o deshabilita gráficas separadas por parte del cuerpo para evitar picos al mezclar días de pierna con días de brazo.
								</p>
								<div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Habilitar o deshabilitar gráficas de peso movido">
									{VOLUME_CHARTS.map((c) => {
										const active = enabledVolumeCharts.includes(c.id)
										const count = volumeSeriesByChart[c.id]?.length ?? 0
										return (
											<button
												key={c.id}
												type="button"
												aria-pressed={active}
												onClick={() => toggleVolumeChart(c.id)}
												className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
													active
														? 'border-white/25 bg-white/10 text-white'
														: 'border-white/10 bg-transparent text-zinc-500 opacity-65 hover:border-white/20 hover:text-zinc-300'
												}`}
											>
												<span
													className="inline-block h-2 w-2 rounded-full"
													style={{ backgroundColor: c.color, opacity: active ? 1 : 0.45 }}
													aria-hidden="true"
												/>
												<span>{c.label}</span>
												<span className="text-[10px] text-zinc-400">({count})</span>
											</button>
										)
									})}
								</div>
								{activeVolumeCharts.length === 0 ? (
									<p className="glass-inset mt-3 rounded-xl px-3.5 py-3 text-xs text-zinc-400">
										Todas las gráficas de peso movido están deshabilitadas. Pulsa una parte del cuerpo arriba o «Todas» para verlas.
									</p>
								) : (
									<div className="mt-3 flex flex-col gap-3">
										{activeVolumeCharts.map((c) => {
											const series = volumeSeriesByChart[c.id] ?? []
											const firstVal = series.length > 0 ? series[0].value : 0
											const lastVal = series.length > 0 ? series[series.length - 1].value : 0
											const delta = firstVal > 0 ? Math.round(((lastVal - firstVal) / firstVal) * 100) : 0
											return (
												<div key={c.id} className="glass-inset rounded-xl p-3.5">
													<div className="mb-1 flex items-center justify-between gap-2">
														<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
															<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
															{c.id === 'total' ? 'Total sesión (todas las partes)' : `Solo ${c.label.toLowerCase()}`}
														</p>
														<span className="text-[11px] font-bold text-zinc-400">
															{series.length} {series.length === 1 ? 'sesión' : 'sesiones'}
														</span>
													</div>
													{series.length === 0 ? (
														<p className="mt-1 text-xs text-zinc-500">
															Sin sesiones de {c.label.toLowerCase()} registradas todavía.
														</p>
													) : (
														<>
															<TrendLine
																data={series}
																color={c.color}
																unit="kg"
																bodyPartLabel={c.id === 'total' ? '' : c.label}
															/>
															<p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
																{series.length > 1
																	? (delta >= 0
																		? `Vas subiendo: +${delta}% en ${c.label.toLowerCase()} desde tu primera sesión.`
																		: `Vas ${delta}% respecto a tu primera sesión de ${c.label.toLowerCase()}: toca superarla.`)
																	: `Tu base de ${c.label.toLowerCase()} está marcada (${Math.round(lastVal).toLocaleString()} kg): completa más sesiones para ver tu progreso.`}
															</p>
														</>
													)}
												</div>
											)
										})}
									</div>
								)}
							</div>
							<div>
								<p className="mb-1 text-sm font-bold text-white">Tus récords por ejercicio</p>
								{exerciseRecords.length === 0 ? (
									<p className="mt-2 text-sm text-zinc-500">Aún sin marcas registradas.</p>
								) : (
									<>
										<ul className="mt-2 flex flex-col gap-2">
											{visibleRecords.map((r) => (
												<li key={r.name} className="glass-inset flex items-center justify-between gap-3 rounded-xl px-4 py-3">
													<span className="min-w-0">
														<span className="block truncate text-sm font-bold text-white">{r.name}</span>
														<span className="mt-0.5 block text-xs text-zinc-500">{r.date ? new Date(r.date).toLocaleDateString() : 'Fecha desconocida'}</span>
													</span>
													<strong className="shrink-0 text-sm font-black text-amber-300">{displayWeight(r.maxLb, weightUnit)} {weightUnit} × {r.reps}</strong>
												</li>
											))}
										</ul>
										{exerciseRecords.length > 6 && (
											<button
												type="button"
												onClick={() => setShowAllRecords((v) => !v)}
												className="mt-2 w-full rounded-xl border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25 hover:text-white"
											>
												{showAllRecords ? 'Ver menos' : `Ver todos (${exerciseRecords.length})`}
											</button>
										)}
									</>
								)}
								<p className="mt-2 text-xs leading-relaxed text-zinc-500">Tu mejor marca en cada ejercicio, con las repeticiones que hiciste ese día.</p>
							</div>
							<p className="text-[11px] leading-relaxed text-zinc-600">Estimaciones aproximadas: fuerza ≈ 1 kcal por cada 20 kg movidos · cardio = 8 MET × tu peso × tiempo · calentamiento = 3.5 MET × tu peso × tiempo.</p>
						</div>
						)}
					</section>
					<section className="glass-card rounded-2xl p-5">
						<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mis datos · para tus stats</h2>
						<form onSubmit={saveProfileForm} className="mt-3 flex flex-col gap-3">
							<UnitToggle unit={weightUnit} onSwitch={switchWeightUnit} />
							<div className="grid grid-cols-2 gap-2">
								<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									Peso ({weightUnit}) *
									<input
										type="number"
										min="0"
										step="0.5"
										value={profileForm.weight}
										onChange={(e) => setProfileForm((p) => ({ ...p, weight: e.target.value }))}
										placeholder={weightUnit === 'kg' ? 'ej. 75' : 'ej. 165'}
										aria-label={`Tu peso en ${weightUnit}`}
										className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
									/>
								</label>
								<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									Altura (cm)
									<input
										type="number"
										min="100"
										max="250"
										step="0.5"
										value={profileForm.height}
										onChange={(e) => setProfileForm((p) => ({ ...p, height: e.target.value }))}
										placeholder="ej. 175"
										aria-label="Tu altura en centímetros"
										className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
									/>
								</label>
								<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									Edad
									<input
										type="number"
										min="10"
										max="100"
										step="1"
										value={profileForm.age}
										onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
										placeholder="ej. 28"
										aria-label="Tu edad"
										className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
									/>
								</label>
								<div className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									<span id="profile-sex-label">Sexo</span>
									<CustomSelect
										value={profileForm.sex}
										onChange={(v) => setProfileForm((p) => ({ ...p, sex: v }))}
										placeholder="Selecciona…"
										ariaLabel="Tu sexo"
									/>
								</div>
							</div>
							{(() => {
								const kg = Number(profile?.weight_kg ?? bodyKg)
								const hcm = Number(profile?.height_cm)
								if (Number.isFinite(kg) && kg > 0 && Number.isFinite(hcm) && hcm > 0) {
									const imc = kg / ((hcm / 100) * (hcm / 100))
									return <p className="text-xs text-zinc-500" aria-live="polite">IMC ≈ {Math.round(imc * 10) / 10} · {bodyKg} kg actuales para kcal de cardio/calentamiento</p>
								}
								return <p className="text-[11px] leading-relaxed text-zinc-600">Tu peso se usa para estimar las calorías del cardio y calentamiento. Puedes cambiarlo cuando quieras.</p>
							})()}
							{profileMsg && (
								<p className="text-sm text-zinc-300" aria-live="polite">{profileMsg}</p>
							)}
							<button
								type="submit"
								disabled={profileSaving}
								className="min-h-12 w-full rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:opacity-60"
							>
								{profileSaving ? 'Guardando…' : 'Guardar mis datos'}
							</button>
						</form>
					</section>
					<section className="glass-card rounded-2xl p-5">
						<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Apariencia</h2>
						<button type="button" onClick={toggleTheme} className="glass-inset mt-3 flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-bold text-white transition hover:border-red-500/60" aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}>
							<span>Tema {theme === 'light' ? 'claro' : 'oscuro'}</span>
							<span className="text-red-500">Cambiar</span>
						</button>
					</section>
					<section className="glass-card rounded-2xl p-5">
						<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tus datos</h2>
						<p className="mt-1 text-xs leading-relaxed text-zinc-500">Borrar tu historial no toca tus rutinas ni tu perfil.</p>
						<div className="mt-3 flex flex-col gap-2">
							<button
								type="button"
								onClick={wipeHistory}
								className={`min-h-12 w-full rounded-xl border px-4 text-[11px] font-bold uppercase tracking-widest transition ${confirmWipe ? 'border-red-500/60 bg-red-500/15 text-red-300' : 'border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300'}`}
							>
								{confirmWipe ? 'Toca de nuevo para borrar todo' : 'Borrar historial'}
							</button>
						</div>
						{dataMsg && (
							<p className="mt-2 text-xs text-zinc-400" aria-live="polite">{dataMsg}</p>
						)}
					</section>
					<section className="glass-card rounded-2xl p-5">
						<h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cuenta</h2>
						<button type="button" onClick={signOut} className="mt-3 min-h-12 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-bold uppercase tracking-widest text-red-300 transition hover:border-red-500/60">
							Cerrar sesión
						</button>
					</section>
				</div>
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
