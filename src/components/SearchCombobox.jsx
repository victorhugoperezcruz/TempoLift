import { memo, useEffect, useRef, useState } from 'react'

// Combobox con búsqueda y texto libre: filtra las opciones al escribir y
// acepta valores nuevos (el submit usa el texto tal cual). Mismo sistema
// glassy y teclado que CustomSelect.
const SearchCombobox = memo(function SearchCombobox({ value, onChange, options = [], placeholder = 'Buscar o escribir…', ariaLabel = 'Buscar ejercicio', loading = false }) {
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(0)
	const rootRef = useRef(null)
	const q = value.trim().toLowerCase()
	const filtered = (options ?? []).filter((o) => o.toLowerCase().includes(q)).slice(0, 8)
	const exact = filtered.some((o) => o.toLowerCase() === q)

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
	}, [open])

	const pick = (v) => {
		onChange(v)
		setOpen(false)
	}

	const onListKey = (e) => {
		const rows = filtered.length + (q && !exact ? 1 : 0)
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActive((i) => (i + 1) % Math.max(1, rows))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActive((i) => (i - 1 + Math.max(1, rows)) % Math.max(1, rows))
		} else if (e.key === 'Enter') {
			if (open && rows > 0) {
				e.preventDefault()
				if (active < filtered.length) pick(filtered[active])
				else setOpen(false)
			}
		}
	}

	return (
		<div ref={rootRef} className={`custom-select search-combobox ${open ? 'open' : ''}`}>
			<input
				type="text"
				value={value}
				onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0) }}
				onFocus={() => setOpen(true)}
				onKeyDown={onListKey}
				placeholder={placeholder}
				aria-label={ariaLabel}
				role="combobox"
				aria-expanded={open}
				aria-autocomplete="list"
				autoComplete="off"
				className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600 search-input"
			/>
			{open && (
				<ul className="custom-select-list glass-card" role="listbox" aria-label={ariaLabel}>
					{loading && (
						<li className="custom-select-option" aria-disabled="true">
							<span className="custom-select-option-btn"><span>Buscando en tu base…</span></span>
						</li>
					)}
					{!loading && filtered.map((opt, i) => (
						<li key={opt} role="option" aria-selected={false} className={`custom-select-option ${active === i ? 'active' : ''}`}>
							<button type="button" className="custom-select-option-btn" onClick={() => pick(opt)} onMouseEnter={() => setActive(i)}>
								<span>{opt}</span>
							</button>
						</li>
					))}
					{!loading && filtered.length === 0 && (
						<li className="custom-select-option" aria-disabled="true">
							<span className="custom-select-option-btn"><span>{q ? `Usar «${value.trim()}» como nuevo` : 'Escribe para buscar o agregar'}</span></span>
						</li>
					)}
				</ul>
			)}
		</div>
	)
})

export default SearchCombobox
