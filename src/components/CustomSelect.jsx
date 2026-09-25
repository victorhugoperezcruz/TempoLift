import { memo, useEffect, useRef, useState } from 'react'

// Opciones de sexo (mismo catálogo en onboarding y perfil).
const SEX_OPTIONS = [
	{ value: 'masculino', label: 'Masculino' },
	{ value: 'femenino', label: 'Femenino' },
	{ value: 'otro', label: 'Otro' },
]

// Combobox personalizado (reemplaza al <select> vanilla): botón + lista
// con el mismo sistema glassy de la app, navegable por teclado y con
// soporte de tema claro/oscuro vía .theme-light.
const CustomSelect = memo(function CustomSelect({ value, onChange, options = SEX_OPTIONS, placeholder = 'Selecciona…', ariaLabel = 'Seleccionar opción' }) {
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(-1)
	const rootRef = useRef(null)
	const selected = options.find((o) => o.value === value) ?? null

	useEffect(() => {
		if (!open) return
		const onPointer = (e) => {
			if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
		}
		const onKey = (e) => {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', onPointer)
		document.addEventListener('touchstart', onPointer)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onPointer)
			document.removeEventListener('touchstart', onPointer)
			document.removeEventListener('keydown', onKey)
		}
	}, [open ])

	const pick = (v) => {
		onChange(v)
		setOpen(false)
		setActive(-1)
	}

	const onTriggerKey = (e) => {
		if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			setOpen((v) => !v)
			setActive(options.findIndex((o) => o.value === value))
		}
	}

	const onListKey = (e) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActive((i) => (i + 1) % (options.length + 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActive((i) => (i <= 0 ? options.length : i - 1))
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			if (active === -1 || active === options.length) pick('')
			else if (options[active]) pick(options[active].value)
		}
	}

	return (
		<div ref={rootRef} className={`custom-select ${open ? 'open' : ''}`}>
			<button
				type="button"
				className="custom-select-btn glass-inset"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={ariaLabel}
				onClick={() => { setOpen((v) => !v); setActive(options.findIndex((o) => o.value === value)) }}
				onKeyDown={onTriggerKey}
			>
				<span className={selected ? 'custom-select-value' : 'custom-select-placeholder'}>
					{selected ? selected.label : placeholder}
				</span>
				<svg viewBox="0 0 16 16" aria-hidden="true" className={`custom-select-chevron ${open ? 'open' : ''}`}>
					<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>
			{open && (
				<ul className="custom-select-list glass-card" role="listbox" aria-label={ariaLabel} onKeyDown={onListKey} tabIndex={-1}>
					<li role="option" aria-selected={value === ''} className={`custom-select-option ${value === '' ? 'selected' : ''} ${active === options.length ? 'active' : ''}`}>
						<button type="button" className="custom-select-option-btn is-clear" onClick={() => pick('')} onMouseEnter={() => setActive(options.length)}>
							<span>{placeholder}</span>
							{value === '' && <span aria-hidden="true" className="custom-select-check">✓</span>}
						</button>
					</li>
					{options.map((opt, i) => {
						const isSel = opt.value === value
						return (
							<li key={opt.value} role="option" aria-selected={isSel} className={`custom-select-option ${isSel ? 'selected' : ''} ${active === i ? 'active' : ''}`}>
								<button type="button" className="custom-select-option-btn" onClick={() => pick(opt.value)} onMouseEnter={() => setActive(i)}>
									<span>{opt.label}</span>
									{isSel && <span aria-hidden="true" className="custom-select-check">✓</span>}
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
})

export default CustomSelect
