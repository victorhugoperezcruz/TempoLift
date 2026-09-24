import { memo } from 'react'

const ITEMS = [
	{ id: 'home', label: 'Inicio' },
	{ id: 'history', label: 'Historial' },
	{ id: 'profile', label: 'Perfil' },
]

function Icon({ id, active }) {
	const cls = 'h-6 w-6'
	const stroke = active ? '#7fb0ff' : '#8a8f8c'
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

const BottomNav = memo(function BottomNav({ value = 'home', onChange }) {
	return (
		<nav aria-label="Navegación principal" className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
			<div className="glass-card flex items-center justify-around rounded-[28px] px-6 py-2.5" style={{ backgroundColor: 'rgba(11,13,12,0.92)' }}>
				{ITEMS.map((item) => {
					const active = value === item.id
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onChange && onChange(item.id)}
							aria-label={item.label}
							aria-current={active ? 'page' : undefined}
							className={`flex h-12 w-12 items-center justify-center rounded-full transition ${active ? 'bg-[#27436e] shadow-[0_0_18px_rgba(80,140,255,0.35)]' : 'bg-transparent hover:bg-white/5'}`}
						>
							<Icon id={item.id} active={active} />
						</button>
					)
				})}
			</div>
		</nav>
	)
})

export default BottomNav
