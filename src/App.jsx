import { useState } from 'react'

const globalPhases = {
	warmup: {
		title: 'Calentamiento',
		label: 'Fase 1',
		detail: '5-10 min · Caminadora',
		notes: 'Velocidad 5 km/h · Inclinación 0',
	},
	cardio: {
		title: 'Cardio final',
		label: 'Fase 3',
		detail: '20-30 min · Caminadora',
		notes: 'Velocidad 4-5 km/h · Inclinación 10-12',
	},
}

const globalRules = {
	tempo: '3-1-1',
	rest: '2-3 min',
}

const workoutDays = [
	{
		id: 1,
		name: 'Pecho y espalda',
		focus: 'Torso',
		accent: 'bg-red-500',
		exercises: [
			['Press inclinado', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano', '2 x 8', 'Tempo 3-1-1'],
			['Jalón a pecho', '2 x 8-10', 'Tempo 3-1-1'],
			['Pec Fly', '1 x al fallo', 'Tempo 3-1-1'],
			['Jalón unilateral dorsal', '1 x al fallo', 'Por lado'],
		],
	},
	{
		id: 2,
		name: 'Pierna',
		focus: 'Cuádriceps y glúteo',
		accent: 'bg-orange-300',
		exercises: [
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Extensión de cuádriceps', '2 x 10-12', 'Tempo 3-1-1'],
			['Máquina de aductores', '2 x 12', 'Tempo 3-1-1'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
			['Biserie de pantorrillas', '2 x 12 + 2 x 12', 'De pie + sentado'],
		],
	},
	{
		id: 3,
		name: 'Hombro y brazo',
		focus: 'Torso',
		accent: 'bg-sky-300',
		exercises: [
			['Press militar', '2 x 8', 'Tempo 3-1-1'],
			['Elevaciones laterales', '2 x 12', 'Tempo 3-1-1'],
			['Skull crushers', '2 x 8-10', 'Codos fijos'],
			['Curl predicador', '2 x 10', 'Tempo 3-1-1'],
			['Tríceps en polea', '2 x 10', 'Aprieta abajo'],
			['Curl martillo', '2 x 10', 'Agarre neutro'],
			['Colgado en barra', '2 x al fallo', 'Antebrazo'],
		],
	},
	{
		id: 4,
		name: 'Pierna',
		focus: 'Isquiosurales y glúteo',
		accent: 'bg-rose-300',
		exercises: [
			['Prensa de piernas', '2 x 10', 'Pies altos'],
			['Curl de isquiosurales sentado', '2 x 10-12', 'Tempo 3-1-1'],
			['Patada de glúteo', '2 x 10 por pierna', 'Una pierna a la vez'],
			['Máquina de abductores', '2 x 12', 'Tempo 3-1-1'],
			['Biserie de pantorrillas', '2 x 12 + 2 x 12', 'De pie + sentado'],
		],
	},
	{
		id: 5,
		name: 'Torso mixto',
		focus: 'Pecho, espalda y hombro',
		accent: 'bg-violet-300',
		exercises: [
			['Press inclinado', '2 x 8', 'Tempo 3-1-1'],
			['Jalón a pecho', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T', '2 x 8-10', 'Tempo 3-1-1'],
			['Elevaciones laterales', '2 x 12', 'Tempo 3-1-1'],
		],
	},
]

const weekSchedule = [
	{ day: 'Lun', fullDay: 'Lunes', rest: true },
	{ day: 'Mar', fullDay: 'Martes', rest: true },
	{ day: 'Mié', fullDay: 'Miércoles', workoutId: 1 },
	{ day: 'Jue', fullDay: 'Jueves', workoutId: 2 },
	{ day: 'Vie', fullDay: 'Viernes', workoutId: 3 },
	{ day: 'Sáb', fullDay: 'Sábado', workoutId: 4 },
	{ day: 'Dom', fullDay: 'Domingo', workoutId: 5 },
]

function Phase({ phase, open, onToggle, children }) {
	return (
		<section className="border-b border-white/10 last:border-b-0">
			<button
				type="button"
				className="phase-toggle flex min-h-20 w-full items-center justify-between gap-4 py-5 text-left"
				onClick={onToggle}
				aria-expanded={open}
			>
				<span className="flex items-center gap-4">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-red-500">{phase.label.replace('Fase ', '0')}</span>
					<span>
						<strong className="block text-lg font-bold text-white">{phase.title}</strong>
						<span className="text-sm text-zinc-400">{phase.detail}</span>
					</span>
				</span>
				<span className={`text-2xl text-red-500 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
			</button>
			{open && <div className="phase-content pb-5">{children}</div>}
		</section>
	)
}

function ThemeToggle({ theme, onToggle }) {
	const isLight = theme === 'light'

	return (
		<button
			type="button"
			className="theme-toggle flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:border-red-500/60 hover:text-red-500"
			onClick={onToggle}
			aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
		>
			<span aria-hidden="true" className="text-base">{isLight ? '☀' : '☾'}</span>
			<span>{isLight ? 'Claro' : 'Oscuro'}</span>
		</button>
	)
}

function App() {
	const [selectedDay, setSelectedDay] = useState(null)
	const [calendarView, setCalendarView] = useState('list')
	const [theme, setTheme] = useState('dark')
	const [openPhase, setOpenPhase] = useState('strength')
	const selectedWorkout = workoutDays.find((day) => day.id === selectedDay)

	const togglePhase = (phase) => {
		setOpenPhase((current) => (current === phase ? '' : phase))
	}

	if (selectedWorkout) {
		return (
			<main className={`screen-enter theme-${theme} mx-auto min-h-screen max-w-lg bg-[#0b0d0c] px-5 pb-10 text-white`}>
				<header className="flex items-center justify-between py-6">
					<button type="button" onClick={() => setSelectedDay(null)} className="flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400" aria-label="Volver a los días">
						<span className="text-2xl leading-none text-red-500">‹</span> Días
					</button>
					<ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
				</header>
				<div className="mb-8">
					<p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-red-500">Día {selectedWorkout.id} / 5</p>
					<h1 className="text-4xl font-black tracking-tight">{selectedWorkout.name}</h1>
					<p className="mt-2 text-lg text-zinc-400">{selectedWorkout.focus}</p>
				</div>
				<div className="routine-card overflow-hidden rounded-2xl border border-white/10 bg-[#121613] px-5 shadow-2xl shadow-black/20">
					<Phase phase={globalPhases.warmup} open={openPhase === 'warmup'} onToggle={() => togglePhase('warmup')}>
						<div className="rounded-xl bg-white/5 p-4 text-base text-zinc-300">{globalPhases.warmup.notes}</div>
					</Phase>
					<Phase phase={{ title: 'Fuerza', label: 'Fase 2', detail: `${selectedWorkout.exercises.length} ejercicios` }} open={openPhase === 'strength'} onToggle={() => togglePhase('strength')}>
						<div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
							<span className="text-zinc-300">Regla global</span>
							<strong className="text-red-500">{globalRules.tempo} · {globalRules.rest}</strong>
						</div>
						<div className="divide-y divide-white/10">
							{selectedWorkout.exercises.map(([name, reps, note], index) => (
								<div key={`${name}-${index}`} className="exercise-row flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
									<div className="min-w-0">
										<p className="text-base font-bold text-white">{name}</p>
										<p className="mt-1 text-sm text-zinc-500">{note}</p>
									</div>
									<span className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-red-400">{reps}</span>
								</div>
							))}
						</div>
					</Phase>
					<Phase phase={globalPhases.cardio} open={openPhase === 'cardio'} onToggle={() => togglePhase('cardio')}>
						<div className="rounded-xl bg-white/5 p-4 text-base text-zinc-300">{globalPhases.cardio.notes}</div>
					</Phase>
				</div>
				<p className="mt-6 text-center text-xs uppercase tracking-widest text-zinc-600">Escucha tu cuerpo · Mantén el control</p>
			</main>
		)
	}

	return (
			<main className={`screen-enter theme-${theme} mx-auto min-h-screen max-w-4xl overflow-hidden bg-[#0b0d0c] px-5 pb-10 text-white`}>
			<header className="flex items-center justify-between py-6">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
					<span className="text-lg font-black tracking-tight">TempoLift</span>
				</div>
				<ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
			</header>
			<section className="pb-8 pt-8">
				<p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-red-500">Tu plan de hoy</p>
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
					<div>
						<h1 className="max-w-xs text-5xl font-black leading-[0.95] tracking-tight">Tu semana.</h1>
						<p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">Visualiza tu entrenamiento y llega preparado a cada sesión.</p>
					</div>
					<div className="flex w-fit self-start rounded-xl border border-white/10 bg-[#121613] p-1" role="tablist" aria-label="Vista del calendario">
						<button
							type="button"
							role="tab"
							aria-selected={calendarView === 'list'}
							onClick={() => setCalendarView('list')}
							className={`view-tab rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${calendarView === 'list' ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
						>
							Lista
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={calendarView === 'grid'}
							onClick={() => setCalendarView('grid')}
							className={`view-tab rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${calendarView === 'grid' ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
						>
							Cuadrícula
						</button>
					</div>
				</div>
			</section>
			<section key={calendarView} className="view-switch overflow-hidden rounded-2xl border border-white/10 bg-[#121613] shadow-2xl shadow-black/20">
				<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Calendario semanal</p>
						<h2 className="mt-1 text-xl font-black text-white">Lunes a domingo</h2>
					</div>
					<span className="text-xs font-bold uppercase tracking-widest text-red-500">5 sesiones</span>
				</div>
				{calendarView === 'list' ? (
					<div className="divide-y divide-white/10">
						{weekSchedule.map((entry) => {
							const day = workoutDays.find((workout) => workout.id === entry.workoutId)
							if (entry.rest) {
								return (
									<div key={entry.day} className="calendar-item flex min-h-24 items-center justify-between px-5 py-4 opacity-60">
										<span className="flex items-center gap-4">
											<span className="w-10 text-xs font-bold uppercase tracking-widest text-zinc-500">{entry.day}</span>
											<span>
												<strong className="block text-lg font-black text-white">Descanso</strong>
												<span className="mt-1 block text-sm text-zinc-500">Recuperación y movilidad</span>
											</span>
										</span>
										<span className="text-sm text-zinc-600">—</span>
									</div>
								)
							}
							return (
									<button key={entry.day} type="button" onClick={() => setSelectedDay(day.id)} className="calendar-item group flex min-h-24 w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5">
									<span className="flex items-center gap-4">
										<span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
										<span>
											<strong className="block text-lg font-black text-white">{day.name}</strong>
											<span className="mt-1 block text-sm text-zinc-500">{day.focus}</span>
										</span>
									</span>
									<span className="text-2xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-red-500">→</span>
								</button>
							)
						})}
					</div>
				) : (
					<div className="calendar-scroll overflow-x-auto p-3">
						<div className="grid min-w-[700px] grid-cols-7 gap-2">
							{weekSchedule.map((entry) => {
								const day = workoutDays.find((workout) => workout.id === entry.workoutId)
								if (entry.rest) {
									return (
										<div key={entry.day} className="calendar-item min-h-44 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 opacity-60">
											<span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{entry.day}</span>
											<p className="mt-8 text-sm font-bold text-zinc-400">Descanso</p>
											<p className="mt-1 text-xs leading-relaxed text-zinc-600">Recuperación</p>
										</div>
									)
								}
								return (
									<button key={entry.day} type="button" onClick={() => setSelectedDay(day.id)} className="calendar-item group min-h-44 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/10">
										<span className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
										<strong className="mt-5 block text-sm font-black leading-tight text-white">{day.name}</strong>
										<span className="mt-2 block text-xs leading-relaxed text-zinc-500">{day.focus}</span>
										<span className="mt-5 block text-[10px] font-bold uppercase tracking-widest text-red-500">Ver sesión</span>
									</button>
								)
							})}
						</div>
					</div>
				)}
			</section>
			<footer className="mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-widest text-zinc-600">
				<span>Plan de 5 días</span>
				<span>Fuerza + cardio</span>
			</footer>
		</main>
	)
}

export default App
