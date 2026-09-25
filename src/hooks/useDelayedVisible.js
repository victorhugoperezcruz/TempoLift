import { useEffect, useState } from 'react'

// Devuelve true solo si `active` sigue en true tras `delay` ms.
// Así el skeleton solo aparece cuando hay latencia real y nunca
// parpadea en cargas rápidas (no es lo primero que ve el usuario).
// El retardo NO retrasa los datos: el contenido real se muestra en
// cuanto llega; solo retrasa el skeleton para no flashear en cargas
// rápidas. 150ms es el mínimo práctico anti-flash en páginas y 100ms
// en inline (series), donde el gesto ya es del usuario.
export function useDelayedVisible(active, delay = 150) {
	const [visible, setVisible] = useState(false)
	useEffect(() => {
		if (!active) {
			setVisible(false)
			return
		}
		const t = setTimeout(() => setVisible(true), delay)
		return () => clearTimeout(t)
	}, [active, delay])
	return visible
}
