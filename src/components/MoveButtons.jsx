import { memo } from 'react'

// Flechas para mover el contenido de un día en el modo editar del home.
// Etiquetas con destino ("Mover Pecho y espalda al Jueves") para que quede
// claro que se mueve la rutina, no el día.
const MoveButtons = memo(function MoveButtons({ upLabel, downLabel, canUp, canDown, onMove }) {
	const base = 'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-sm text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'
	return (
		<span className="flex shrink-0 flex-col gap-1">
			<button type="button" onClick={() => onMove(-1)} disabled={!canUp} aria-label={upLabel} title={upLabel} className={base}>↑</button>
			<button type="button" onClick={() => onMove(1)} disabled={!canDown} aria-label={downLabel} title={downLabel} className={base}>↓</button>
		</span>
	)
})

export default MoveButtons
