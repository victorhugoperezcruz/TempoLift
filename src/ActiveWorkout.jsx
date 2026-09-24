import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'

function formatRest(total) {
	const m = Math.floor(total / 60)
	const s = total % 60
	return `${m}:${String(s).padStart(2, '0')}`
}

function ActiveWorkout({ user, routineId, sessionId: initialSessionId = null, onFinish, onExit }) {
	const [items, setItems] = useState([])
	const [loading, setLoading] = useState(true)
	const [errorMsg, setErrorMsg] = useState('')
	const [sessionId, setSessionId] = useState(initialSessionId)
	const [lastLogs, setLastLogs] = useState({})
	const [completed, setCompleted] = useState({})
	const [modal, setModal] = useState(null)
	const [weight, setWeight] = useState('')
	const [reps, setReps] = useState('')
	const [saving, setSaving] = useState(false)
	const [restLeft, setRestLeft] = useState(0)
	const [restLabel, setRestLabel] = useState('')
	const intervalRef = useRef(null)
	const sessionPromiseRef = useRef(null)

	const isBlocked = restLeft > 0

	// La sesión se crea solo al guardar la primera serie (así no quedan
	// sesiones vacías por abrir y no se duplica en desarrollo).
	const ensureSessionId = useCallback(async () => {
		if (sessionId) return sessionId
		if (!sessionPromiseRef.current) {
			sessionPromiseRef.current = (async () => {
				const { data, error } = await supabase.from('workout_sessions').insert({
					user_id: user.id,
					routine_id: routineId,
				}).select('id').single()
				if (error) throw error
				setSessionId(data.id)
				return data.id
			})().catch((err) => {
				sessionPromiseRef.current = null
				throw err
			})
		}
		return sessionPromiseRef.current
	}, [sessionId, user?.id, routineId])

	// Temporizador de descanso: una sola cuenta atrás mientras haya bloqueo
	useEffect(() => {
		if (!isBlocked) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
			return
		}
		if (intervalRef.current) clearInterval(intervalRef.current)
		intervalRef.current = setInterval(() => {
			setRestLeft((v) => {
				if (v <= 1) {
					clearInterval(intervalRef.current)
					intervalRef.current = null
					return 0
				}
				return v - 1
			})
		}, 1000)
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}
		}
	}, [isBlocked])

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [])

	useEffect(() => {
		if (!user?.id || !routineId) return
		let cancelled = false
		const load = async () => {
			setLoading(true)
			setErrorMsg('')
			try {
				if (initialSessionId) {
					setSessionId(initialSessionId)
					const { data: currentLogs, error: currentError } = await supabase.from('set_logs').select('id, exercise_id, set_number, weight_kg, reps').eq('user_id', user.id).eq('session_id', initialSessionId)
					if (currentError) throw currentError
					const doneMap = {}
					for (const row of currentLogs ?? []) {
						doneMap[`${row.exercise_id}-${row.set_number}`] = row
					}
					if (!cancelled) setCompleted(doneMap)
				}
				const { data: routineData, error: routineError } = await supabase.from('routine_exercises').select(`
					id,
					routine_id,
					exercise_id,
					target_sets,
					target_reps,
					rest_seconds,
					position,
					exercises (id, name, muscle_group)
				`).eq('user_id', user.id).eq('routine_id', routineId).order('position', { ascending: true })
				if (routineError) throw routineError
				const list = routineData ?? []
				if (!cancelled) setItems(list)
				const ids = list.map((r) => r.exercise_id)
				if (ids.length > 0) {
					const { data: history, error: historyError } = await supabase.from('set_logs').select('exercise_id, session_id, weight_kg, reps, created_at').eq('user_id', user.id).in('exercise_id', ids).order('created_at', { ascending: false })
					if (historyError) throw historyError
					const map = {}
					for (const row of history ?? []) {
						if (initialSessionId && row.session_id === initialSessionId) continue
						if (!map[row.exercise_id]) {
							map[row.exercise_id] = row
						}
					}
					if (!cancelled) setLastLogs(map)
				}
			} catch (err) {
				if (!cancelled) setErrorMsg(err.message ?? 'Error cargando la rutina')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [user?.id, routineId])

	const openSetModal = (item, setNumber) => {
		if (isBlocked || saving) return
		const key = `${item.exercise_id}-${setNumber}`
		if (completed[key]) return
		if (setNumber === 2 && !completed[`${item.exercise_id}-1`]) return
		const prev = lastLogs[item.exercise_id]
		setWeight(prev?.weight_kg != null ? String(prev.weight_kg) : '')
		setReps(prev?.reps != null ? String(prev.reps) : (item.target_reps != null ? String(item.target_reps) : ''))
		setModal({
			exercise_id: item.exercise_id,
			exerciseName: item.exercises?.name ?? 'Ejercicio',
			setNumber,
			rest_seconds: item.rest_seconds ?? 120,
			target_reps: item.target_reps ?? null,
		})
	}

	const closeModal = () => {
		if (saving) return
		setModal(null)
		setWeight('')
		setReps('')
	}

	const confirmSet = async (e) => {
		if (e) e.preventDefault()
		if (!modal) return
		const w = parseFloat(weight)
		const r = parseInt(reps, 10)
		if (Number.isNaN(w) || w < 0) {
			setErrorMsg('Ingresa un peso válido (>= 0)')
			return
		}
		if (Number.isNaN(r) || r < 0) {
			setErrorMsg('Ingresa repeticiones válidas (>= 0)')
			return
		}
		setSaving(true)
		setErrorMsg('')
		try {
			const sid = await ensureSessionId()
			const { data, error } = await supabase.from('set_logs').insert({
				user_id: user.id,
				session_id: sid,
				exercise_id: modal.exercise_id,
				set_number: modal.setNumber,
				weight_kg: w,
				reps: r,
			}).select('id, exercise_id, set_number, weight_kg, reps').single()
			if (error) throw error
			setCompleted((prev) => ({ ...prev, [`${data.exercise_id}-${data.set_number}`]: data }))
			const finishedModal = modal
			setModal(null)
			setWeight('')
			setReps('')
			// Descanso tras cada serie: S1 antes de S2, S2 antes del siguiente ejercicio.
			// Si ya no quedan series, no se bloquea para poder terminar.
			const doneAfter = Object.keys(completed).length + 1
			const remaining = items.length * 2 - doneAfter
			if (finishedModal.setNumber === 1 || remaining > 0) {
				const raw = Number(finishedModal.rest_seconds)
				const secs = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 120
				setRestLabel(finishedModal.exerciseName)
				setRestLeft(secs)
			}
		} catch (err) {
			setErrorMsg(err.message ?? 'No se pudo guardar la serie')
		} finally {
			setSaving(false)
		}
	}

	const finishWorkout = async () => {
		if (isBlocked || saving) return
		if (sessionId) {
			await supabase.from('workout_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId)
		}
		if (onFinish) onFinish(sessionId)
	}

	if (!user) {
		return (
			<section className="glass-card rounded-2xl p-5">
				<p className="text-sm text-zinc-400">Inicia sesión para entrenar.</p>
			</section>
		)
	}

	if (!routineId) {
		return (
			<section className="glass-card rounded-2xl p-5">
				<p className="text-sm text-zinc-400">Elige una rutina para empezar.</p>
			</section>
		)
	}

	if (loading) {
		return (
			<section className="glass-card rounded-2xl p-5">
				<p className="text-sm text-zinc-500">Cargando rutina...</p>
			</section>
		)
	}

	const totalSets = items.length * 2
	const doneSets = Object.keys(completed).length

	return (
		<section className="glass-card rounded-2xl p-5" style={{ backgroundColor: '#0b0d0c' }}>
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-black text-white">Entrenamiento activo</h2>
					<p className="mt-1 text-sm text-zinc-400">{doneSets}/{totalSets} series</p>
				</div>
				{onExit && (
					<button
						type="button"
						onClick={onExit}
						disabled={saving}
						className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition hover:border-white/25 hover:text-zinc-300 disabled:opacity-50"
					>
						Salir
					</button>
				)}
			</div>
			{errorMsg && (
				<p className="mt-3 text-sm text-red-400">{errorMsg}</p>
			)}
			{items.length === 0 && !errorMsg && (
				<p className="mt-3 text-sm text-zinc-500">Esta rutina aún no tiene ejercicios.</p>
			)}
			{isBlocked && (
				<div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center" role="status" aria-live="assertive">
					<p className="text-xs font-bold uppercase tracking-widest text-red-400">Descanso · {restLabel}</p>
					<p className="mt-1 text-4xl font-black tabular-nums text-white">{formatRest(restLeft)}</p>
					<p className="mt-1 text-xs text-zinc-400">Bloqueado hasta que llegue a 0:00</p>
				</div>
			)}
			<div className="mt-4 flex flex-col gap-3">
				{items.map((item) => {
					const exId = item.exercise_id
					const prev = lastLogs[exId]
					const rest = item.rest_seconds ?? 120
					const s1 = completed[`${exId}-1`]
					const s2 = completed[`${exId}-2`]
					return (
						<article key={item.id} className={`glass-inset rounded-xl p-4 ${isBlocked ? 'opacity-70' : ''}`}>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="text-base font-black text-white">{item.exercises?.name ?? 'Ejercicio'}</h3>
									<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{item.exercises?.muscle_group ?? '—'} · Descanso {rest}s</p>
								</div>
								<span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Objetivo 2x{item.target_reps ?? '—'}</span>
							</div>
							<p className="mt-2 text-sm text-zinc-400">
								{prev ? `Último: ${prev.weight_kg}lb x ${prev.reps} reps` : 'Sin registro previo · úsalo como guía'}
							</p>
							<div className="mt-3 flex items-center gap-3">
								{[1, 2].map((n) => {
									const key = `${exId}-${n}`
									const done = completed[key]
									// S2 bloqueada hasta completar S1 + que termine el timer
									const needsS1First = n === 2 && !s1
									const disabled = isBlocked || saving || Boolean(done) || needsS1First
									const hint = n === 1 ? (s1 ? 'S1 lista' : 'Marcar S1') : (s2 ? 'S2 lista' : (!s1 ? 'Primero S1' : (isBlocked ? 'Espera descanso' : 'Marcar S2')))
									return (
										<button
											key={key}
											type="button"
											role="checkbox"
											aria-checked={Boolean(done)}
											aria-label={`Serie ${n} de ${item.exercises?.name ?? 'ejercicio'}`}
											disabled={disabled}
											onClick={() => openSetModal(item, n)}
											title={hint}
											className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${done ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : needsS1First ? 'border-white/5 bg-white/[0.02] text-zinc-600' : 'border-white/10 bg-white/5 text-white hover:border-red-500/60'} disabled:cursor-not-allowed disabled:opacity-50`}
										>
											<span aria-hidden="true" className={`flex h-6 w-6 items-center justify-center rounded-md border ${done ? 'border-emerald-400 bg-emerald-500 text-[#0b0d0c]' : 'border-white/20 bg-transparent text-transparent'}`}>✓</span>
											<span>S{n}{done ? ` · ${done.weight_kg}lb x ${done.reps}` : ''}</span>
										</button>
									)
								})}
							</div>
							{!s1 && (
								<p className="mt-2 text-xs text-zinc-600">Toca S1 para registrarla, luego descansa y marca S2.</p>
							)}
							{s1 && !s2 && (
								<p className="mt-2 text-xs text-zinc-500">{isBlocked ? `Descansando ${formatRest(restLeft)} antes de S2…` : 'Listo para S2: tócala para registrarla.'}</p>
							)}
						</article>
					)
				})}
			</div>
			<button
				type="button"
				onClick={finishWorkout}
				disabled={isBlocked || saving || items.length === 0}
				className="mt-4 min-h-12 w-full rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isBlocked ? `Bloqueado ${formatRest(restLeft)}` : 'Terminar entrenamiento'}
			</button>
			{modal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" role="dialog" aria-modal="true" aria-label={`Registrar serie ${modal.setNumber}`}>
					<div className="glass-card w-full max-w-sm rounded-2xl p-5">
						<h3 className="text-lg font-black text-white">{modal.exerciseName} · Serie {modal.setNumber}/2</h3>
						<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Objetivo {modal.target_reps ?? '—'} reps · Descanso {modal.rest_seconds}s</p>
						<form onSubmit={confirmSet} className="mt-4 flex flex-col gap-3">
							<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
								Peso (lb)
								<input
									type="number"
									min="0"
									step="0.5"
									value={weight}
									onChange={(e) => setWeight(e.target.value)}
									placeholder="ej. 135"
									autoFocus
									className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
								/>
							</label>
							<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
								Reps reales
								<input
									type="number"
									min="0"
									step="1"
									value={reps}
									onChange={(e) => setReps(e.target.value)}
									placeholder="ej. 8"
									className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
								/>
							</label>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={closeModal}
									disabled={saving}
									className="min-h-12 flex-1 rounded-xl border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/25 disabled:opacity-50"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={saving}
									className="min-h-12 flex-1 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:opacity-60"
								>
									{saving ? 'Guardando...' : 'Confirmar'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</section>
	)
}

export default ActiveWorkout
