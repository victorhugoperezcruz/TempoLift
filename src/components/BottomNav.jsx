import { memo } from 'react'

const ITEMS = [
	{ id: 'home', label: 'Inicio' },
	{ id: 'history', label: 'Historial' },
	{ id: 'profile', label: 'Perfil' },
]

function Icon({ id, active, theme = 'dark' }) {
	const cls = 'h-6 w-6'
	const isLight = theme === 'light'
	const stroke = active ? (isLight ? '#dc2626' : '#7fb0ff') : (isLight ? '#8a938a' : '#8a8f8c')
	const props = {
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke,
		strokeWidth: 1.8,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
		className: cls,
		'aria-hidden': true,
	}
	if (id === 'home') {
		return (
			<svg {...props}>
				<path d="M4 11.5 12 4l8 7.5" />
				<path d="M6.5 10.5V20h11v-9.5" />
				<path d="M10 20v-5h4v5" />
			</svg>
		)
	}
	if (id === 'history') {
		return (
			<svg {...props}>
				<circle cx="12" cy="12" r="8.5" />
				<path d="M12 7.5V12l3.5 2" />
			</svg>
		)
	}
	return (
		<svg {...props}>
			<circle cx="12" cy="8" r="3.8" />
			<path d="M5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" />
		</svg>
	)
}

const BottomNav = memo(function BottomNav({ value = 'home', onChange, theme = 'dark' }) {
	// `bottom-nav` (App.css) fija position:fixed con !important como red de
	// seguridad si Tailwind no genera las utilidades en el build de prod.
	// Se renderiza FUERA del <main class="screen-enter"> (ver App.jsx):
	// un ancestro con animación `both` retiene transform y convierte el
	// `fixed` en relativo al main, obligando a deslizar hasta abajo.
	// Por eso recibe `theme` por prop: fuera del <main> no le llegan las
	// clases .theme-light/.theme-dark del ancestro y se quedaba siempre oscura.
	const isLight = theme === 'light'
	return (
		<nav
			aria-label="Navegación principal"
			className={`bottom-nav bottom-nav-${theme} fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2`}
			style={{
				position: 'fixed',
				bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 40,
			}}
		>
			<div
				className="glass-card flex items-center justify-around rounded-[28px] px-6 py-2.5"
				style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(11,13,12,0.92)' }}
			>
				{ITEMS.map((item) => {
					const active = value === item.id
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onChange && onChange(item.id)}
							aria-label={item.label}
							aria-current={active ? 'page' : undefined}
							className={`flex h-12 w-12 items-center justify-center rounded-full transition ${active ? (isLight ? 'bg-red-500/15 shadow-[0_0_18px_rgba(220,38,38,0.25)]' : 'bg-[#27436e] shadow-[0_0_18px_rgba(80,140,255,0.35)]') : 'bg-transparent hover:bg-white/5'}`}
						>
							<Icon id={item.id} active={active} theme={theme} />
						</button>
					)
				})}
			</div>
		</nav>
	)
})

export default BottomNav
