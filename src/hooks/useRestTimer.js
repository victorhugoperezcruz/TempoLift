import { useCallback, useEffect, useRef, useState } from 'react'
import { REST_SECONDS } from '../data/plan.js'
import { formatRest } from '../lib/format.js'
import { readRestTimer, persistRestTimer, clearRestTimer } from '../lib/restTimer.js'

// Descanso basado en deadline (timestamp), persistido por usuario.
// Recibe el uid actual; al cambiar de cuenta muestra el timer propio.
// Devuelve estado + acciones para la card de descanso, la RestPill y resetDay.
export function useRestTimer(uid) {
	// Descanso basado en deadline: se restaura si quedó uno activo al
	// recargar o al volver del segundo plano (ver readRestTimer).
	const [restInit] = useState(() => readRestTimer())
	const [restLeft, setRestLeft] = useState(() => (restInit ? Math.max(0, Math.ceil((restInit.endsAt - Date.now()) / 1000)) : 0))
	const [restLabel, setRestLabel] = useState(() => restInit?.label ?? '')
	const [restSeries, setRestSeries] = useState(() => restInit?.series ?? 1)
	const restEndsAtRef = useRef(restInit?.endsAt ?? 0)
	// uid actual para los callbacks del timer con deps [] (skipRest y el
	// intervalo verían una sesión vieja sin este ref).
	const sessionUidRef = useRef(null)
	sessionUidRef.current = uid ?? null

	const isResting = restLeft > 0

	const startRest = useCallback((label, series = 1, seconds = REST_SECONDS) => {
		const endsAt = Date.now() + seconds * 1000
		restEndsAtRef.current = endsAt
		persistRestTimer(sessionUidRef.current, endsAt, label, series)
		setRestLabel(label ?? '')
		setRestSeries(series)
		setRestLeft(seconds)
	}, [])

	const skipRest = useCallback(() => {
		restEndsAtRef.current = 0
		clearRestTimer(sessionUidRef.current)
		setRestLeft(0)
	}, [])

	// Cuenta atrás del descanso basada en deadline (timestamp).
	// - No acumula deriva: cada tick recalcula ceil((endsAt-now)/1000).
	// - Sobrevive al segundo plano: los timers se pausan/limitan fuera de
	//   la app, pero al volver (visibilitychange/focus) se recalcula al
	//   instante con el tiempo real transcurrido.
	// - Sobrevive a recargas: endsAt vive en localStorage por usuario
	//   (ver restTimerKey).
	useEffect(() => {
		if (restLeft <= 0) {
			if (restEndsAtRef.current) {
				restEndsAtRef.current = 0
				clearRestTimer(sessionUidRef.current)
			}
			return
		}
		if (!restEndsAtRef.current) {
			restEndsAtRef.current = Date.now() + restLeft * 1000
			persistRestTimer(sessionUidRef.current, restEndsAtRef.current, restLabel, restSeries)
		}
		const update = () => {
			const endsAt = restEndsAtRef.current
			if (!endsAt) return
			const remain = Math.ceil((endsAt - Date.now()) / 1000)
			if (remain <= 0) {
				restEndsAtRef.current = 0
				clearRestTimer(sessionUidRef.current)
				setRestLeft(0)
				try {
					navigator.vibrate?.(200)
				} catch {
					// vibrar es opcional
				}
			} else {
				setRestLeft((prev) => (prev === remain ? prev : remain))
			}
		}
		update()
		const id = setInterval(update, 500)
		const onVisible = () => {
			if (!document.hidden) update()
		}
		document.addEventListener('visibilitychange', onVisible)
		window.addEventListener('focus', update)
		return () => {
			clearInterval(id)
			document.removeEventListener('visibilitychange', onVisible)
			window.removeEventListener('focus', update)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- el deadline vive en el ref; re-suscribir por segundo reiniciaría el intervalo
	}, [restLeft > 0])

	// Muestra el tiempo restante en el título de la pestaña mientras
	// descansas, para verlo al cambiar de app/pestaña sin abrir la página.
	useEffect(() => {
		if (restLeft <= 0) return
		const prev = document.title
		document.title = `(${formatRest(restLeft)}) Descanso · TempoLift`
		return () => {
			document.title = prev
		}
	}, [restLeft])

	// Timer por cuenta: al cambiar de sesión se muestra el descanso de esa
	// cuenta (o nada si no tiene). Nunca se toca el temporizador guardado
	// de otra cuenta; cada uno vive en su propia clave y expira solo ahí.
	useEffect(() => {
		if (!uid) {
			// Pantalla de login: no se muestra ningún timer, pero no se
			// borra nada guardado (el dueño lo recupera al volver).
			restEndsAtRef.current = 0
			setRestLeft(0)
			setRestLabel('')
			return
		}
		const saved = readRestTimer(uid)
		if (saved) {
			restEndsAtRef.current = saved.endsAt
			setRestLabel(saved.label ?? '')
			setRestSeries(saved.series ?? 1)
			setRestLeft(Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000)))
		} else {
			restEndsAtRef.current = 0
			setRestLeft(0)
			setRestLabel('')
		}
	}, [uid])

	return { restLeft, restLabel, restSeries, restEndsAtRef, isResting, startRest, skipRest }
}
