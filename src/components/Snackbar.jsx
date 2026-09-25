import { memo } from 'react'

// Snackbar glassy para avisos (errores de validación en modales).
// Vive fuera del <main> como BottomNav/RestPill: fixed real al viewport y
// por encima de los modales (z-60). Estilo oscuro propio, legible en claro y oscuro.
const Snackbar = memo(function Snackbar({ snack, onClose, theme = 'dark' }) {
	if (!snack) return null
	return (
		<div
			key={snack.key}
			role="alert"
			className={`snackbar glass-card ${snack.tone === 'warn' ? 'warn' : 'error'}${theme === 'light' ? ' snackbar-light' : ''}`}
			style={{ position: 'fixed', zIndex: 60 }}
		>
			<span aria-hidden="true" className="snackbar-dot" />
			<p>{snack.msg}</p>
			<button type="button" onClick={onClose} aria-label="Cerrar aviso" className="snackbar-close">
				×
			</button>
		</div>
	)
})

export default Snackbar
