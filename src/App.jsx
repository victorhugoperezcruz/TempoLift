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

const legExercises = [
	['Prensa de piernas', '2 x 10', 'Pies altos'],
	['Extensión de cuádriceps', '2 x 10-12', 'Controla la bajada'],
	['Máquina de aductores', '2 x 12', 'Pausa al cerrar'],
	['Máquina de abductores', '2 x 12', 'Controla la vuelta'],
	['Patada de glúteo', '2 x 10 por pierna', 'Una pierna a la vez'],
	['Curl de isquiosurales sentado', '2 x 10', 'Aprieta arriba'],
	['Biserie de pantorrillas', '2 x 12 + 2 x 12', 'De pie + sentado'],
]

const workoutDays = [
	{
		id: 1,
		name: 'Torso',
		focus: 'Pecho y espalda',
		accent: 'bg-lime-300',
		exercises: [
			['Press inclinado', '2 x 8', 'Tempo 3-1-1'],
			['Remo en T', '2 x 8-10', 'Tempo 3-1-1'],
			['Press plano', '2 x 8', 'Tempo 3-1-1'],
			['Jalón a pecho', '2 x 8-10', 'Tempo 3-1-1'],
			['Elevaciones laterales', '2 x 12', 'Sin impulso'],
			['Curl martillo', '2 x 10', 'Agarre neutro'],
		],
	},
	{
		id: 2,
		name: 'Pierna',
		focus: 'Cuádriceps y glúteo',
		accent: 'bg-orange-300',
		exercises: legExercises,
	},
	{
		id: 3,
		name: 'Torso',
		focus: 'Hombro y brazo',
		accent: 'bg-sky-300',
		exercises: [
			['Press militar', '2 x 8', 'Tempo 3-1-1'],
			['Jalón unilateral dorsal', '2 x 10', 'Por lado'],
			['Pec Fly', '2 x 10-12', 'Tempo 3-1-1'],
			['Skull crushers', '2 x 8-10', 'Codos fijos'],
			['Curl predicador', '2 x 10', 'Tempo 3-1-1'],
			['Tríceps en polea', '2 x 10', 'Aprieta abajo'],
		],
	},
	{
		id: 4,
		name: 'Pierna',
		focus: 'Isquios y cadena posterior',
		accent: 'bg-rose-300',
		exercises: legExercises,
	},
]

function Phase({ phase, open, onToggle, children }) {
	return (
		<section className="border-b border-white/10 last:border-b-0">
			<button
				type="button"
				className="flex min-h-20 w-full items-center justify-between gap-4 py-5 text-left"
				onClick={onToggle}
				aria-expanded={open}
			>
				<span className="flex items-center gap-4">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-lime-300">{phase.label.replace('Fase ', '0')}</span>
					<span>
						<strong className="block text-lg font-bold text-white">{phase.title}</strong>
						<span className="text-sm text-zinc-400">{phase.detail}</span>
					</span>
				</span>
				<span className={`text-2xl text-lime-300 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
			</button>
			{open && <div className="pb-5">{children}</div>}
		</section>
	)
}

function App() {
	const [selectedDay, setSelectedDay] = useState(null)
	const [openPhase, setOpenPhase] = useState('strength')
	const selectedWorkout = workoutDays.find((day) => day.id === selectedDay)

	const togglePhase = (phase) => {
		setOpenPhase((current) => (current === phase ? '' : phase))
	}

	if (selectedWorkout) {
		return (
			<main className="mx-auto min-h-screen max-w-lg bg-[#0b0d0c] px-5 pb-10 text-white">
				<header className="flex items-center justify-between py-6">
					<button type="button" onClick={() => setSelectedDay(null)} className="flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400" aria-label="Volver a los días">
						<span className="text-2xl leading-none text-lime-300">‹</span> Días
					</button>
					<span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Plan semanal</span>
				</header>
				<div className="mb-8">
					<p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-lime-300">Día {selectedWorkout.id} / 4</p>
					<h1 className="text-4xl font-black tracking-tight">{selectedWorkout.name}</h1>
					<p className="mt-2 text-lg text-zinc-400">{selectedWorkout.focus}</p>
				</div>
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121613] px-5 shadow-2xl shadow-black/20">
					<Phase phase={globalPhases.warmup} open={openPhase === 'warmup'} onToggle={() => togglePhase('warmup')}>
						<div className="rounded-xl bg-white/5 p-4 text-base text-zinc-300">{globalPhases.warmup.notes}</div>
					</Phase>
					<Phase phase={{ title: 'Fuerza', label: 'Fase 2', detail: `${selectedWorkout.exercises.length} ejercicios` }} open={openPhase === 'strength'} onToggle={() => togglePhase('strength')}>
						<div className="mb-4 flex items-center justify-between rounded-xl border border-lime-300/20 bg-lime-300/5 px-4 py-3 text-sm">
							<span className="text-zinc-300">Regla global</span>
							<strong className="text-lime-300">3-1-1 · 2-3 min</strong>
						</div>
						<div className="divide-y divide-white/10">
							{selectedWorkout.exercises.map(([name, reps, note], index) => (
								<div key={`${name}-${index}`} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
									<div className="min-w-0">
										<p className="text-base font-bold text-white">{name}</p>
										<p className="mt-1 text-sm text-zinc-500">{note}</p>
									</div>
									<span className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-lime-200">{reps}</span>
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
		<main className="mx-auto min-h-screen max-w-lg overflow-hidden bg-[#0b0d0c] px-5 pb-10 text-white">
			<header className="flex items-center justify-between py-6">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-lg font-black text-[#0b0d0c]">T</div>
					<span className="text-lg font-black tracking-tight">TempoLift</span>
				</div>
				<span className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Entreno</span>
			</header>
			<section className="pb-9 pt-8">
				<p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-lime-300">Tu plan de hoy</p>
				<h1 className="max-w-xs text-5xl font-black leading-[0.95] tracking-tight">Elige tu día.</h1>
				<p className="mt-5 max-w-xs text-base leading-relaxed text-zinc-400">Entrena con intención. Una sesión a la vez.</p>
			</section>
			<div className="grid gap-3">
				{workoutDays.map((day) => (
					<button key={day.id} type="button" onClick={() => setSelectedDay(day.id)} className="group flex min-h-28 items-center justify-between rounded-2xl border border-white/10 bg-[#121613] p-5 text-left transition active:scale-[0.98] hover:border-lime-300/60">
						<span className="flex items-center gap-4">
							<span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-[#0b0d0c] ${day.accent}`}>0{day.id}</span>
							<span>
								<strong className="block text-xl font-black text-white">{day.name}</strong>
								<span className="mt-1 block text-sm text-zinc-500">{day.focus}</span>
							</span>
						</span>
						<span className="text-2xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-lime-300">→</span>
					</button>
				))}
			</div>
			<footer className="mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-widest text-zinc-600">
				<span>4 sesiones</span>
				<span>Fuerza + cardio</span>
			</footer>
		</main>
	)
}

export default App
