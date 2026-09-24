import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import ExerciseItem from './components/ExerciseItem.jsx'
import BottomNav from './components/BottomNav.jsx'
import ActiveWorkout from './ActiveWorkout.jsx'
import { getExerciseBundle } from './services/exercisesApi.js'
import { ensureDayRows, fetchLastWeights, parseTargetReps, saveDaySession } from './services/planSync.js'

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

const REST_SECONDS = 120

function formatRest(total) {
	const m = Math.floor(total / 60)
	const s = total % 60
	return `${m}:${String(s).padStart(2, '0')}`
}

// Muestra un aviso legible y guarda el detalle técnico en la consola.
function friendlyError(err) {
	console.error(err)
	const msg = err?.message ?? String(err ?? '')
	if (/42501|permission denied|permiso/i.test(msg)) return 'tu usuario no tiene permiso en la base de datos'
	if (/Failed to fetch|Network|network|fetch/i.test(msg)) return 'no hay conexión con la base de datos'
	if (/relation .* does not exist|Could not find the table|PGRST/i.test(msg)) return 'falta crear las tablas en la base de datos'
	return 'inténtalo de nuevo'
}

const Phase = memo(function Phase({ phase, open, onToggle, children }) {
	return (
		<section className="border-b border-white/10 last:border-b-0">
			<button
				type="button"
				className="phase-toggle flex min-h-20 w-full items-center justify-between gap-4 py-5 text-left"
				onClick={onToggle}
				aria-expanded={open}
			>
				<span className="flex items-center gap-4">
					<span className="glass-num flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-red-500">{phase.label.replace('Fase ', '0')}</span>
					<span>
						<strong className="block text-lg font-bold text-white">{phase.title}</strong>
						<span className="text-sm text-zinc-400">{phase.detail}</span>
					</span>
				</span>
				<span className={`phase-chevron ${open ? 'open' : ''}`} aria-hidden="true">
					<svg viewBox="0 0 16 16" className="phase-chevron-icon">
						<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
			</button>
			{open && (
				<div className="phase-collapse open" aria-hidden={false}>
					<div className="phase-collapse-inner">
						<div className="phase-content pb-5">{children}</div>
					</div>
				</div>
			)}
		</section>
	)
})

const ThemeToggle = memo(function ThemeToggle({ theme, onToggle }) {
	const isLight = theme === 'light'

	return (
		<button
			type="button"
			className="theme-toggle glass-pill flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:border-red-500/60 hover:text-red-500"
			onClick={onToggle}
			aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
		>
			<span aria-hidden="true" className="theme-icon text-base">{isLight ? '☀' : '☾'}</span>
			<span>{isLight ? 'Claro' : 'Oscuro'}</span>
		</button>
	)
})

const BackgroundOrbs = memo(function BackgroundOrbs() {
	return (
		<div className="bg-orbs" aria-hidden="true">
			<span className="orb orb-a" />
			<span className="orb orb-b" />
		</div>
	)
})

// Mini-timer global: se ve en cualquier pantalla mientras descansas.
// Al volver al entrenamiento aparece la card completa.
const RestPill = memo(function RestPill({ label, seconds, onReturn }) {
	return (
		<button
			type="button"
			onClick={onReturn}
			role="status"
			aria-label={`Volver al entrenamiento, descanso ${formatRest(seconds)}`}
			className="glass-card fixed left-1/2 top-20 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 shadow-2xl shadow-black/40"
			style={{ backgroundColor: 'rgba(11,13,12,0.94)' }}
		>
			<span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
			<span className="truncate text-xs font-bold uppercase tracking-widest text-red-400">
				Descanso{label ? ` · ${label}` : ''}
			</span>
			<span className="text-sm font-black tabular-nums text-white">{formatRest(seconds)}</span>
			<span aria-hidden="true" className="text-xs text-zinc-500">→</span>
		</button>
	)
})

