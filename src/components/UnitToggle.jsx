import { memo } from 'react'

// Selector de unidad lb/kg para los modales de peso. Todo se guarda en lb.
const UnitToggle = memo(function UnitToggle({ unit, onSwitch }) {
	return (
		<div className="glass-inset flex rounded-xl p-1" role="group" aria-label="Unidad de peso">
			{['lb', 'kg'].map((u) => (
				<button
					key={u}
					type="button"
					onClick={() => onSwitch(u)}
					aria-pressed={unit === u}
					className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${unit === u ? 'bg-red-500 text-white' : 'text-zinc-500 hover:text-white'}`}
				>
					{u === 'lb' ? 'lb' : 'kg'}
				</button>
			))}
		</div>
	)
})

export default UnitToggle
