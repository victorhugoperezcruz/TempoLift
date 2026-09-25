import { memo } from 'react'
import { formatRest } from '../lib/format.js'

// Mini-timer global: se ve en cualquier pantalla mientras descansas.
// Al volver al entrenamiento aparece la card completa.
// Se renderiza fuera del <main> animado para que `fixed` sea al viewport.
// Recibe `theme` por prop por el mismo motivo que BottomNav: fuera del
// <main> no hereda .theme-light y se quedaba siempre oscuro.
const RestPill = memo(function RestPill({ label, seconds, onReturn, theme = 'dark' }) {
	const isLight = theme === 'light'
	return (
		<button
			type="button"
			onClick={onReturn}
			role="status"
			aria-label={`Volver al entrenamiento, descanso ${formatRest(seconds)}`}
			className="glass-card fixed left-1/2 top-20 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 shadow-2xl shadow-black/40"
			style={{
				position: 'fixed',
				top: '5rem',
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 50,
				backgroundColor: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(11,13,12,0.94)',
			}}
		>
			<span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
			<span className="truncate text-xs font-bold uppercase tracking-widest text-red-400">
				Descanso{label ? ` · ${label}` : ''}
			</span>
			<span className={`text-sm font-black tabular-nums ${isLight ? 'text-zinc-900' : 'text-white'}`}>{formatRest(seconds)}</span>
			<span aria-hidden="true" className="text-xs text-zinc-500">→</span>
		</button>
	)
})

export default RestPill