function App() {
	const [session, setSession] = useState(null)
	const [selectedDay, setSelectedDay] = useState(null)
	const [calendarView, setCalendarView] = useState('list')
	const [theme, setTheme] = useState('dark')
	const [openPhase, setOpenPhase] = useState('strength')
	// Series por ejercicio: { [workoutId]: { [index]: 1 | 2 } }. Solo suma al progreso con las 2 series.
	const [seriesByDay, setSeriesByDay] = useState({})
	const [expandedKey, setExpandedKey] = useState(null)
	const [dayComplete, setDayComplete] = useState(false)
	const [currentView, setCurrentView] = useState('home')
	const [trainRoutineId, setTrainRoutineId] = useState(null)
	const [sbRoutines, setSbRoutines] = useState([])
	const [sbSessions, setSbSessions] = useState([])
	const [sbLoading, setSbLoading] = useState(false)
	// Detalle del historial: sesión abierta, sus series y edición de peso
	const [openSession, setOpenSession] = useState(null)
	const [sessionSets, setSessionSets] = useState({})
	const [setsLoading, setSetsLoading] = useState(false)
	const [editingSet, setEditingSet] = useState(null)
	const [editWeight, setEditWeight] = useState('')
	const [editReps, setEditReps] = useState('')
	const [setMsg, setSetMsg] = useState('')
	const [confirmDelete, setConfirmDelete] = useState(null)
	const [restLeft, setRestLeft] = useState(0)
	const [restLabel, setRestLabel] = useState('')
	const [restSeries, setRestSeries] = useState(1)
	const [lastDay, setLastDay] = useState(null)
	// Peso anotado por serie: { [workoutId]: { [index]: { 1: { weight, reps }, 2: { weight, reps } } } }
	const [weights, setWeights] = useState({})
	// Modal para anotar peso: { workoutId, index, name, setNumber, planReps } o null
	const [weightModal, setWeightModal] = useState(null)
	const [weightInput, setWeightInput] = useState('')
	const [repsInput, setRepsInput] = useState('')
	const [setError, setSetError] = useState('')
	// Vínculos del plan en la base de datos + último peso por ejercicio
	const [planIds, setPlanIds] = useState(null)
	const [lastW, setLastW] = useState({})
	const [syncError, setSyncError] = useState('')
	// Estado del guardado del día: idle | saving | saved | error
	const [saveStatus, setSaveStatus] = useState({ state: 'idle', msg: '' })
	const saveSigRef = useRef(null)
	const dayStartRef = useRef(null)

	const isResting = restLeft > 0

	const selectedWorkout = workoutDays.find((day) => day.id === selectedDay) ?? null

	const seriesMap = selectedWorkout ? (seriesByDay[selectedWorkout.id] ?? {}) : {}
	const checkedList = Object.entries(seriesMap).filter(([, v]) => v === 2).map(([k]) => Number(k))
	const totalExercises = selectedWorkout ? selectedWorkout.exercises.length : 0
	const doneCount = checkedList.length
	const progress = totalExercises ? doneCount / totalExercises : 0
	const allDone = totalExercises > 0 && doneCount === totalExercises

	const togglePhase = useCallback((phase) => {
		setOpenPhase((current) => (current === phase ? '' : phase))
	}, [])

	const toggleTheme = useCallback(() => {
		setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
	}, [])

	// Primer toque = anota peso (serie 1) + descanso. Segundo toque = anota peso (serie 2) + descanso. Tercer toque = desmarcar.
	const handleToggleCheck = (workoutId, index, exerciseName, planReps) => {
		if (restLeft > 0 || weightModal) return
		const current = seriesByDay[workoutId]?.[index] ?? 0
		if (current >= 2) {
			setDayComplete(false)
			setSeriesByDay((prev) => {
				const day = { ...(prev[workoutId] ?? {}) }
				delete day[index]
				return { ...prev, [workoutId]: day }
			})
			setWeights((prev) => {
				const day = { ...(prev[workoutId] ?? {}) }
				delete day[index]
				return { ...prev, [workoutId]: day }
			})
			return
		}
		const setNumber = current + 1
		const exerciseId = planIds?.byIndex?.[index]
		const prev = exerciseId ? lastW[exerciseId] : null
		setWeightInput(prev?.weight_kg != null ? String(prev.weight_kg) : '')
		setRepsInput(prev?.reps != null ? String(prev.reps) : (parseTargetReps(planReps) != null ? String(parseTargetReps(planReps)) : ''))
		setSetError('')
		setWeightModal({ workoutId, index, name: exerciseName ?? 'Ejercicio', setNumber, planReps })
	}

	const closeWeightModal = () => {
		setWeightModal(null)
		setWeightInput('')
		setRepsInput('')
		setSetError('')
	}

	const confirmWeightModal = (e) => {
		if (e) e.preventDefault()
		if (!weightModal) return
		const w = parseFloat(weightInput)
		const r = parseInt(repsInput, 10)
		if (Number.isNaN(w) || w < 0) {
			setSetError('Escribe un peso válido (0 o más)')
			return
		}
		if (Number.isNaN(r) || r < 0) {
			setSetError('Escribe repeticiones válidas (0 o más)')
			return
		}
		const { workoutId, index, name, setNumber } = weightModal
		setSeriesByDay((prev) => ({
			...prev,
			[workoutId]: { ...(prev[workoutId] ?? {}), [index]: setNumber },
		}))
		setWeights((prev) => ({
			...prev,
			[workoutId]: { ...(prev[workoutId] ?? {}), [index]: { ...(prev[workoutId]?.[index] ?? {}), [setNumber]: { weight: w, reps: r } } },
		}))
		setDayComplete(false)
		setWeightModal(null)
		setWeightInput('')
		setRepsInput('')
		setSetError('')
		setRestLabel(name)
		setRestSeries(setNumber)
		setRestLeft(REST_SECONDS)
	}

	const skipRest = useCallback(() => setRestLeft(0), [])

	const resetDay = useCallback((workoutId) => {
		setSeriesByDay((prev) => ({ ...prev, [workoutId]: {} }))
		setWeights((prev) => ({ ...prev, [workoutId]: {} }))
		setDayComplete(false)
		setExpandedKey(null)
		setRestLeft(0)
		setSaveStatus({ state: 'idle', msg: '' })
		saveSigRef.current = null
	}, [])

	const toggleExpand = useCallback((key) => {
		setExpandedKey((cur) => (cur === key ? null : key))
	}, [])

	const selectDay = useCallback((id) => {
		setSelectedDay(id)
		setLastDay(id)
	}, [])
	const goBack = useCallback(() => setSelectedDay(null), [])
	const returnToTraining = useCallback(() => {
		if (lastDay != null) setSelectedDay(lastDay)
		setCurrentView('home')
	}, [lastDay])
	const signInWithGoogle = useCallback(async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: window.location.origin,
			},
		})
	}, [])
	const signOut = useCallback(async () => {
		await supabase.auth.signOut()
	}, [])

	const handleNav = useCallback((view) => {
		setCurrentView(view)
		setSelectedDay(null)
		setTrainRoutineId(null)
		setOpenSession(null)
		setEditingSet(null)
		setSetMsg('')
		setConfirmDelete(null)
	}, [])

	const deleteSession = async (s) => {
		if (confirmDelete !== s.id) {
			setConfirmDelete(s.id)
			return
		}
		setConfirmDelete(null)
		try {
			const { error: logsError } = await supabase
				.from('set_logs')
				.delete()
				.eq('user_id', session.user.id)
				.eq('session_id', s.id)
			if (logsError) throw logsError
			const { error: sessionError } = await supabase
				.from('workout_sessions')
				.delete()
				.eq('id', s.id)
				.eq('user_id', session.user.id)
			if (sessionError) throw sessionError
			setSbSessions((prev) => prev.filter((x) => x.id !== s.id))
			setSessionSets((prev) => {
				const next = { ...prev }
				delete next[s.id]
				return next
			})
			if (openSession === s.id) setOpenSession(null)
			setSetMsg('Entrenamiento eliminado')
		} catch (err) {
			setSetMsg(`No se pudo eliminar: ${friendlyError(err)}`)
		}
	}

	const toggleSession = async (s) => {
		if (openSession === s.id) {
			setOpenSession(null)
			return
		}
		setOpenSession(s.id)
		setSetMsg('')
		if (sessionSets[s.id]) return
		setSetsLoading(true)
		try {
			const { data, error } = await supabase
				.from('set_logs')
				.select('id, session_id, set_number, weight_kg, reps, exercise_id, exercises (name)')
				.eq('user_id', session.user.id)
				.eq('session_id', s.id)
				.order('created_at', { ascending: true })
			if (error) throw error
			setSessionSets((prev) => ({ ...prev, [s.id]: data ?? [] }))
		} catch (err) {
			setSetMsg(`No se pudieron cargar las series: ${friendlyError(err)}`)
		} finally {
			setSetsLoading(false)
		}
	}

	const startEditSet = (row) => {
		setEditingSet(row.id)
		setEditWeight(String(row.weight_kg ?? ''))
		setEditReps(String(row.reps ?? ''))
		setSetMsg('')
	}

	const saveEditSet = async (row) => {
		const w = parseFloat(editWeight)
		const r = parseInt(editReps, 10)
		if (Number.isNaN(w) || w < 0 || Number.isNaN(r) || r < 0) {
			setSetMsg('Escribe peso y repeticiones válidos')
			return
		}
		try {
			const { error } = await supabase
				.from('set_logs')
				.update({ weight_kg: w, reps: r })
				.eq('id', row.id)
				.eq('user_id', session.user.id)
			if (error) throw error
			setSessionSets((prev) => ({
				...prev,
				[row.session_id ?? openSession]: (prev[row.session_id ?? openSession] ?? []).map((x) => (x.id === row.id ? { ...x, weight_kg: w, reps: r } : x)),
			}))
			setEditingSet(null)
			setSetMsg('Peso actualizado ✓')
		} catch (err) {
			setSetMsg(`No se pudo actualizar: ${friendlyError(err)}`)
		}
	}

	useEffect(() => {
		if (restLeft <= 0) return
		const t = setTimeout(() => setRestLeft((v) => Math.max(0, v - 1)), 1000)
		return () => clearTimeout(t)
	}, [restLeft])

	const fetchSb = useCallback(async () => {
		if (!session?.user?.id) return
		setSbLoading(true)
		try {
			const { data: routines } = await supabase.from('routines').select('id, name').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
			if (routines) setSbRoutines(routines)
			const { data: sessions } = await supabase.from('workout_sessions').select('id, routine_id, started_at, ended_at').eq('user_id', session.user.id).order('started_at', { ascending: false }).limit(20)
			if (sessions) setSbSessions(sessions)
		} catch {
			// silencioso: las vistas muestran estado vacío
		} finally {
			setSbLoading(false)
		}
	}, [session?.user?.id])

	useEffect(() => {
		fetchSb()
	}, [fetchSb, currentView])

	// Al abrir un día: prepara sus filas en la base de datos y trae el último peso de cada ejercicio.
	useEffect(() => {
		if (!session?.user?.id || selectedDay == null) {
			setPlanIds(null)
			setLastW({})
			return
		}
		const workout = workoutDays.find((day) => day.id === selectedDay)
		if (!workout) return
		dayStartRef.current = new Date().toISOString()
		setSyncError('')
		let cancelled = false
		ensureDayRows(supabase, session.user.id, workout).then(async (ids) => {
			if (cancelled) return
			setPlanIds(ids)
			try {
				const map = await fetchLastWeights(supabase, session.user.id, Object.values(ids.byIndex))
				if (!cancelled) setLastW(map)
			} catch {
				// sin último peso: el modal queda vacío
			}
		}).catch((err) => {
			if (!cancelled) setSyncError(friendlyError(err))
		})
		return () => { cancelled = true }
	}, [session?.user?.id, selectedDay])

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
		})
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
		})
		return () => subscription.unsubscribe()
	}, [])

	// Al marcar todo: guarda el día en tu historial + banner + auto-reset
	useEffect(() => {
		if (!selectedWorkout || !allDone) return
		setDayComplete(true)
		const wid = selectedWorkout.id
		const dayWeights = weights[wid] ?? {}
		const sig = `${wid}:${JSON.stringify(dayWeights)}`
		if (saveSigRef.current !== sig) {
			saveSigRef.current = sig
			if (!planIds?.routineId) {
				setSaveStatus({ state: 'error', msg: syncError || 'no se pudo preparar el guardado' })
			} else {
				setSaveStatus({ state: 'saving', msg: '' })
				saveDaySession(supabase, session.user.id, planIds.routineId, planIds.byIndex, dayWeights, dayStartRef.current).then(() => {
					setSaveStatus({ state: 'saved', msg: '' })
					fetchSb()
				}).catch((err) => {
					saveSigRef.current = null
					setSaveStatus({ state: 'error', msg: friendlyError(err) })
				})
			}
		}
		const t = setTimeout(() => {
			resetDay(wid)
		}, 6000)
		return () => clearTimeout(t)
	}, [allDone, selectedWorkout, weights, planIds, syncError, session?.user?.id, fetchSb, resetDay])

	// El descanso es global: no se corta al cambiar de pantalla.
	// Solo se limpia al omitir, reiniciar el día o completar el día.
	useEffect(() => {
		setExpandedKey(null)
		setDayComplete(false)
	}, [selectedDay])

	if (!session) {
		return (
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-10 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
				<BackgroundOrbs />
				<div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
					<div className="glass-card w-full max-w-sm rounded-2xl p-8 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-xl font-black text-white">T</div>
						<h1 className="mt-4 text-3xl font-black tracking-tight">TempoLift</h1>
						<p className="mt-2 text-sm leading-relaxed text-zinc-400">Inicia sesión para ver tu plan semanal de fuerza.</p>
						<button
							type="button"
							onClick={signInWithGoogle}
							className="glass-card mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 text-sm font-bold text-white transition hover:border-red-500/60"
						>
							<span aria-hidden="true">G</span>
							<span>Continuar con Google</span>
						</button>
						<p className="mt-4 text-xs uppercase tracking-widest text-zinc-600">Tempo 3-1-1 · 5 días</p>
					</div>
				</div>
			</main>
		)
	}

	if (trainRoutineId) {
		return (
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
				<BackgroundOrbs />
				<header className="relative z-10 flex items-center justify-between py-6">
					<button type="button" onClick={() => setTrainRoutineId(null)} className="back-btn flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400" aria-label="Volver">
						<span className="text-2xl leading-none text-red-500">‹</span> Rutinas
					</button>
					<ThemeToggle theme={theme} onToggle={toggleTheme} />
				</header>
				<div className="relative z-10">
					<ActiveWorkout user={session.user} routineId={trainRoutineId} onFinish={() => { setTrainRoutineId(null); setCurrentView('history') }} />
				</div>
				{isResting && (
					<RestPill label={restLabel} seconds={restLeft} onReturn={returnToTraining} />
				)}
				<BottomNav value={currentView} onChange={handleNav} />
			</main>
		)
	}

	if (selectedWorkout) {
		return (
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`}>
				<BackgroundOrbs />
				<header className="relative z-10 flex items-center justify-between py-6">
					<button type="button" onClick={goBack} className="back-btn flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400" aria-label="Volver a los días">
						<span className="text-2xl leading-none text-red-500">‹</span> Días
					</button>
					<div className="flex items-center gap-2">
						<button type="button" onClick={signOut} className="flex min-h-10 items-center rounded-xl border border-white/10 px-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition hover:border-white/25 hover:text-zinc-300">
							Cerrar sesión
						</button>
						<ThemeToggle theme={theme} onToggle={toggleTheme} />
					</div>
				</header>
				<div className="relative z-10 mb-6">
					<p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-red-500">Día {selectedWorkout.id} / 5</p>
					<h1 className="text-4xl font-black tracking-tight">{selectedWorkout.name}</h1>
					<p className="mt-2 text-lg text-zinc-400">{selectedWorkout.focus}</p>
				</div>

				{/* Progreso fijo arriba al hacer scroll */}
				<div className="glass-card sticky top-2 z-20 mb-5 rounded-2xl p-4" style={{ backgroundColor: 'rgba(11,13,12,0.92)' }}>
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="font-bold uppercase tracking-widest text-zinc-400">Progreso del día</span>
						<strong className="text-red-500">{doneCount}/{totalExercises}</strong>
					</div>
					<div className="progress-track" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={totalExercises} aria-label="Progreso del día">
						<div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
					</div>
					<p className="mt-2 text-xs text-zinc-500">
						{allDone ? '¡Día completado! Reiniciando…' : doneCount === 0 ? 'Toca cada casilla y anota el peso: serie 1, descanso, serie 2' : `${totalExercises - doneCount} por completar`}
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
							<strong>¡Día terminado! 🎉</strong>
							<p>{saveStatus.state === 'saved' ? 'Guardado en tu historial ✓' : saveStatus.state === 'saving' ? 'Guardando en tu historial…' : saveStatus.state === 'error' ? `No se pudo guardar: ${saveStatus.msg}` : 'Todos los checks se reiniciarán solos, sin recargar la página.'}</p>
						</div>
						<button type="button" className="complete-btn" onClick={() => resetDay(selectedWorkout.id)}>Reiniciar ahora</button>
					</div>
				)}

				<div className="routine-card glass-card relative z-10 rounded-2xl px-5">
					<Phase phase={globalPhases.warmup} open={openPhase === 'warmup'} onToggle={() => togglePhase('warmup')}>
						<div className="glass-inset rounded-xl p-4 text-base text-zinc-300">{globalPhases.warmup.notes}</div>
					</Phase>
					<Phase phase={{ title: 'Fuerza', label: 'Fase 2', detail: `${selectedWorkout.exercises.length} ejercicios · toca para ver animación` }} open={openPhase === 'strength'} onToggle={() => togglePhase('strength')}>
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
										blocked={isResting || weightModal != null}
										lastWeight={prev?.weight_kg}
										onToggle={() => handleToggleCheck(selectedWorkout.id, index, name, reps)}
										expanded={expandedKey === key}
										onExpand={() => toggleExpand(key)}
										bundle={getExerciseBundle(name)}
									/>
								)
							})}
						</div>
					</Phase>
					<Phase phase={globalPhases.cardio} open={openPhase === 'cardio'} onToggle={() => togglePhase('cardio')}>
						<div className="glass-inset rounded-xl p-4 text-base text-zinc-300">{globalPhases.cardio.notes}</div>
					</Phase>
				</div>
				<p className="relative z-10 mt-6 text-center text-xs uppercase tracking-widest text-zinc-600">Escucha tu cuerpo · Mantén el control</p>
				{weightModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" role="dialog" aria-modal="true" aria-label={`Anotar serie ${weightModal.setNumber}`}>
						<div className="glass-card w-full max-w-sm rounded-2xl p-5">
							<h3 className="text-lg font-black text-white">{weightModal.name} · Serie {weightModal.setNumber}/2</h3>
							<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Se guardará en tu historial</p>
							<form onSubmit={confirmWeightModal} className="mt-4 flex flex-col gap-3">
								<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
									Peso (lb)
									<input
										type="number"
										min="0"
										step="0.5"
										value={weightInput}
										onChange={(e) => setWeightInput(e.target.value)}
										placeholder="ej. 135"
										autoFocus
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
								{setError && (
									<p className="text-sm text-red-400">{setError}</p>
								)}
								<div className="flex gap-2">
									<button
										type="button"
										onClick={closeWeightModal}
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
				)}
				<BottomNav value={currentView} onChange={handleNav} />
			</main>
		)
	}

	if (currentView !== 'home') {
		return (
			<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
				<BackgroundOrbs />
				<header className="relative z-10 flex items-center justify-between py-6">
					<div className="flex items-center gap-3">
						<div className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
						<span className="text-lg font-black tracking-tight">TempoLift</span>
					</div>
					<ThemeToggle theme={theme} onToggle={toggleTheme} />
				</header>
				<div className="relative z-10">
					{currentView === 'history' && (
						<section className="glass-card rounded-2xl p-5">
							<h1 className="text-2xl font-black">Historial</h1>
							<p className="mt-1 text-sm text-zinc-400">{sbLoading ? 'Cargando…' : sbSessions.length === 0 ? '0 entrenamientos' : `${sbSessions.length} ${sbSessions.length === 1 ? 'entrenamiento' : 'entrenamientos'}`}</p>
							<div className="mt-4 flex flex-col gap-2">
								{sbSessions.length === 0 && !sbLoading && (
									<p className="text-sm text-zinc-500">Aún no tienes entrenamientos. Completa tu primera rutina para verla aquí.</p>
								)}
								{sbSessions.map((s) => {
									const routineName = sbRoutines.find((r) => r.id === s.routine_id)?.name
									const open = openSession === s.id
									const rows = sessionSets[s.id] ?? []
									return (
										<div key={s.id} className="glass-inset rounded-xl px-4 py-3">
											<button type="button" onClick={() => toggleSession(s)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
												<span>
													<span className="block text-sm font-bold text-white">{routineName ?? 'Entrenamiento'}</span>
													<span className="mt-1 block text-xs text-zinc-500">{new Date(s.started_at).toLocaleString()} · {s.ended_at ? 'Terminada' : 'En curso'}</span>
												</span>
												<span className="text-xl text-zinc-500">{open ? '▾' : '▸'}</span>
											</button>
											{open && (
												<div className="mt-3 border-t border-white/10 pt-3">
													{setsLoading && rows.length === 0 ? (
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
																			<div className="flex gap-2">
																				<input
																					type="number"
																					min="0"
																					step="0.5"
																					value={editWeight}
																					onChange={(e) => setEditWeight(e.target.value)}
																					placeholder="lb"
																					aria-label="Peso en libras"
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
																			<p className="text-sm text-zinc-300">{row.exercises?.name ?? 'Ejercicio'} · S{row.set_number} — <strong className="text-white">{row.weight_kg} lb × {row.reps}</strong></p>
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
							{sbRoutines.length > 0 && (
								<div className="mt-4">
									<p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Tus rutinas</p>
									{sbRoutines.map((r) => (
										<button key={r.id} type="button" onClick={() => setTrainRoutineId(r.id)} className="glass-inset mb-2 w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-white transition hover:border-red-500/60">
											{r.name} → Entrenar
										</button>
									))}
								</div>
							)}
						</section>
					)}
					{currentView === 'profile' && (
						<section className="glass-card rounded-2xl p-5 text-center">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl">○</div>
							<h1 className="mt-3 text-xl font-black">Perfil</h1>
							<p className="mt-1 break-all text-sm text-zinc-400">{session.user?.email ?? session.user?.id}</p>
							<button type="button" onClick={signOut} className="mt-4 min-h-12 w-full rounded-xl border border-white/10 px-4 text-sm font-bold uppercase tracking-widest text-zinc-300 transition hover:border-white/25">
								Cerrar sesión
							</button>
						</section>
					)}
				</div>
				{isResting && (
					<RestPill label={restLabel} seconds={restLeft} onReturn={returnToTraining} />
				)}
				<BottomNav value={currentView} onChange={handleNav} />
			</main>
		)
	}

	return (
		<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-4xl overflow-hidden px-5 pb-28 text-white`}>
			<BackgroundOrbs />
			<header className="relative z-10 flex items-center justify-between py-6">
				<div className="flex items-center gap-3">
					<div className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-black text-white">T</div>
					<span className="text-lg font-black tracking-tight">TempoLift</span>
				</div>
				<div className="flex items-center gap-2">
					<button type="button" onClick={signOut} className="flex min-h-10 items-center rounded-xl border border-white/10 px-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition hover:border-white/25 hover:text-zinc-300">
						Cerrar sesión
					</button>
					<ThemeToggle theme={theme} onToggle={toggleTheme} />
				</div>
			</header>
			<section className="relative z-10 pb-8 pt-8">
				<p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-red-500">Tu plan de hoy</p>
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
					<div>
						<h1 className="hero-title max-w-xs text-5xl font-black leading-[0.95] tracking-tight">Tu semana.</h1>
						<p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">Visualiza tu entrenamiento y llega preparado a cada sesión.</p>
					</div>
					<div className="glass-card flex w-fit self-start rounded-xl p-1" role="tablist" aria-label="Vista del calendario">
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
			<section key={calendarView} className="view-switch glass-card relative z-10 overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
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
							const done = Object.values(seriesByDay[day.id] ?? {}).filter((v) => v === 2).length
							return (
								<button key={entry.day} type="button" onClick={() => selectDay(day.id)} className="calendar-item group flex min-h-24 w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5">
									<span className="flex items-center gap-4">
										<span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#0b0d0c] ${day.accent}`}>{entry.day}</span>
										<span>
											<strong className="block text-lg font-black text-white">{day.name}</strong>
											<span className="mt-1 block text-sm text-zinc-500">{day.focus} · {done}/{day.exercises.length} ✓</span>
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
									<button key={entry.day} type="button" onClick={() => selectDay(day.id)} className="calendar-item glass-cell group min-h-44 rounded-xl border border-white/10 p-3 text-left transition hover:-translate-y-1 hover:border-red-500/60 hover:bg-white/10">
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
			<section className="glass-card relative z-10 mt-6 rounded-2xl p-5">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="mt-1 text-xl font-black text-white">Tus rutinas</h2>
					</div>
					<span className="text-xs font-bold uppercase tracking-widest text-red-500">{sbLoading ? '…' : `${sbRoutines.length}`}</span>
				</div>
				{sbRoutines.length === 0 && !sbLoading && (
					<p className="mt-3 text-sm text-zinc-500">Aún no tienes rutinas guardadas.</p>
				)}
				<div className="mt-4 flex flex-col gap-2">
					{sbRoutines.map((r) => (
						<button key={r.id} type="button" onClick={() => setTrainRoutineId(r.id)} className="glass-inset flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-bold text-white transition hover:border-red-500/60">
							<span>{r.name}</span>
							<span className="text-red-500">→</span>
						</button>
					))}
				</div>
			</section>
			<footer className="relative z-10 mt-12 flex items-center justify-between border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-widest text-zinc-600">
				<span>Plan de 5 días</span>
				<span>Fuerza + cardio</span>
			</footer>
			{isResting && (
				<RestPill label={restLabel} seconds={restLeft} onReturn={returnToTraining} />
			)}
			<BottomNav value={currentView} onChange={handleNav} />
		</main>
	)
}

export default App
