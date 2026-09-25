import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { BootSkeleton } from './components/Skeleton.jsx'
import { useDelayedVisible } from './hooks/useDelayedVisible.js'
import { ensureDayRows, fetchExerciseIdsByNames, fetchLastWeights, fetchRecentLogs, fetchUserExerciseNames, saveDaySession } from './services/planSync.js'
import {
	DEFAULT_WEEK_MAP, DEFAULT_BODY_KG, DEFAULT_CARDIO_MIN, DEFAULT_WARMUP_MIN,
	ROUTINES_BY_GOAL, WARMUP_MET, LB_TO_KG, KCAL_PER_KG_MOVED,
	workoutDays, weekSchedule,
	buildWeekMapForGoal, readWeekMap, persistWeekMap,
	readWeekGoal, persistWeekGoal, weightHintFor, EXERCISE_RENAMES,
} from './data/plan.js'
import { readWeightUnit, persistWeightUnit, displayWeight, displayToLb, convertInputUnit, bodyKgToDisplay, displayToBodyKg } from './lib/weights.js'
import { readTheme, persistTheme, readProfileLocal, persistProfileLocal, readBodyKg, readBodyKgFor, isProfileComplete } from './lib/profile.js'
import { friendlyError, markProfilesChecked, isProfilesTableMissing, upsertProfile } from './lib/supabaseErrors.js'
import { strengthKcalFromWeights, cardioKcalFor, parseSessionExtras } from './lib/health.js'
import { readActiveWorkout, persistActiveWorkout, clearActiveWorkout, hasNonEmptyValue, hasOtherDayProgress } from './lib/draft.js'
import { trainingWeekStart, readDoneJournal, appendDoneJournal, removeDoneJournalByName, clearDoneJournal } from './lib/weekly.js'
import { useAuth } from './hooks/useAuth.js'
import { useRestTimer } from './hooks/useRestTimer.js'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import DayPage from './pages/DayPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

