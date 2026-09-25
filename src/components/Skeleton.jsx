import { memo } from 'react'

const Bar = memo(function Bar({ className = '', style }) {
	return <span aria-hidden="true" className={`skel ${className}`} style={style} />
})

function Dots({ count = 3 }) {
	return (
		<span aria-hidden="true" className="skel-dots">
			{Array.from({ length: count }).map((_, i) => (
				<span key={i} className="skel skel-dot" />
			))}
		</span>
	)
}

// Card genérica estilo imagen: cabecera (punto + 2 líneas),
// bloque grande y puntos abajo.
export const SkeletonCard = memo(function SkeletonCard({ lines = 2 }) {
	return (
		<div aria-hidden="true" className="glass-card rounded-2xl p-5">
			<div className="flex items-center gap-3">
				<Bar className="skel-avatar" />
				<span className="flex min-w-0 flex-1 flex-col gap-2">
					<Bar className="skel-line" style={{ width: '42%' }} />
					{lines >= 2 && <Bar className="skel-line skel-line-sm" style={{ width: '28%' }} />}
				</span>
			</div>
			<Bar className="skel-block" />
			<Dots />
		</div>
	)
})

export const BootSkeleton = memo(function BootSkeleton({ theme = 'dark' }) {
	return (
		<main className={`screen-enter theme-${theme} app-shell mx-auto min-h-screen max-w-lg px-5 pb-28 text-white`} style={{ backgroundColor: '#0b0d0c' }}>
			<div className="relative z-10 flex items-center gap-3 py-6">
				<Bar className="skel-badge" />
				<Bar className="skel-line" style={{ width: 120 }} />
			</div>
			<div className="relative z-10 flex flex-col gap-4" role="status" aria-label="Cargando TempoLift">
				<SkeletonCard />
				<SkeletonCard lines={1} />
			</div>
		</main>
	)
})

export const HomeSkeleton = memo(function HomeSkeleton() {
	return (
		<div className="flex flex-col gap-4" role="status" aria-label="Cargando tu semana">
			<div aria-hidden="true" className="flex flex-col gap-2">
				<Bar className="skel-line" style={{ width: '38%' }} />
				<Bar className="skel-title" style={{ width: '62%' }} />
				<Bar className="skel-line skel-line-sm" style={{ width: '80%' }} />
			</div>
			<div aria-hidden="true" className="glass-card rounded-2xl p-3">
				<div className="flex flex-col gap-2">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="day-row flex min-h-24 w-full flex-col justify-center gap-2 px-5 py-4">
							<span className="flex items-center gap-4">
								<Bar className="skel-badge" />
								<span className="flex min-w-0 flex-1 flex-col gap-2">
									<Bar className="skel-line" style={{ width: `${58 - i * 6}%` }} />
									<Bar className="skel-line skel-line-sm" style={{ width: '44%' }} />
								</span>
							</span>
							<Bar className="skel-progress" />
						</div>
					))}
				</div>
			</div>
			<Dots />
		</div>
	)
})

export const DaySkeleton = memo(function DaySkeleton({ rows = 5 }) {
	return (
		<div className="flex flex-col gap-4" role="status" aria-label="Cargando rutina">
			<div aria-hidden="true" className="glass-card rounded-2xl p-4">
				<div className="mb-2 flex items-center justify-between">
					<Bar className="skel-line skel-line-sm" style={{ width: '40%' }} />
					<Bar className="skel-line skel-line-sm" style={{ width: 48 }} />
				</div>
				<Bar className="skel-progress" />
				<div className="mt-3 flex flex-col gap-2">
					<Bar className="skel-line" style={{ width: '72%' }} />
					<Bar className="skel-line skel-line-sm" style={{ width: '55%' }} />
				</div>
			</div>
			<div aria-hidden="true" className="glass-card rounded-2xl p-5">
				<div className="flex flex-col gap-3">
					{Array.from({ length: rows }).map((_, i) => (
						<div key={i} className="flex items-center gap-3">
							<Bar className="skel-check" />
							<span className="flex min-w-0 flex-1 flex-col gap-2">
								<Bar className="skel-line" style={{ width: `${64 - (i % 3) * 8}%` }} />
								<Bar className="skel-line skel-line-sm" style={{ width: '40%' }} />
							</span>
							<Bar className="skel-line skel-line-sm" style={{ width: 36 }} />
						</div>
					))}
				</div>
			</div>
		</div>
	)
})

export const HistorySkeleton = memo(function HistorySkeleton({ cards = 3 }) {
	return (
		<div className="flex flex-col gap-4" role="status" aria-label="Cargando historial">
			<div aria-hidden="true" className="glass-card rounded-2xl p-5">
				<Bar className="skel-title" style={{ width: '45%' }} />
				<Bar className="skel-line skel-line-sm mt-2" style={{ width: '30%' }} />
				<div className="mt-4 flex flex-col gap-2">
					{Array.from({ length: cards }).map((_, i) => (
						<div key={i} className="glass-inset rounded-xl px-4 py-3">
							<div className="flex items-center gap-3">
								<Bar className="skel-avatar" />
								<span className="flex min-w-0 flex-1 flex-col gap-2">
									<Bar className="skel-line" style={{ width: `${55 - i * 5}%` }} />
									<Bar className="skel-line skel-line-sm" style={{ width: '70%' }} />
								</span>
							</div>
							<Bar className="skel-block skel-block-sm" />
						</div>
					))}
				</div>
			</div>
			<Dots />
		</div>
	)
})

export const ProfileSkeleton = memo(function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-4" role="status" aria-label="Cargando tu perfil">
			<div aria-hidden="true" className="glass-card rounded-2xl p-5 text-center">
				<Bar className="skel-avatar skel-avatar-lg mx-auto" />
				<Bar className="skel-title mx-auto mt-3" style={{ width: 140 }} />
				<Bar className="skel-line skel-line-sm mx-auto mt-2" style={{ width: 180 }} />
			</div>
			<div aria-hidden="true" className="glass-card rounded-2xl p-5">
				<Bar className="skel-line skel-line-sm" style={{ width: '55%' }} />
				<div className="mt-3 grid grid-cols-4 gap-2">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="glass-inset rounded-xl px-1 py-3">
							<Bar className="skel-line mx-auto" style={{ width: '60%' }} />
							<Bar className="skel-line skel-line-sm mx-auto mt-2" style={{ width: '70%' }} />
						</div>
					))}
				</div>
				<Bar className="skel-line skel-line-sm mt-3" style={{ width: '75%' }} />
			</div>
			<SkeletonCard />
			<SkeletonCard lines={1} />
		</div>
	)
})

export const SetsSkeleton = memo(function SetsSkeleton({ rows = 3 }) {
	return (
		<div className="mt-3 flex flex-col gap-2" role="status" aria-label="Cargando series">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} aria-hidden="true" className="rounded-lg bg-white/[0.03] px-3 py-2">
					<Bar className="skel-line" style={{ width: `${80 - i * 10}%` }} />
					<Bar className="skel-line skel-line-sm mt-2" style={{ width: '45%' }} />
				</div>
			))}
		</div>
	)
})
