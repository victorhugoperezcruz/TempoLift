import { memo } from 'react'

const Phase = memo(function Phase({ phase, open, onToggle, children, status = null, statusDone = false }) {
	return (
		<section className="border-b border-white/10 last:border-b-0">
			<button
				type="button"
				className="phase-toggle flex min-h-20 w-full items-center justify-between gap-4 py-5 text-left"
				onClick={onToggle}
				aria-expanded={open}
			>
				<span className="flex items-center gap-4">
					<span className="glass-num flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-red-500">{phase.label.replace('Fase ', '0')}</span>
					<span>
						<strong className="block text-lg font-bold text-white">{phase.title}</strong>
						<span className="text-sm text-zinc-400">{phase.detail}</span>
						{status != null && (
							<span className={`phase-status${statusDone ? ' is-done' : ''}`}>{statusDone ? `✓ ${status}` : status}</span>
						)}
					</span>
				</span>
				<span className={`phase-chevron ${open ? 'open' : ''}`} aria-hidden="true">
					<svg viewBox="0 0 16 16" className="phase-chevron-icon">
						<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
			</button>
			{open && (
				<div className="phase-collapse open" aria-hidden={false}>
					<div className="phase-collapse-inner">
						<div className="phase-content pb-5">{children}</div>
					</div>
				</div>
			)}
		</section>
	)
})

export default Phase
