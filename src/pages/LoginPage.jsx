import BackgroundOrbs from '../components/BackgroundOrbs.jsx'

export default function LoginPage({ theme, onSignIn }) {
	return (
		<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-10 text-white`} style={{ backgroundColor: theme === 'light' ? '#f4f6ef' : '#0b0d0c' }}>
			<BackgroundOrbs />
			<div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
				<div className="glass-card w-full max-w-sm rounded-2xl p-8 text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-xl font-black text-white">T</div>
					<h1 className="mt-4 text-3xl font-black tracking-tight">TempoLift</h1>
					<p className="mt-2 text-sm leading-relaxed text-zinc-400">Inicia sesión para ver tu plan semanal de fuerza.</p>
					<button
						type="button"
						onClick={onSignIn}
						className="glass-card mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 text-sm font-bold text-white transition hover:border-red-500/60"
					>
						<span aria-hidden="true">G</span>
						<span>Continuar con Google</span>
					</button>
					<p className="mt-4 text-xs uppercase tracking-widest text-zinc-600">Tempo 3-1-1 · 5 días</p>
				</div>
			</div>
		</main>
	)
}