function App() {
	const { session, authChecking, signInWithGoogle, signOut } = useAuth()
	const { restLeft, restLabel, restSeries, isResting, startRest, skipRest } = useRestTimer(session?.user?.id)
	const [selectedDay, setSelectedDay] = useState(null)
	// Contenido de la semana (rutina/descanso por día, Lun..Dom fijos).
	// Solo lista. Clave antigua `tempolift-week-order-*` ignorada a propósito:
	// el modelo cambió de "mover días" a "mover contenidos".
	const [weekMap, setWeekMap] = useState(() => readWeekMap(null) ?? DEFAULT_WEEK_MAP.map((s) => ({ ...s })))
	// Meta semanal de sesiones de este usuario (1 a 7).
	const [weekGoal, setWeekGoal] = useState(() => readWeekGoal(null))
	const [editingWeek, setEditingWeek] = useState(false)
	const [theme, setTheme] = useState(() => readTheme())
	const [openPhase, setOpenPhase] = useState('strength')
	// Series por ejercicio: { [workoutId]: { [index]: 1 | 2 } }. Solo suma al progreso con las 2 series.
	// REGLA: una sola rutina activa. Los confirms limpian otros workoutIds
	// y el borrador persistido guarda un único workoutId (ver activeWorkout*).
	const [seriesByDay, setSeriesByDay] = useState({})
	const [expandedKey, setExpandedKey] = useState(null)
	const [dayComplete, setDayComplete] = useState(false)
	// Borrador hidratado para este uid (evita que el persist borre el caché
	// antes de restaurarlo al recargar/cambiar de cuenta).
	const [draftHydratedUid, setDraftHydratedUid] = useState(null)
	const [currentView, setCurrentView] = useState('home')
	// Un solo flujo de entreno: el plan semanal (selectedDay). El segundo flujo
	// paralelo ("Tus rutinas" → ActiveWorkout) se eliminó para que sea imposible
	// tener dos rutinas/sesiones activas a la vez y que cuenten doble.
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
	// Exportar / borrar todo el historial (sección Tus datos del perfil)
	const [dataMsg, setDataMsg] = useState('')
	const [confirmWipe, setConfirmWipe] = useState(false)
	const [lastDay, setLastDay] = useState(null)
	// Peso anotado por serie: { [workoutId]: { [index]: { 1: { weight, reps }, 2: { weight, reps } } } }
	const [weights, setWeights] = useState({})
	// Modal para anotar peso: { workoutId, index, name, setNumber, planReps } o null
	const [weightModal, setWeightModal] = useState(null)
	const [weightInput, setWeightInput] = useState('')
	const [repsInput, setRepsInput] = useState('')
	// Cardio (Fase 3): se marca una sola vez por día + minutos (+ kcal reales
	// de la máquina, opcionales: si se anotan reemplazan la estimación).
	const [cardioByDay, setCardioByDay] = useState({})
	const [cardioModal, setCardioModal] = useState(null)
	const [cardioInput, setCardioInput] = useState('')
	const [cardioMachineInput, setCardioMachineInput] = useState('')
	// Calentamiento (Fase 1): igual que el cardio, una sola marca + minutos
	const [warmupByDay, setWarmupByDay] = useState({})
	const [warmupModal, setWarmupModal] = useState(null)
	const [warmupInput, setWarmupInput] = useState('')
	const [warmupMachineInput, setWarmupMachineInput] = useState('')
	// Ejercicios extra del día: { [workoutId]: [{ id, name, targetSets, sets: [{weight, reps}] }] }.
	// Suman kcal e historial pero NO cambian el completado (cierra con cardio).
	const [customByDay, setCustomByDay] = useState({})
	const [customCreate, setCustomCreate] = useState(null) // { workoutId } o null
	const [customModal, setCustomModal] = useState(null) // { workoutId, customId } o null
	const [customName, setCustomName] = useState('')
	const [customWeight, setCustomWeight] = useState('')
	const [customReps, setCustomReps] = useState('')
	const [customSets, setCustomSets] = useState(2)
	const [customSetWeight, setCustomSetWeight] = useState('')
	const [customSetReps, setCustomSetReps] = useState('')
	const [dbExerciseNames, setDbExerciseNames] = useState([])
	const [dbNamesLoading, setDbNamesLoading] = useState(false)
	const [confirmCustomRemove, setConfirmCustomRemove] = useState(null)
	// Snackbar de avisos (errores de validación en modales). Auto-cierre.
	const [snack, setSnack] = useState(null)
	const snackTimer = useRef(null)
	const showSnack = useCallback((msg, tone = 'error') => {
		if (snackTimer.current) clearTimeout(snackTimer.current)
		setSnack({ msg, tone, key: Date.now() })
		snackTimer.current = setTimeout(() => setSnack(null), 3500)
	}, [])
	const closeSnack = useCallback(() => {
		if (snackTimer.current) clearTimeout(snackTimer.current)
		setSnack(null)
	}, [])
	// Unidad visible del peso (lb/kg). Todo se guarda en lb.
	const [weightUnit, setWeightUnit] = useState(() => readWeightUnit())
	// Peso corporal (kg) para estimar las kcal del cardio. Por usuario (perfil + local).
	const [bodyKg, setBodyKg] = useState(() => readBodyKg())
	// Perfil básico para stats + onboarding de cuentas nuevas
	const [profile, setProfile] = useState(null)
	const [profileLoading, setProfileLoading] = useState(false)
	const [showOnboarding, setShowOnboarding] = useState(false)
	const [onboarding, setOnboarding] = useState({ weight: '', height: '', age: '', sex: '' })
	const [onboardingError, setOnboardingError] = useState('')
	const [onboardingSaving, setOnboardingSaving] = useState(false)
	// Edición del perfil en Mi perfil (peso con lb/kg + altura/edad/sexo)
	const [profileForm, setProfileForm] = useState({ weight: '', height: '', age: '', sex: '' })
	const [profileMsg, setProfileMsg] = useState('')
	const [profileSaving, setProfileSaving] = useState(false)
	// Stats del perfil: agregados por sesión terminada
	const [statsLoading, setStatsLoading] = useState(false)
	const [statsRows, setStatsRows] = useState([])
	const [statsError, setStatsError] = useState('')
	// Mejor marca por ejercicio (para la lista de récords del perfil)
	const [exerciseRecords, setExerciseRecords] = useState([])
	const [showAllRecords, setShowAllRecords] = useState(false)
	// Vínculos del plan en la base de datos + último peso por ejercicio
	const [planIds, setPlanIds] = useState(null)
	const [lastW, setLastW] = useState({})
	// Últimas series por ejercicio, para el historial del acordeón
	const [recentW, setRecentW] = useState({})
	const [syncError, setSyncError] = useState('')
	// Estado del guardado del día: idle | saving | saved | error
	const [saveStatus, setSaveStatus] = useState({ state: 'idle', msg: '' })
	const saveSigRef = useRef(null)
	const dayStartRef = useRef(null)
	// A qué workoutId pertenece dayStartRef (evita mezclar inicios al
	// cambiar de día con un borrador activo de otro día).
	const dayStartDayRef = useRef(null)

	const selectedWorkout = workoutDays.find((day) => day.id === selectedDay) ?? null

	const seriesMap = selectedWorkout ? (seriesByDay[selectedWorkout.id] ?? {}) : {}
	const checkedList = Object.entries(seriesMap).filter(([, v]) => v === 2).map(([k]) => Number(k))
	// El cardio y el calentamiento cuentan como un ítem más del día (una sola marca cada uno).
	const cardioEntry = selectedWorkout ? cardioByDay[selectedWorkout.id] : null
	const cardioDone = Boolean(cardioEntry)
	const cardioMinutes = cardioEntry?.minutes ?? 0
	const cardioMachineKcal = cardioEntry?.machineKcal ?? null
	const warmupEntry = selectedWorkout ? warmupByDay[selectedWorkout.id] : null
	const warmupDone = Boolean(warmupEntry)
	const warmupMinutes = warmupEntry?.minutes ?? 0
	const warmupMachineKcal = warmupEntry?.machineKcal ?? null
	const dayWeights = selectedWorkout ? (weights[selectedWorkout.id] ?? {}) : {}
	// Extras del día: suman kcal e historial pero NO el completado.
	const dayCustoms = selectedWorkout ? (customByDay[selectedWorkout.id] ?? []) : []
	const customWeights = Object.fromEntries(dayCustoms.map((c) => [c.id, Object.fromEntries(c.sets.map((s, i) => [i + 1, { weight: s.weight, reps: s.reps }]))]))
	const { volumeKg: customVolumeKg, kcal: customKcal } = strengthKcalFromWeights(customWeights)
	const { volumeKg: planVolumeKg, kcal: planStrengthKcal } = strengthKcalFromWeights(dayWeights)
	const dayVolumeKg = planVolumeKg + customVolumeKg
	const dayStrengthKcal = planStrengthKcal + customKcal
	const customBlocked = isResting || weightModal != null || cardioModal != null || warmupModal != null || customCreate != null || customModal != null
	// Si el usuario anotó las calorías reales de la máquina, mandan sobre la estimación.
	const dayCardioKcal = cardioDone ? (cardioMachineKcal != null ? cardioMachineKcal : cardioKcalFor(cardioMinutes, bodyKg)) : 0
	const dayWarmupKcal = warmupDone ? (warmupMachineKcal != null ? warmupMachineKcal : WARMUP_MET * (Number(bodyKg) > 0 ? Number(bodyKg) : DEFAULT_BODY_KG) * (warmupMinutes / 60)) : 0
	const dayTotalKcal = dayStrengthKcal + dayCardioKcal + dayWarmupKcal
	const totalExercises = selectedWorkout ? selectedWorkout.exercises.length + 2 : 0
	const doneCount = checkedList.length + (cardioDone ? 1 : 0) + (warmupDone ? 1 : 0)
	const progress = totalExercises ? doneCount / totalExercises : 0
	const allDone = totalExercises > 0 && doneCount === totalExercises
	const missingLabels = [!warmupDone && 'calentamiento', !cardioDone && 'cardio'].filter(Boolean)

	// Skeletons con retardo mínimo: solo aparecen si la carga tarda (>150ms
	// en páginas, >100ms en series inline). El retardo NO retrasa los datos:
	// el contenido real se muestra en cuanto llega; solo evita flashear el
	// skeleton en cargas rápidas. Si ya hay datos se conservan
	// (stale-while-revalidate) y nunca se reemplazan por el skeleton.
	const bootVisible = useDelayedVisible(authChecking, 150)
	const historyHasData = sbSessions.some((s) => s.ended_at)
	const historyPending = sbLoading && !historyHasData
	const showHistorySkel = useDelayedVisible(historyPending, 150)
	const openRows = openSession ? (sessionSets[openSession] ?? []) : []
	const setsPending = setsLoading && openSession != null && openRows.length === 0
	const showSetsSkel = useDelayedVisible(setsPending, 100)
	const profilePending = (sbLoading || statsLoading) && statsRows.length === 0
	const showProfileSkel = useDelayedVisible(profilePending, 150)
	const dayPending = selectedDay != null && !planIds
	const showDaySkel = useDelayedVisible(dayPending, 150)

	const togglePhase = useCallback((phase) => {
		setOpenPhase((current) => (current === phase ? '' : phase))
	}, [])

	const toggleTheme = useCallback(() => {
		setTheme((current) => {
			const next = current === 'dark' ? 'light' : 'dark'
			persistTheme(next)
			return next
		})
	}, [])

	// Primer toque = anota peso (serie 1) + descanso. Segundo toque = anota peso (serie 2) + descanso. Tercer toque = desmarcar.
	const handleToggleCheck = (workoutId, index, exerciseName, planReps) => {
		if (restLeft > 0 || weightModal || cardioModal || warmupModal || customCreate || customModal) return
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
		// El modal abre vacío a propósito: sin peso ni reps por defecto para
		// no empujar al usuario a una marca (el último registro se muestra
		// como texto informativo y en el historial del ejercicio).
		setWeightInput('')
		setRepsInput('')
		setWeightModal({ workoutId, index, name: exerciseName ?? 'Ejercicio', setNumber, planReps })
	}

	// Cambia lb ↔ kg convirtiendo todo lo ya escrito (una sola vez por campo).
	// La preferencia persiste. Se convierten todos los inputs de peso visibles
	// u ocultos para que ninguno quede en la unidad vieja.
	const switchWeightUnit = (u) => {
		if (u === weightUnit) return
		const from = weightUnit
		setWeightInput((cur) => convertInputUnit(cur, from, u))
		setCustomWeight((cur) => convertInputUnit(cur, from, u))
		setCustomSetWeight((cur) => convertInputUnit(cur, from, u))
		setEditWeight((cur) => convertInputUnit(cur, from, u))
		setProfileForm((prev) => ({ ...prev, weight: convertInputUnit(prev.weight, from, u) }))
		setOnboarding((prev) => ({ ...prev, weight: convertInputUnit(prev.weight, from, u) }))
		setWeightUnit(u)
		persistWeightUnit(u)
	}

	const closeWeightModal = () => {
		setWeightModal(null)
		setWeightInput('')
		setRepsInput('')
	}

	const confirmWeightModal = (e) => {
		if (e) e.preventDefault()
		if (!weightModal) return
		// Los formularios llevan noValidate: el navegador no bloquea y el aviso
		// sale en el snackbar con estilo propio (incluida la regla del paso 0.5).
		const rawW = parseFloat(weightInput)
		const rawR = parseFloat(repsInput)
		if (!Number.isFinite(rawW) || rawW < 0) {
			showSnack(`Escribe un peso válido en ${weightUnit} (0 o más)`)
			return
		}
		if (Math.abs(rawW * 2 - Math.round(rawW * 2)) > 1e-9) {
			showSnack(`El peso va de 0.5 en 0.5 ${weightUnit} (ej. ${weightHintFor(weightModal.name, weightUnit)})`)
			return
		}
		if (!Number.isFinite(rawR) || rawR < 0 || Math.abs(rawR - Math.round(rawR)) > 1e-9) {
			showSnack('Escribe repeticiones enteras (0 o más)')
			return
		}
		const wLb = displayToLb(weightInput, weightUnit)
		const r = parseInt(repsInput, 10)
		const w = Math.round(wLb * 100) / 100
		const { workoutId, index, name, setNumber } = weightModal
		// UNA sola rutina activa: si había progreso en otro día, se limpia
		// y se avisa. Así es imposible tener checks de dos días a la vez.
		const switching = hasOtherDayProgress(seriesByDay, weights, cardioByDay, warmupByDay, workoutId, customByDay)
		if (switching) {
			showSnack('Solo puedes tener una rutina activa: se limpió el progreso del otro día', 'warn')
		}
		setSeriesByDay((prev) => {
			const next = { ...(prev[workoutId] ?? {}), [index]: setNumber }
			return switching ? { [workoutId]: next } : { ...prev, [workoutId]: next }
		})
		setWeights((prev) => {
			const next = { ...(prev[workoutId] ?? {}), [index]: { ...(prev[workoutId]?.[index] ?? {}), [setNumber]: { weight: w, reps: r } } }
			return switching ? { [workoutId]: next } : { ...prev, [workoutId]: next }
		})
		if (switching) {
			setCardioByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			setWarmupByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			setCustomByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			saveSigRef.current = null
		}
		if (dayStartDayRef.current !== workoutId || !dayStartRef.current) {
			dayStartRef.current = new Date().toISOString()
			dayStartDayRef.current = workoutId
		}
		setLastDay(workoutId)
		setDayComplete(false)
		setWeightModal(null)
		setWeightInput('')
		setRepsInput('')
		startRest(name, setNumber)
	}

	const resetDay = useCallback((workoutId) => {
		setSeriesByDay((prev) => ({ ...prev, [workoutId]: {} }))
		setWeights((prev) => ({ ...prev, [workoutId]: {} }))
		setCardioByDay((prev) => {
			const next = { ...prev }
			delete next[workoutId]
			return next
		})
		setWarmupByDay((prev) => {
			const next = { ...prev }
			delete next[workoutId]
			return next
		})
		setCustomByDay((prev) => {
			const next = { ...prev }
			delete next[workoutId]
			return next
		})
		setCustomCreate(null)
		setCustomModal(null)
		setCustomName('')
		setCustomWeight('')
		setCustomReps('')
		setCustomSets(2)
		setCustomSetWeight('')
		setCustomSetReps('')
		setConfirmCustomRemove(null)
		setCardioModal(null)
		setCardioInput('')
		setCardioMachineInput('')
		setWarmupModal(null)
		setWarmupInput('')
		setWarmupMachineInput('')
		setDayComplete(false)
		setExpandedKey(null)
		skipRest()
		setSaveStatus({ state: 'idle', msg: '' })
		saveSigRef.current = null
		if (dayStartDayRef.current == null || Number(dayStartDayRef.current) === Number(workoutId)) {
			dayStartRef.current = null
			dayStartDayRef.current = null
		}
	}, [skipRest])

	// Guarda el peso corporal (kg): memoria + perfil + local por usuario + Supabase.
	// No bloquea la UI si la tabla profiles aún no existe.
	const persistBodyKg = (kg, extraPatch) => {
		const v = Number(kg)
		if (!Number.isFinite(v) || v <= 0 || v >= 500) return
		const rounded = Math.round(v * 10) / 10
		setBodyKg(rounded)
		const uid = session?.user?.id
		const nextProfile = { ...(profile ?? {}), ...(extraPatch ?? {}), weight_kg: rounded, updated_at: new Date().toISOString() }
		setProfile(nextProfile)
		persistProfileLocal(uid, nextProfile)
		try {
			localStorage.setItem('tempolift-body-kg', String(rounded))
		} catch {
			// sin localStorage: el valor vive solo en memoria
		}
		upsertProfile(uid, { user_id: uid, weight_kg: rounded, updated_at: new Date().toISOString() })
	}

	// Cardio: un solo check por día. Abrir = pedir minutos (+ kcal reales
	// de la máquina, opcionales). El peso se toma del perfil del usuario.
	// Se puede marcar aunque haya descanso activo (es otra fase).
	const openCardio = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		const prev = cardioByDay[selectedWorkout.id]
		setCardioInput(prev ? String(prev.minutes) : String(DEFAULT_CARDIO_MIN))
		setCardioMachineInput(prev?.machineKcal != null ? String(prev.machineKcal) : '')
		setCardioModal({ workoutId: selectedWorkout.id })
	}

	const closeCardioModal = () => {
		setCardioModal(null)
		setCardioInput('')
		setCardioMachineInput('')
	}

	// Las kcal de la máquina son opcionales (0 a 5000, enteras). Si se anotan,
	// reemplazan la estimación en el total del día y en el historial.
	function parseMachineKcal(raw) {
		if (raw === '' || raw == null) return null
		const v = parseFloat(raw)
		if (!Number.isFinite(v) || v < 0 || v > 5000 || Math.abs(v - Math.round(v)) > 1e-9) return NaN
		return Math.round(v)
	}

	const confirmCardio = (e) => {
		if (e) e.preventDefault()
		if (!cardioModal) return
		const m = parseFloat(cardioInput)
		if (!Number.isFinite(m) || m <= 0 || m > 180 || Math.abs(m - Math.round(m)) > 1e-9) {
			showSnack('Escribe los minutos en enteros (1 a 180)')
			return
		}
		const machine = parseMachineKcal(cardioMachineInput)
		if (Number.isNaN(machine)) {
			showSnack('Calorías de la máquina inválidas (enteras, 0 a 5000, o vacío)')
			return
		}
		const { workoutId } = cardioModal
		const switching = hasOtherDayProgress(seriesByDay, weights, cardioByDay, warmupByDay, workoutId, customByDay)
		if (switching) {
			showSnack('Solo puedes tener una rutina activa: se limpió el progreso del otro día', 'warn')
			setSeriesByDay({ [workoutId]: {} })
			setWeights({ [workoutId]: {} })
			setWarmupByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			setCustomByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			saveSigRef.current = null
		}
		setCardioByDay({ [workoutId]: { minutes: m, machineKcal: machine } })
		if (dayStartDayRef.current !== workoutId || !dayStartRef.current) {
			dayStartRef.current = new Date().toISOString()
			dayStartDayRef.current = workoutId
		}
		setLastDay(workoutId)
		setDayComplete(false)
		setCardioModal(null)
		setCardioInput('')
		setCardioMachineInput('')
	}

	const unmarkCardio = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		setDayComplete(false)
		setCardioByDay((prev) => {
			const next = { ...prev }
			delete next[selectedWorkout.id]
			return next
		})
	}

	// Calentamiento: igual que el cardio, una sola marca + minutos + peso.
	const openWarmup = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		const prev = warmupByDay[selectedWorkout.id]
		setWarmupInput(prev ? String(prev.minutes) : String(DEFAULT_WARMUP_MIN))
		setWarmupMachineInput(prev?.machineKcal != null ? String(prev.machineKcal) : '')
		setWarmupModal({ workoutId: selectedWorkout.id })
	}

	const closeWarmupModal = () => {
		setWarmupModal(null)
		setWarmupInput('')
		setWarmupMachineInput('')
	}

	const confirmWarmup = (e) => {
		if (e) e.preventDefault()
		if (!warmupModal) return
		const m = parseFloat(warmupInput)
		if (!Number.isFinite(m) || m <= 0 || m > 60 || Math.abs(m - Math.round(m)) > 1e-9) {
			showSnack('Escribe los minutos en enteros (1 a 60)')
			return
		}
		const machine = parseMachineKcal(warmupMachineInput)
		if (Number.isNaN(machine)) {
			showSnack('Calorías de la máquina inválidas (enteras, 0 a 5000, o vacío)')
			return
		}
		const { workoutId } = warmupModal
		const switching = hasOtherDayProgress(seriesByDay, weights, cardioByDay, warmupByDay, workoutId, customByDay)
		if (switching) {
			showSnack('Solo puedes tener una rutina activa: se limpió el progreso del otro día', 'warn')
			setSeriesByDay({ [workoutId]: {} })
			setWeights({ [workoutId]: {} })
			setCardioByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			setCustomByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			saveSigRef.current = null
		}
		setWarmupByDay({ [workoutId]: { minutes: m, machineKcal: machine } })
		if (dayStartDayRef.current !== workoutId || !dayStartRef.current) {
			dayStartRef.current = new Date().toISOString()
			dayStartDayRef.current = workoutId
		}
		setLastDay(workoutId)
		setDayComplete(false)
		setWarmupModal(null)
		setWarmupInput('')
		setWarmupMachineInput('')
	}

	const unmarkWarmup = () => {
		if (!selectedWorkout || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		setDayComplete(false)
		setWarmupByDay((prev) => {
			const next = { ...prev }
			delete next[selectedWorkout.id]
			return next
		})
	}

	const customId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

	// Abrir "Agregar ejercicio": trae los ejercicios de la BD del usuario
	// para el combobox (más texto libre para estrenar).
	const openCustomCreate = () => {
		if (!selectedWorkout || restLeft > 0 || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		setCustomName('')
		setCustomWeight('')
		setCustomReps('')
		setCustomSets(2)
		setCustomCreate({ workoutId: selectedWorkout.id })
		setDbExerciseNames([])
		setDbNamesLoading(true)
		const uid = session?.user?.id
		if (!uid) {
			setDbNamesLoading(false)
			return
		}
		fetchUserExerciseNames(supabase, uid).then((names) => {
			setDbExerciseNames(names ?? [])
		}).catch(() => {
			// sin conexión: igual se puede escribir libre
		}).finally(() => {
			setDbNamesLoading(false)
		})
	}

	const closeCustomCreate = () => {
		setCustomCreate(null)
		setCustomName('')
		setCustomWeight('')
		setCustomReps('')
		setCustomSets(2)
	}

	const confirmCustomCreate = (e) => {
		if (e) e.preventDefault()
		if (!customCreate) return
		const name = customName.trim()
		if (!name) {
			showSnack('Escribe o elige el nombre del ejercicio')
			return
		}
		const rawW = parseFloat(customWeight)
		const rawR = parseFloat(customReps)
		if (!Number.isFinite(rawW) || rawW < 0) {
			showSnack(`Escribe un peso válido en ${weightUnit} (0 o más)`)
			return
		}
		if (Math.abs(rawW * 2 - Math.round(rawW * 2)) > 1e-9) {
			showSnack(`El peso va de 0.5 en 0.5 ${weightUnit}`)
			return
		}
		if (!Number.isFinite(rawR) || rawR < 0 || Math.abs(rawR - Math.round(rawR)) > 1e-9) {
			showSnack('Escribe repeticiones enteras (0 o más)')
			return
		}
		const sets = Math.min(4, Math.max(1, parseInt(customSets, 10) || 2))
		const { workoutId } = customCreate
		const exists = (customByDay[workoutId] ?? []).some((c) => c.name.trim().toLowerCase() === name.toLowerCase())
		if (exists) {
			showSnack('Ya agregaste ese ejercicio hoy: márcale sus series')
			return
		}
		// UNA sola rutina activa (igual que el plan).
		const switching = hasOtherDayProgress(seriesByDay, weights, cardioByDay, warmupByDay, workoutId, customByDay)
		if (switching) {
			showSnack('Solo puedes tener una rutina activa: se limpió el progreso del otro día', 'warn')
			setSeriesByDay({ [workoutId]: {} })
			setWeights({ [workoutId]: {} })
			setCardioByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			setWarmupByDay((prev) => (prev[workoutId] ? { [workoutId]: prev[workoutId] } : {}))
			saveSigRef.current = null
		}
		const wLb = displayToLb(customWeight, weightUnit)
		const entry = {
			id: customId(),
			name,
			targetSets: sets,
			sets: [{ weight: Math.round(wLb * 100) / 100, reps: parseInt(customReps, 10) }],
		}
		setCustomByDay((prev) => {
			const list = [...(prev[workoutId] ?? []), entry]
			return switching ? { [workoutId]: list } : { ...prev, [workoutId]: list }
		})
		if (dayStartDayRef.current !== workoutId || !dayStartRef.current) {
			dayStartRef.current = new Date().toISOString()
			dayStartDayRef.current = workoutId
		}
		setLastDay(workoutId)
		setCustomCreate(null)
		setCustomName('')
		setCustomWeight('')
		setCustomReps('')
		setCustomSets(2)
		startRest(name, 1)
	}

	// Abrir modal de la siguiente serie de un extra (ya no pide el nombre).
	const openCustomLog = (workoutId, customIdValue) => {
		if (restLeft > 0 || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		const custom = (customByDay[workoutId] ?? []).find((c) => c.id === customIdValue)
		if (!custom || custom.sets.length >= custom.targetSets) return
		setCustomSetWeight('')
		setCustomSetReps('')
		setCustomModal({ workoutId, customId: custom.id })
	}

	const closeCustomLog = () => {
		setCustomModal(null)
		setCustomSetWeight('')
		setCustomSetReps('')
	}

	const confirmCustomLog = (e) => {
		if (e) e.preventDefault()
		if (!customModal) return
		const rawW = parseFloat(customSetWeight)
		const rawR = parseFloat(customSetReps)
		if (!Number.isFinite(rawW) || rawW < 0) {
			showSnack(`Escribe un peso válido en ${weightUnit} (0 o más)`)
			return
		}
		if (Math.abs(rawW * 2 - Math.round(rawW * 2)) > 1e-9) {
			showSnack(`El peso va de 0.5 en 0.5 ${weightUnit}`)
			return
		}
		if (!Number.isFinite(rawR) || rawR < 0 || Math.abs(rawR - Math.round(rawR)) > 1e-9) {
			showSnack('Escribe repeticiones enteras (0 o más)')
			return
		}
		const { workoutId, customId: cid } = customModal
		const wLb = displayToLb(customSetWeight, weightUnit)
		const entry = { weight: Math.round(wLb * 100) / 100, reps: parseInt(customSetReps, 10) }
		const custom = (customByDay[workoutId] ?? []).find((c) => c.id === cid)
		if (!custom || custom.sets.length >= custom.targetSets) {
			setCustomModal(null)
			return
		}
		setCustomByDay((prev) => ({
			...prev,
			[workoutId]: (prev[workoutId] ?? []).map((c) => (c.id === cid ? { ...c, sets: [...c.sets, entry] } : c)),
		}))
		setLastDay(workoutId)
		setCustomModal(null)
		setCustomSetWeight('')
		setCustomSetReps('')
		startRest(custom?.name ?? 'Extra', 2)
	}

	// Tercer toque del extra completado: vacía sus series (conserva la definición).
	const unmarkCustom = (workoutId, customIdValue) => {
		if (restLeft > 0 || weightModal || cardioModal || warmupModal || customCreate || customModal) return
		setCustomByDay((prev) => ({
			...prev,
			[workoutId]: (prev[workoutId] ?? []).map((c) => (c.id === customIdValue ? { ...c, sets: [] } : c)),
		}))
	}

	// Quitar extra en 2 toques (mismo patrón que borrar sesión).
	const removeCustom = (workoutId, customIdValue) => {
		if (confirmCustomRemove !== customIdValue) {
			setConfirmCustomRemove(customIdValue)
			return
		}
		setConfirmCustomRemove(null)
		setCustomByDay((prev) => ({
			...prev,
			[workoutId]: (prev[workoutId] ?? []).filter((c) => c.id !== customIdValue),
		}))
	}

	const handleBodyKg = (raw) => {
		const v = parseFloat(raw)
		if (Number.isFinite(v) && v > 0 && v < 500) {
			persistBodyKg(v)
		}
	}

	const toggleExpand = useCallback((key) => {
		setExpandedKey((cur) => (cur === key ? null : key))
	}, [])

	const selectDay = useCallback((id) => {
		setSelectedDay(id)
		setLastDay(id)
		setEditingWeek(false)
	}, [])
	const goBack = useCallback(() => setSelectedDay(null), [])
	const returnToTraining = useCallback(() => {
		if (lastDay != null) setSelectedDay(lastDay)
		setCurrentView('home')
	}, [lastDay])
	const handleNav = useCallback((view) => {
		setCurrentView(view)
		setSelectedDay(null)
		setOpenSession(null)
		setEditingSet(null)
		setSetMsg('')
		setConfirmDelete(null)
		setCardioModal(null)
		setWarmupModal(null)
		setEditingWeek(false)
		setDataMsg('')
		setConfirmWipe(false)
	}, [])

	// Mueve el CONTENIDO de un día (rutina o descanso) al día vecino,
	// intercambiándolos. Los días Lun..Dom nunca cambian de sitio.
	// Guarda el mapa para este usuario.
	const moveWeekDay = useCallback((from, dir) => {
		const to = from + dir
		setWeekMap((prev) => {
			if (to < 0 || to >= prev.length) return prev
			const next = prev.map((s) => ({ ...s }))
			const tmp = next[from]
			next[from] = next[to]
			next[to] = tmp
			persistWeekMap(session?.user?.id, next)
			return next
		})
	}, [session?.user?.id])

	const resetWeekOrder = useCallback(() => {
		const next = DEFAULT_WEEK_MAP.map((s) => ({ ...s }))
		setWeekMap(next)
		persistWeekMap(session?.user?.id, next)
	}, [session?.user?.id])

	// Semana de entreno en curso + bloqueos semanales (una rutina por semana).
	// weekStartIdx = primer día con rutina en el mapa del usuario (su inicio
	// personal, no el lunes de calendario). Todo se deriva del mapa actual,
	// así que mover rutinas mueve el reinicio automáticamente.
	const weekStartIdx = (() => {
		const i = weekMap.findIndex((s) => s && !s.rest)
		return i === -1 ? 0 : i
	})()
	const weekStartISO = trainingWeekStart(new Date(), weekStartIdx).toISOString()
	const resetWeekdayLabel = (() => {
		const full = weekSchedule[weekStartIdx]?.fullDay ?? 'Lunes'
		return full.charAt(0).toLowerCase() + full.slice(1)
	})()
	// Sesiones terminadas de esta semana de entreno (cualquier rutina).
	const sessionsThisWeek = sbSessions.filter((s) => s.ended_at && typeof s.started_at === 'string' && s.started_at >= weekStartISO)
	const sessionsThisWeekCount = sessionsThisWeek.length
	// Rutinas completadas: journal preciso (por workoutId) + sesiones de
	// Supabase (por nombre de rutina, respaldo entre dispositivos; los
	// nombres de rutina son únicos: Pierna 1 / Pierna 2 tienen fila propia).
	// Si el journal ya registra ese nombre esta semana, manda el journal.
	const widToName = new Map(workoutDays.map((w) => [w.id, w.name]))
	const journalWids = new Set(
		readDoneJournal(session?.user?.id)
			.filter((e) => e.at >= weekStartISO && widToName.has(Number(e.w)))
			.map((e) => Number(e.w)),
	)
	const journalNames = new Set([...journalWids].map((id) => widToName.get(id)))
	const routineNameById = new Map((sbRoutines ?? []).map((r) => [r.id, r.name]))
	const doneIds = new Set(journalWids)
	for (const s of sessionsThisWeek) {
		const nm = routineNameById.get(s.routine_id)
		if (!nm || journalNames.has(nm)) continue
		for (const w of workoutDays) if (w.name === nm) doneIds.add(w.id)
	}
	// Borrador en curso (una sola rutina por invariante): se protege al bajar
	// la meta para no quitar el día que se está entrenando.
	const draftActiveId = (() => {
		for (const m of [seriesByDay, weights, cardioByDay, warmupByDay]) {
			for (const k of Object.keys(m ?? {})) {
				if (hasNonEmptyValue(m[k])) return Number(k)
			}
		}
		return null
	})()
	// Meta = tope de sesiones por semana: al alcanzarla, todo lo demás se
	// bloquea con aviso de subirla (aunque el mapa ofrezca más días).
	const capReached = sessionsThisWeekCount >= weekGoal

	// Abrir un día respetando bloqueos semanales: meta alcanzada → aviso de
	// subirla; rutina ya hecha → aviso con el día de desbloqueo.
	const tryOpenDay = (workoutId) => {
		const wid = Number(workoutId)
		if (capReached) {
			showSnack(`Ya cumpliste tu meta de ${weekGoal} ${weekGoal === 1 ? 'día' : 'días'} esta semana. Súbela en Mi perfil → Meta semanal para entrenar más`, 'warn')
			return
		}
		if (doneIds.has(wid)) {
			const w = workoutDays.find((d) => d.id === wid)
			showSnack(`Ya completaste ${w?.name ?? 'esta rutina'} esta semana. Se desbloquea el ${resetWeekdayLabel}`, 'warn')
			return
		}
		selectDay(wid)
	}

	// Cambiar la meta ajusta UN solo día (incremental): conserva el orden y
	// las rutinas ya colocadas por el usuario. Al subir, el primer descanso
	// (Lun→Dom) se vuelve entreno con la primera rutina del plan para esa
	// meta aún no programada. Al bajar, se descansa el último día (Dom→Lun)
	// sin progreso en curso ni completado esta semana (si todos tienen, el
	// último igualmente; sus sesiones cuentan igual para la meta).
	// Las rutinas completadas esta semana siguen bloqueadas donde estén:
	// solo se agrega el día que faltaba.
	const changeWeekGoal = (dir) => {
		const next = Math.min(7, Math.max(1, weekGoal + dir))
		if (next === weekGoal) return
		setWeekGoal(next)
		persistWeekGoal(session?.user?.id, next)
		setWeekMap((prev) => {
			const base = (Array.isArray(prev) && prev.length === 7 ? prev : buildWeekMapForGoal(next)).map((s) => ({ ...s }))
			const count = () => base.filter((s) => !s.rest).length
			while (count() < next) {
				const idx = base.findIndex((s) => s.rest)
				if (idx === -1) break
				const used = new Set(base.filter((s) => !s.rest).map((s) => s.workoutId))
				const curated = (ROUTINES_BY_GOAL[next] ?? []).find((id) => !used.has(id))
				const fallback = workoutDays.map((w) => w.id).find((id) => !used.has(id))
				const pick = curated ?? fallback
				if (pick == null) break
				base[idx] = { workoutId: pick }
			}
			while (count() > next) {
				let idx = -1
				for (let i = base.length - 1; i >= 0; i -= 1) {
					if (base[i].rest) continue
					const wid = Number(base[i].workoutId)
					if (doneIds.has(wid)) continue
					if (draftActiveId != null && wid === draftActiveId) continue
					idx = i
					break
				}
				if (idx === -1) {
					for (let i = base.length - 1; i >= 0; i -= 1) {
						if (!base[i].rest) { idx = i; break }
					}
				}
				if (idx === -1) break
				base[idx] = { rest: true }
			}
			persistWeekMap(session?.user?.id, base)
			return base
		})
		showSnack(`Plan de ${next} ${next === 1 ? 'día' : 'días'} aplicado en tu semana`)
	}

	// Filas del home: días fijos Lun..Dom con el contenido de este usuario.
	const dayRows = weekSchedule.map((entry, i) => {
		const slot = weekMap[i] ?? DEFAULT_WEEK_MAP[i]
		return slot.rest
			? { day: entry.day, fullDay: entry.fullDay, rest: true }
			: { day: entry.day, fullDay: entry.fullDay, workoutId: slot.workoutId }
	})
	// Días que entrenan esta semana (== meta salvo edición manual imposible):
	// alimenta contadores del home y el "Día X / N" del detalle.
	const trainingRows = dayRows.filter((r) => !r.rest)
	const trainingCount = trainingRows.length

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
			// Si era de esta semana, su rutina se desbloquea (journal + sesiones).
			if (typeof s.started_at === 'string' && s.started_at >= weekStartISO) {
				const nm = sbRoutines.find((r) => r.id === s.routine_id)?.name
				if (nm) removeDoneJournalByName(session.user.id, nm)
			}
			if (openSession === s.id) setOpenSession(null)
			setSetMsg('Entrenamiento eliminado')
		} catch (err) {
			setSetMsg(`No se pudo eliminar: ${friendlyError(err)}`)
		}
	}

	// Borra TODAS las sesiones y series del usuario (rutinas y perfil intactos).
	// Doble toque para confirmar, mismo patrón que borrar una sesión.
	const wipeHistory = async () => {
		if (!confirmWipe) {
			setConfirmWipe(true)
			setDataMsg('')
			return
		}
		setConfirmWipe(false)
		try {
			const uid = session.user.id
			const { error: logsError } = await supabase.from('set_logs').delete().eq('user_id', uid)
			if (logsError) throw logsError
			const { error: sessError } = await supabase.from('workout_sessions').delete().eq('user_id', uid)
			if (sessError) throw sessError
			setSbSessions([])
			setSessionSets({})
			setStatsRows([])
			setExerciseRecords([])
			setOpenSession(null)
			// Sin sesiones no hay bloqueos: limpia también el journal.
			clearDoneJournal(uid)
			setDataMsg('Historial borrado')
		} catch (err) {
			setDataMsg(`No se pudo borrar: ${friendlyError(err)}`)
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
		setEditWeight(displayWeight(row.weight_kg ?? '', weightUnit))
		setEditReps(String(row.reps ?? ''))
		setSetMsg('')
	}

	const saveEditSet = async (row) => {
		const wLb = displayToLb(editWeight, weightUnit)
		const r = parseInt(editReps, 10)
		if (!Number.isFinite(wLb) || wLb < 0 || Number.isNaN(r) || r < 0) {
			setSetMsg('Escribe peso y repeticiones válidos')
			return
		}
		const w = Math.round(wLb * 100) / 100
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

	// Modal abierto = fondo bloqueado: sin scroll de la página detrás
	// (desktop con rueda, móvil con gesto). El overlay lleva
	// overflow-y-auto + overscroll-contain y la card .modal-card hace
	// scroll interno si supera el viewport (teclado móvil incluido).
	const anyModalOpen = weightModal != null || cardioModal != null || warmupModal != null || showOnboarding
	useEffect(() => {
		if (!anyModalOpen) return
		const prevOverflow = document.body.style.overflow
		const prevOverscroll = document.body.style.overscrollBehavior
		document.body.style.overflow = 'hidden'
		document.body.style.overscrollBehavior = 'none'
		return () => {
			document.body.style.overflow = prevOverflow
			document.body.style.overscrollBehavior = prevOverscroll
		}
	}, [anyModalOpen])

	const fetchSb = useCallback(async () => {
		if (!session?.user?.id) return
		setSbLoading(true)
		try {
			const { data: routines } = await supabase.from('routines').select('id, name').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
			if (routines) setSbRoutines(routines)
			const { data: sessions } = await supabase.from('workout_sessions').select('id, routine_id, started_at, ended_at, notes').eq('user_id', session.user.id).order('started_at', { ascending: false }).limit(20)
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

	// Stats del perfil: agrega set_logs por sesión terminada (volumen, peso máx,
	// kcal de fuerza estimadas + cardio guardado en notes) + mejor marca por
	// ejercicio para la lista de récords. Sin migración.
	useEffect(() => {
		if (currentView !== 'profile' || !session?.user?.id) return
		const finished = sbSessions.filter((s) => s.ended_at)
		if (finished.length === 0) {
			setStatsRows([])
			setExerciseRecords([])
			return
		}
		let cancelled = false
		setStatsLoading(true)
		setStatsError('')
		;(async () => {
			const ids = finished.map((s) => s.id)
			const { data, error } = await supabase
				.from('set_logs')
				.select('session_id, weight_kg, reps, exercises (name)')
				.eq('user_id', session.user.id)
				.in('session_id', ids)
				.limit(1000)
			if (error) throw error
			const bySession = {}
			for (const row of data ?? []) {
				;(bySession[row.session_id] ??= []).push(row)
			}
			const sessionDate = {}
			for (const s of finished) sessionDate[s.id] = s.started_at
			const bestByExercise = {}
			for (const row of data ?? []) {
				const name = row.exercises?.name ?? 'Ejercicio'
				const lb = Number(row.weight_kg) || 0
				if (!bestByExercise[name] || lb > bestByExercise[name].maxLb) {
					bestByExercise[name] = { name, maxLb: lb, reps: Number(row.reps) || 0, date: sessionDate[row.session_id] ?? null }
				}
			}
			const records = Object.values(bestByExercise).sort((a, b) => b.maxLb - a.maxLb)
			const rows = finished.map((s) => {
				const logs = bySession[s.id] ?? []
				let volumeKg = 0
				let maxLb = 0
				for (const l of logs) {
					const lb = Number(l.weight_kg) || 0
					const reps = Number(l.reps) || 0
					volumeKg += lb * LB_TO_KG * reps
					if (lb > maxLb) maxLb = lb
				}
				const strengthKcal = volumeKg * KCAL_PER_KG_MOVED
				const extras = parseSessionExtras(s.notes)
				const cardioKcal = extras.cardio?.kcal ?? 0
				const warmupKcal = extras.warmup?.kcal ?? 0
				const t = new Date(s.started_at)
				const short = Number.isNaN(t.getTime()) ? '' : `${t.getDate()}/${t.getMonth() + 1}`
				return {
					id: s.id,
					date: s.started_at,
					label: Number.isNaN(t.getTime()) ? 'Sesión' : t.toLocaleDateString(),
					short,
					name: sbRoutines.find((r) => r.id === s.routine_id)?.name ?? 'Entrenamiento',
					sets: logs.length,
					volumeKg,
					maxLb,
					strengthKcal,
					cardioMin: extras.cardio?.minutes ?? 0,
					cardioKcal,
					warmupMin: extras.warmup?.minutes ?? 0,
					warmupKcal,
					totalKcal: strengthKcal + cardioKcal + warmupKcal,
				}
			})
			if (!cancelled) setStatsRows(rows)
			if (!cancelled) setExerciseRecords(records)
		})().catch((err) => {
			if (!cancelled) setStatsError(friendlyError(err))
		}).finally(() => {
			if (!cancelled) setStatsLoading(false)
		})
		return () => { cancelled = true }
	}, [currentView, session?.user?.id, sbSessions, sbRoutines])

	// Al abrir un día: prepara sus filas en la base de datos y trae el último peso de cada ejercicio.
	useEffect(() => {
		if (!session?.user?.id || selectedDay == null) {
			setPlanIds(null)
			setLastW({})
			setRecentW({})
			return
		}
		const workout = workoutDays.find((day) => day.id === selectedDay)
		if (!workout) return
		// No pises el inicio si hay borrador de este mismo día (F5/segundo
		// plano): conserva la hora real en que empezó el entrenamiento.
		// Si es otro día, arranca uno nuevo (con su propio día registrado).
		const existingDraft = readActiveWorkout(session.user.id)
		if (existingDraft && Number(existingDraft.workoutId) === Number(selectedDay) && existingDraft.dayStart) {
			dayStartRef.current = existingDraft.dayStart
			dayStartDayRef.current = selectedDay
			if (existingDraft.saveSig) saveSigRef.current = existingDraft.saveSig
		} else {
			dayStartRef.current = new Date().toISOString()
			dayStartDayRef.current = selectedDay
		}
		setSyncError('')
		let cancelled = false
		ensureDayRows(supabase, session.user.id, workout).then(async (ids) => {
			if (cancelled) return
			setPlanIds(ids)
			// Hereda historial de nombres anteriores (renombres del plan,
			// p. ej. Pantorrilla ← Biserie): alias { idNuevo: idViejo }.
			let aliasMap = {}
			try {
				const newIdByOldName = {}
				const oldNames = []
				workout.exercises.forEach(([name], i) => {
					for (const old of EXERCISE_RENAMES[name] ?? []) {
						oldNames.push(old)
						newIdByOldName[old] = ids.byIndex[i]
					}
				})
				if (oldNames.length > 0) {
					const legacyIds = await fetchExerciseIdsByNames(supabase, session.user.id, oldNames)
					for (const [oldName, oldId] of Object.entries(legacyIds)) {
						const newId = newIdByOldName[oldName]
						if (newId != null && newId !== oldId) aliasMap[newId] = oldId
					}
				}
			} catch {
				// sin alias: historial desde cero
			}
			try {
				const map = await fetchLastWeights(supabase, session.user.id, Object.values(ids.byIndex), aliasMap)
				if (!cancelled) setLastW(map)
			} catch {
				// sin último peso: el modal queda vacío
			}
			try {
				const recent = await fetchRecentLogs(supabase, session.user.id, Object.values(ids.byIndex), 4, aliasMap)
				if (!cancelled) setRecentW(recent)
			} catch {
				// sin historial reciente: el acordeón no muestra la caja
			}
		}).catch((err) => {
			if (!cancelled) setSyncError(friendlyError(err))
		})
		return () => { cancelled = true }
	}, [session?.user?.id, selectedDay])

	// Orden de la semana por usuario: cada uno organiza sus días sin afectar
	// a otros. Al cambiar de cuenta se carga el suyo (o el orden por defecto).
	useEffect(() => {
		setWeekMap(readWeekMap(session?.user?.id) ?? DEFAULT_WEEK_MAP.map((s) => ({ ...s })))
		setWeekGoal(readWeekGoal(session?.user?.id))
		setEditingWeek(false)
	}, [session?.user?.id])

	// Perfil por usuario: Supabase (tabla profiles) + local por usuario.
	// Si es cuenta nueva sin peso, se abre el onboarding de datos básicos.
	useEffect(() => {
		const uid = session?.user?.id
		if (!uid) {
			setProfile(null)
			setShowOnboarding(false)
			return
		}
		let cancelled = false
		setProfileLoading(true)
		const local = readProfileLocal(uid)
		if (local && isProfileComplete(local)) {
			setProfile(local)
			if (Number(local.weight_kg) > 0) setBodyKg(Number(local.weight_kg))
			setProfileForm({
				weight: bodyKgToDisplay(local.weight_kg, weightUnit),
				height: local.height_cm != null ? String(local.height_cm) : '',
				age: local.age != null ? String(local.age) : '',
				sex: local.sex ?? '',
			})
		} else if (local) {
			setProfile(local)
			if (Number(local.weight_kg) > 0) setBodyKg(Number(local.weight_kg))
		}
		// Si no hay nada local, usa el peso global histórico como punto de partida.
		if (!local?.weight_kg) {
			setBodyKg(readBodyKgFor(uid))
		}
		setOnboarding((prev) => ({
			...prev,
			weight: prev.weight || bodyKgToDisplay(readBodyKgFor(uid), weightUnit),
		}))
		// Si ya se detectó que la tabla no existe, ni se intenta: cero 404s.
		if (isProfilesTableMissing()) {
			setShowOnboarding(!isProfileComplete(local))
			setProfileLoading(false)
			return () => { cancelled = true }
		}
		;(async () => {
			try {
				const { data, error } = await supabase.from('profiles').select('weight_kg, height_cm, age, sex').eq('user_id', uid).maybeSingle()
				if (error) throw error
				markProfilesChecked(null)
				if (cancelled) return
				if (data && (data.weight_kg != null || data.height_cm != null || data.age != null || data.sex != null)) {
					const merged = {
						weight_kg: data.weight_kg != null ? Number(data.weight_kg) : local?.weight_kg ?? null,
						height_cm: data.height_cm != null ? Number(data.height_cm) : local?.height_cm ?? null,
						age: data.age != null ? Number(data.age) : local?.age ?? null,
						sex: data.sex ?? local?.sex ?? null,
					}
					setProfile(merged)
					persistProfileLocal(uid, merged)
					if (Number.isFinite(Number(merged.weight_kg)) && Number(merged.weight_kg) > 0) {
						setBodyKg(Number(merged.weight_kg))
						setProfileForm({
							weight: bodyKgToDisplay(merged.weight_kg, weightUnit),
							height: merged.height_cm != null ? String(merged.height_cm) : '',
							age: merged.age != null ? String(merged.age) : '',
							sex: merged.sex ?? '',
						})
					}
					setShowOnboarding(!isProfileComplete(merged))
					if (!isProfileComplete(merged)) {
						setOnboarding((prev) => ({
							weight: prev.weight || bodyKgToDisplay(merged.weight_kg ?? readBodyKgFor(uid), weightUnit),
							height: prev.height || (merged.height_cm != null ? String(merged.height_cm) : ''),
							age: prev.age || (merged.age != null ? String(merged.age) : ''),
							sex: prev.sex || merged.sex || '',
						}))
					}
				} else {
					// Sin fila en Supabase (cuenta nueva o tabla aún no creada): pide datos básicos.
					setShowOnboarding(!isProfileComplete(local))
					if (!isProfileComplete(local)) {
						setOnboarding((prev) => ({
							weight: prev.weight || bodyKgToDisplay(readBodyKgFor(uid), weightUnit),
							height: prev.height || (local?.height_cm != null ? String(local.height_cm) : ''),
							age: prev.age || (local?.age != null ? String(local.age) : ''),
							sex: prev.sex || local?.sex || '',
						}))
					}
				}
			} catch (err) {
				// Sin tabla profiles (migración pendiente) o sin conexión: se marca
				// una sola vez y se sigue en local, sin más intentos ni ruido.
				markProfilesChecked(err)
				if (!cancelled) setShowOnboarding(!isProfileComplete(readProfileLocal(uid)))
			} finally {
				if (!cancelled) setProfileLoading(false)
			}
		})()
		return () => { cancelled = true }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.id])

	const submitOnboarding = async (e) => {
		if (e) e.preventDefault()
		const kg = displayToBodyKg(onboarding.weight, weightUnit)
		const h = parseFloat(onboarding.height)
		const a = parseInt(onboarding.age, 10)
		if (!Number.isFinite(kg) || kg < 30 || kg > 300) {
			setOnboardingError(`Escribe tu peso válido en ${weightUnit} (30 a 300 ${weightUnit === 'kg' ? 'kg' : 'lb'} aprox.)`)
			return
		}
		if (onboarding.height !== '' && (!Number.isFinite(h) || h < 100 || h > 250)) {
			setOnboardingError('Escribe tu altura en cm (100 a 250) o déjala vacía')
			return
		}
		if (onboarding.age !== '' && (Number.isNaN(a) || a < 10 || a > 100)) {
			setOnboardingError('Escribe tu edad (10 a 100) o déjala vacía')
			return
		}
		setOnboardingError('')
		setOnboardingSaving(true)
		const uid = session?.user?.id
		const payload = {
			weight_kg: Math.round(kg * 10) / 10,
			height_cm: onboarding.height === '' ? null : Math.round(h * 10) / 10,
			age: onboarding.age === '' ? null : a,
			sex: onboarding.sex || null,
		}
		try {
			if (uid && !isProfilesTableMissing()) {
				await supabase.from('profiles').upsert({ user_id: uid, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
				markProfilesChecked(null)
			}
		} catch (err) {
			// sin tabla (migración pendiente) o sin conexión: sigue en local
			markProfilesChecked(err)
		}
		const merged = { ...(profile ?? {}), ...payload }
		setProfile(merged)
		persistProfileLocal(uid, merged)
		setBodyKg(payload.weight_kg)
		try {
			localStorage.setItem('tempolift-body-kg', String(payload.weight_kg))
		} catch {
			// ignora
		}
		setProfileForm({
			weight: bodyKgToDisplay(payload.weight_kg, weightUnit),
			height: payload.height_cm != null ? String(payload.height_cm) : '',
			age: payload.age != null ? String(payload.age) : '',
			sex: payload.sex ?? '',
		})
		setShowOnboarding(false)
		setOnboardingSaving(false)
	}

	const saveProfileForm = async (e) => {
		if (e) e.preventDefault()
		const kg = displayToBodyKg(profileForm.weight, weightUnit)
		const h = parseFloat(profileForm.height)
		const a = parseInt(profileForm.age, 10)
		if (!Number.isFinite(kg) || kg < 30 || kg > 300) {
			setProfileMsg(`Escribe tu peso válido en ${weightUnit}`)
			return
		}
		if (profileForm.height !== '' && (!Number.isFinite(h) || h < 100 || h > 250)) {
			setProfileMsg('Altura inválida (100 a 250 cm)')
			return
		}
		if (profileForm.age !== '' && (Number.isNaN(a) || a < 10 || a > 100)) {
			setProfileMsg('Edad inválida (10 a 100)')
			return
		}
		setProfileSaving(true)
		setProfileMsg('')
		const uid = session?.user?.id
		const payload = {
			weight_kg: Math.round(kg * 10) / 10,
			height_cm: profileForm.height === '' ? null : Math.round(h * 10) / 10,
			age: profileForm.age === '' ? null : a,
			sex: profileForm.sex || null,
		}
		try {
			if (uid && !isProfilesTableMissing()) {
				await supabase.from('profiles').upsert({ user_id: uid, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
				markProfilesChecked(null)
			}
		} catch (err) {
			// sin tabla (migración pendiente) o sin conexión: sigue en local
			markProfilesChecked(err)
		}
		const merged = { ...(profile ?? {}), ...payload }
		setProfile(merged)
		persistProfileLocal(uid, merged)
		setBodyKg(payload.weight_kg)
		try {
			localStorage.setItem('tempolift-body-kg', String(payload.weight_kg))
		} catch {
			// ignora
		}
		setProfileSaving(false)
		setProfileMsg('Datos actualizados ✓')
	}

	// Al marcar todo: guarda el día en tu historial + banner + auto-reset
	useEffect(() => {
		if (!selectedWorkout || !allDone) return
		setDayComplete(true)
		const wid = selectedWorkout.id
		const customSets = dayCustoms.filter((c) => c.sets.length > 0).map((c) => ({ name: c.name, sets: c.sets }))
		const sig = `${wid}:${JSON.stringify(dayWeights)}:${JSON.stringify(customSets)}:${cardioMinutes}:${cardioMachineKcal ?? ''}:${warmupMinutes}:${warmupMachineKcal ?? ''}:${bodyKg}`
		if (saveSigRef.current !== sig) {
			saveSigRef.current = sig
			if (!planIds?.routineId) {
				setSaveStatus({ state: 'error', msg: syncError || 'no se pudo preparar el guardado' })
			} else {
				setSaveStatus({ state: 'saving', msg: '' })
				const extras = {
					cardioMin: cardioDone ? cardioMinutes : null,
					cardioKcal: cardioDone ? Math.round(dayCardioKcal) : null,
					cardioMachineKcal: cardioMachineKcal ?? null,
					warmupMin: warmupDone ? warmupMinutes : null,
					warmupKcal: warmupDone ? Math.round(dayWarmupKcal) : null,
					warmupMachineKcal: warmupMachineKcal ?? null,
				}
				saveDaySession(supabase, session.user.id, planIds.routineId, planIds.byIndex, dayWeights, dayStartRef.current, extras, customSets).then(() => {
					setSaveStatus({ state: 'saved', msg: '' })
					// Journal preciso por workoutId: bloquea esta rutina hasta
					// el reinicio semanal (sin esperar al refetch).
					appendDoneJournal(session.user.id, wid)
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
	}, [allDone, selectedWorkout, weights, dayWeights, dayCustoms, cardioDone, cardioMinutes, cardioMachineKcal, dayCardioKcal, warmupDone, warmupMinutes, warmupMachineKcal, dayWarmupKcal, bodyKg, planIds, syncError, session?.user?.id, fetchSb, resetDay])

	// Borrador persistente: restaura los checks al recargar/CERRAR la app.
	// Al cambiar de cuenta se carga el borrador de ese usuario (o vacío).
	useEffect(() => {
		const uid = session?.user?.id
		if (!uid) return
		const draft = readActiveWorkout(uid)
		if (draft) {
			const wid = draft.workoutId
			if (draft.series && Object.keys(draft.series).length > 0) setSeriesByDay({ [wid]: draft.series })
			else setSeriesByDay({})
			if (draft.weights && Object.keys(draft.weights).length > 0) setWeights({ [wid]: draft.weights })
			else setWeights({})
			setCardioByDay(draft.cardio ? { [wid]: draft.cardio } : {})
			setWarmupByDay(draft.warmup ? { [wid]: draft.warmup } : {})
			setCustomByDay(draft.customs && draft.customs.length > 0 ? { [wid]: draft.customs } : {})
			if (Number.isFinite(Number(draft.selectedDay))) setSelectedDay(Number(draft.selectedDay))
			setLastDay(draft.lastDay != null ? Number(draft.lastDay) : wid)
			if (draft.dayStart) {
				dayStartRef.current = draft.dayStart
				dayStartDayRef.current = wid
			}
			if (draft.saveSig) saveSigRef.current = draft.saveSig
		} else {
			// Sin borrador (cuenta nueva o ya terminado): no heredar
			// progreso de otra cuenta vista antes en este navegador.
			setSeriesByDay({})
			setWeights({})
			setCardioByDay({})
			setWarmupByDay({})
			setCustomByDay({})
			setSelectedDay(null)
			setLastDay(null)
			dayStartRef.current = null
			dayStartDayRef.current = null
			saveSigRef.current = null
			setDayComplete(false)
			setSaveStatus({ state: 'idle', msg: '' })
		}
		setDraftHydratedUid(uid)
	}, [session?.user?.id])

	// Guarda el borrador en cada cambio (una sola rutina: solo el día con
	// datos). Sin datos se borra el caché. No corre hasta hidratarse para
	// no borrar lo guardado con los estados iniciales vacíos.
	// saveStatus/dayComplete en deps: tras guardar (saveSig nuevo) también
	// se persiste la firma para no duplicar la sesión si hay F5 antes del reset.
	useEffect(() => {
		const uid = session?.user?.id
		if (!uid || draftHydratedUid !== uid) return
		const widOf = (m) => Object.keys(m ?? {}).map(Number).filter((n) => Number.isFinite(n) && hasNonEmptyValue(m[n]))
		const candidates = new Set([
			...widOf(seriesByDay),
			...widOf(weights),
			...widOf(cardioByDay),
			...widOf(warmupByDay),
			...widOf(customByDay),
		])
		if (candidates.size === 0) {
			clearActiveWorkout(uid)
			return
		}
		// Solo uno: prefiere el día abierto si tiene datos, si no el resto.
		let activeId = null
		if (selectedDay != null && candidates.has(Number(selectedDay))) activeId = Number(selectedDay)
		else if (lastDay != null && candidates.has(Number(lastDay))) activeId = Number(lastDay)
		else activeId = [...candidates][0]
		// No mezclar inicios: si el ref es de otro día, conserva el guardado.
		let dayStartToStore = dayStartRef.current
		if (dayStartDayRef.current == null || Number(dayStartDayRef.current) !== Number(activeId)) {
			try {
				const stored = readActiveWorkout(uid)
				if (stored && Number(stored.workoutId) === Number(activeId) && stored.dayStart) {
					dayStartToStore = stored.dayStart
				}
			} catch {
				// conserva el ref
			}
		}
		persistActiveWorkout(uid, {
			workoutId: activeId,
			series: seriesByDay[activeId] ?? {},
			weights: weights[activeId] ?? {},
			cardio: cardioByDay[activeId] ?? null,
			warmup: warmupByDay[activeId] ?? null,
			customs: customByDay[activeId] ?? [],
			selectedDay,
			lastDay: lastDay ?? activeId,
			dayStart: dayStartToStore,
			saveSig: saveSigRef.current,
		})
	}, [session?.user?.id, draftHydratedUid, seriesByDay, weights, cardioByDay, warmupByDay, customByDay, selectedDay, lastDay, saveStatus, dayComplete])

	// El descanso es global: no se corta al cambiar de pantalla.
	// Solo se limpia al omitir, reiniciar el día o completar el día.
	useEffect(() => {
		setExpandedKey(null)
		setDayComplete(false)
	}, [selectedDay])

	// Fondo de la página según el tema: en desktop se ven los márgenes
	// laterales fuera de la columna; en claro deben ser claros, no negros
	// (la clase theme-light vive solo en el <main>).
	useEffect(() => {
		const prev = document.body.style.backgroundColor
		document.body.style.backgroundColor = theme === 'light' ? '#f4f6ef' : '#0b0d0c'
		return () => {
			document.body.style.backgroundColor = prev
		}
	}, [theme])

	// SPA sin router: cada pantalla empieza arriba. Sin esto se hereda el
	// scroll de la vista anterior (bajas en home y la rutina/perfil abre a mitad).
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [selectedDay, currentView])

	if (authChecking) {
		// Arranque: si resuelve rápido no se muestra nada (ni login ni
		// skeleton) para evitar el flash. Solo con latencia aparece el
		// skeleton tras ~150ms.
		if (!bootVisible) {
			return (
				<main className={`theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28`} style={{ backgroundColor: theme === 'light' ? '#f4f6ef' : '#0b0d0c' }} aria-busy="true" aria-label="Cargando TempoLift" />
			)
		}
		return <BootSkeleton theme={theme} />
	}

	if (!session) {
		return <LoginPage theme={theme} onSignIn={signInWithGoogle} />
	}

	// Datos del modal de serie extra (null si el extra desapareció).
	const customLogData = customModal ? (() => {
		const found = (customByDay[customModal.workoutId] ?? []).find((x) => x.id === customModal.customId)
		if (!found || found.sets.length >= found.targetSets) return null
		return { name: found.name, setNumber: found.sets.length + 1, targetSets: found.targetSets, lastSet: found.sets[found.sets.length - 1] ?? null }
	})() : null

	if (selectedWorkout) {
		return (
			<DayPage
				theme={theme}
				goBack={goBack}
				trainingRows={trainingRows}
				selectedDay={selectedDay}
				trainingCount={trainingCount}
				selectedWorkout={selectedWorkout}
				doneCount={doneCount}
				totalExercises={totalExercises}
				progress={progress}
				allDone={allDone}
				missingLabels={missingLabels}
				dayTotalKcal={dayTotalKcal}
				dayStrengthKcal={dayStrengthKcal}
				cardioDone={cardioDone}
				cardioMinutes={cardioMinutes}
				cardioMachineKcal={cardioMachineKcal}
				dayCardioKcal={dayCardioKcal}
				warmupDone={warmupDone}
				warmupMinutes={warmupMinutes}
				warmupMachineKcal={warmupMachineKcal}
				dayWarmupKcal={dayWarmupKcal}
				dayVolumeKg={dayVolumeKg}
				openCardio={openCardio}
				unmarkCardio={unmarkCardio}
				openWarmup={openWarmup}
				unmarkWarmup={unmarkWarmup}
				syncError={syncError}
				isResting={isResting}
				restLabel={restLabel}
				restLeft={restLeft}
				restSeries={restSeries}
				skipRest={skipRest}
				dayComplete={dayComplete}
				saveStatus={saveStatus}
				resetDay={resetDay}
				showDaySkel={showDaySkel}
				openPhase={openPhase}
				togglePhase={togglePhase}
				seriesMap={seriesMap}
				planIds={planIds}
				lastW={lastW}
				recentW={recentW}
				weightUnit={weightUnit}
				weightModal={weightModal}
				cardioModal={cardioModal}
				warmupModal={warmupModal}
				expandedKey={expandedKey}
				toggleExpand={toggleExpand}
				handleToggleCheck={handleToggleCheck}
				handleNav={handleNav}
				weightMod={{ weightInput, setWeightInput, repsInput, setRepsInput, onSubmit: confirmWeightModal, onClose: closeWeightModal, onSwitchUnit: switchWeightUnit }}
				cardioMod={{ cardioInput, setCardioInput, cardioMachineInput, setCardioMachineInput, bodyKg, onSubmit: confirmCardio, onClose: closeCardioModal }}
				warmupMod={{ warmupInput, setWarmupInput, warmupMachineInput, setWarmupMachineInput, bodyKg, onSubmit: confirmWarmup, onClose: closeWarmupModal }}
				customs={dayCustoms}
				customBlocked={customBlocked}
				onAddCustom={openCustomCreate}
				onLogCustom={(cid) => openCustomLog(selectedWorkout.id, cid)}
				onUnmarkCustom={(cid) => unmarkCustom(selectedWorkout.id, cid)}
				onRemoveCustom={(cid) => removeCustom(selectedWorkout.id, cid)}
				removeArmedCustomId={confirmCustomRemove}
				customCreateMod={customCreate ? { name: customName, setName: setCustomName, weight: customWeight, setWeight: setCustomWeight, reps: customReps, setReps: setCustomReps, sets: customSets, setSets: setCustomSets, dbNames: dbExerciseNames, dbLoading: dbNamesLoading, onSubmit: confirmCustomCreate, onClose: closeCustomCreate, unit: weightUnit, onSwitchUnit: switchWeightUnit } : null}
				customLogMod={customLogData ? { name: customLogData.name, setNumber: customLogData.setNumber, targetSets: customLogData.targetSets, lastSet: customLogData.lastSet, weight: customSetWeight, setWeight: setCustomSetWeight, reps: customSetReps, setReps: setCustomSetReps, onSubmit: confirmCustomLog, onClose: closeCustomLog, unit: weightUnit, onSwitchUnit: switchWeightUnit } : null}
				snack={snack}
				closeSnack={closeSnack}
				onboarding={{ show: showOnboarding, form: onboarding, setForm: setOnboarding, unit: weightUnit, onSwitchUnit: switchWeightUnit, error: onboardingError, saving: onboardingSaving, onSubmit: submitOnboarding, onSkip: () => setShowOnboarding(false) }}
			/>
		)
	}
	if (currentView !== 'home') {
		const tabOnboarding = { show: showOnboarding, form: onboarding, setForm: setOnboarding, unit: weightUnit, onSwitchUnit: switchWeightUnit, error: onboardingError, saving: onboardingSaving, onSubmit: submitOnboarding, onSkip: () => setShowOnboarding(false) }
		return currentView === 'history' ? (
			<HistoryPage
				theme={theme}
				showHistorySkel={showHistorySkel}
				sbLoading={sbLoading}
				historyHasData={historyHasData}
				sbSessions={sbSessions}
				sbRoutines={sbRoutines}
				openSession={openSession}
				sessionSets={sessionSets}
				setsLoading={setsLoading}
				showSetsSkel={showSetsSkel}
				editingSet={editingSet}
				setEditingSet={setEditingSet}
				editWeight={editWeight}
				setEditWeight={setEditWeight}
				editReps={editReps}
				setEditReps={setEditReps}
				weightUnit={weightUnit}
				switchWeightUnit={switchWeightUnit}
				startEditSet={startEditSet}
				saveEditSet={saveEditSet}
				toggleSession={toggleSession}
				deleteSession={deleteSession}
				confirmDelete={confirmDelete}
				setMsg={setMsg}
				currentView={currentView}
				handleNav={handleNav}
				isResting={isResting}
				restLabel={restLabel}
				restLeft={restLeft}
				returnToTraining={returnToTraining}
				snack={snack}
				closeSnack={closeSnack}
				onboarding={tabOnboarding}
			/>
		) : (
			<ProfilePage
				theme={theme}
				showProfileSkel={showProfileSkel}
				sbLoading={sbLoading}
				statsLoading={statsLoading}
				sbSessions={sbSessions}
				statsRows={statsRows}
				statsError={statsError}
				exerciseRecords={exerciseRecords}
				showAllRecords={showAllRecords}
				setShowAllRecords={setShowAllRecords}
				session={session}
				weightUnit={weightUnit}
				switchWeightUnit={switchWeightUnit}
				weekGoal={weekGoal}
				changeWeekGoal={changeWeekGoal}
				profile={profile}
				bodyKg={bodyKg}
				profileForm={profileForm}
				setProfileForm={setProfileForm}
				profileMsg={profileMsg}
				profileSaving={profileSaving}
				saveProfileForm={saveProfileForm}
				toggleTheme={toggleTheme}
				dataMsg={dataMsg}
				confirmWipe={confirmWipe}
				wipeHistory={wipeHistory}
				signOut={signOut}
				currentView={currentView}
				handleNav={handleNav}
				isResting={isResting}
				restLabel={restLabel}
				restLeft={restLeft}
				returnToTraining={returnToTraining}
				snack={snack}
				closeSnack={closeSnack}
				onboarding={tabOnboarding}
			/>
		)
	}

	return (
		<HomePage
			theme={theme}
			editingWeek={editingWeek}
			setEditingWeek={setEditingWeek}
			resetWeekOrder={resetWeekOrder}
			trainingCount={trainingCount}
			dayRows={dayRows}
			weekMap={weekMap}
			moveWeekDay={moveWeekDay}
			seriesByDay={seriesByDay}
			cardioByDay={cardioByDay}
			warmupByDay={warmupByDay}
			doneIds={doneIds}
			resetWeekdayLabel={resetWeekdayLabel}
			tryOpenDay={tryOpenDay}
			currentView={currentView}
			handleNav={handleNav}
			isResting={isResting}
			restLabel={restLabel}
			restLeft={restLeft}
			returnToTraining={returnToTraining}
			snack={snack}
			closeSnack={closeSnack}
			onboarding={{ show: showOnboarding, form: onboarding, setForm: setOnboarding, unit: weightUnit, onSwitchUnit: switchWeightUnit, error: onboardingError, saving: onboardingSaving, onSubmit: submitOnboarding, onSkip: () => setShowOnboarding(false) }}
		/>
	)
}

export default App
