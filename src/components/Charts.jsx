import { memo } from 'react'

// Gráficas SVG puras del perfil, sin dependencias.

// Barras apiladas de kcal por sesión (fuerza + cardio + calentamiento). SVG puro, sin dependencias.
export const CalorieBars = memo(function CalorieBars({ data }) {
	if (data.length === 0) return null
	const W = 340
	const H = 170
	const PAD_L = 34
	const PAD_B = 20
	const PAD_T = 24
	const max = Math.max(1, ...data.map((d) => d.strength + d.cardio + d.warmup))
	const totals = data.map((d) => d.strength + d.cardio + d.warmup)
	const avg = totals.reduce((a, v) => a + v, 0) / Math.max(1, totals.length)
	const innerW = W - PAD_L - 8
	const innerH = H - PAD_T - PAD_B
	const slot = innerW / data.length
	const bw = Math.min(30, slot * 0.52)
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Calorías estimadas por sesión">
			{[0.25, 0.5, 0.75, 1].map((f) => {
				const y = PAD_T + innerH * (1 - f)
				return (
					<g key={f}>
						<line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
						<text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#71717a">{Math.round(max * f)}</text>
					</g>
				)
			})}
			{avg > 0 && (() => {
				const y = PAD_T + innerH * (1 - avg / max)
				return (
					<g>
						<line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="#f87171" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
						<text x={W - 8} y={y - 4} textAnchor="end" fontSize="8" fontWeight="700" fill="#f87171">Prom ~{Math.round(avg)}</text>
					</g>
				)
			})()}
			{data.map((d, i) => {
				const total = d.strength + d.cardio + d.warmup
				const h = Math.max(total > 0 ? 3 : 0, (total / max) * innerH)
				const hs = (d.strength / max) * innerH
				const hc = (d.cardio / max) * innerH
				const hw = (d.warmup / max) * innerH
				const x = PAD_L + slot * i + (slot - bw) / 2
				const y = PAD_T + innerH - h
				return (
					<g key={d.id}>
						<title>{`${d.label}: ~${Math.round(total)} kcal (fuerza ~${Math.round(d.strength)} + cardio ~${Math.round(d.cardio)} + calent. ~${Math.round(d.warmup)})`}</title>
						<rect x={x} y={y} width={bw} height={h} rx="4" fill="rgba(255,255,255,0.06)" />
						{d.strength > 0 && (
							<rect x={x} y={PAD_T + innerH - hs} width={bw} height={hs} fill="#ef4444" />
						)}
						{d.cardio > 0 && (
							<rect x={x} y={PAD_T + innerH - hs - hc} width={bw} height={hc} fill="#f59e0b" />
						)}
						{d.warmup > 0 && (
							<rect x={x} y={y} width={bw} height={hw} rx="4" fill="#38bdf8" />
						)}
						<text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="8" fontWeight="800" fill="#e4e4e7">{Math.round(total)}</text>
						<text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#71717a">{d.short}</text>
					</g>
				)
			})}
		</svg>
	)
})

// Barras de constancia: sesiones por semana + línea de meta (5/semana). SVG puro.
export const WeekBars = memo(function WeekBars({ data, goal = 5 }) {
	if (data.length === 0) return null
	const W = 340
	const H = 150
	const PAD_L = 22
	const PAD_B = 20
	const PAD_T = 22
	const max = Math.max(goal, 1, ...data.map((d) => d.value))
	const innerW = W - PAD_L - 8
	const innerH = H - PAD_T - PAD_B
	const slot = innerW / data.length
	const bw = Math.min(26, slot * 0.55)
	const goalY = PAD_T + innerH * (1 - goal / max)
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Sesiones por semana, meta ${goal}`}>
			<g>
				<line x1={PAD_L} y1={goalY} x2={W - 8} y2={goalY} stroke="#22c55e" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
				<text x={W - 8} y={goalY - 4} textAnchor="end" fontSize="8" fontWeight="700" fill="#22c55e">Meta {goal}</text>
			</g>
			{data.map((d, i) => {
				const h = Math.max(d.value > 0 ? 4 : 0, (d.value / max) * innerH)
				const x = PAD_L + slot * i + (slot - bw) / 2
				const y = PAD_T + innerH - h
				return (
					<g key={d.id}>
						<title>{`${d.label}: ${d.value} ${d.value === 1 ? 'sesión' : 'sesiones'}`}</title>
						<text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="800" fill={d.current ? '#f87171' : '#e4e4e7'}>{d.value}</text>
						<rect x={x} y={y} width={bw} height={h} rx="4" fill={d.current ? '#ef4444' : d.value >= goal ? '#22c55e' : 'rgba(255,255,255,0.22)'} opacity={d.current ? 1 : 0.85} />
						<text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fontWeight={d.current ? 800 : 400} fill={d.current ? '#f87171' : '#71717a'}>{d.short}</text>
					</g>
				)
			})}
		</svg>
	)
})

// Línea de tendencia genérica (p. ej. peso total movido por sesión). SVG puro.
export const TrendLine = memo(function TrendLine({ data, color = '#22c55e', unit = '' }) {
	if (data.length === 0) return null
	const W = 340
	const H = 130
	const PAD_L = 38
	const PAD_B = 20
	const PAD_T = 14
	const vals = data.map((d) => d.value)
	const max = Math.max(...vals)
	const min = Math.min(...vals)
	const span = max - min || 1
	const innerW = W - PAD_L - 8
	const innerH = H - PAD_T - PAD_B
	const px = (i) => PAD_L + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1))
	const py = (v) => PAD_T + innerH * (1 - (v - min) / span)
	const points = data.map((d, i) => `${px(i)},${py(d.value)}`).join(' ')
	const last = data[data.length - 1]
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tendencia ${unit}`}>
			{[0, 0.5, 1].map((f) => {
				const v = min + span * f
				const y = py(v)
				return (
					<g key={f}>
						<line x1={PAD_L} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
						<text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#71717a">{Math.round(v)}</text>
					</g>
				)
			})}
			<polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
			{data.map((d, i) => (
				<g key={d.id}>
					<title>{`${d.label}: ${Math.round(d.value)} ${unit}`}</title>
					<circle cx={px(i)} cy={py(d.value)} r={i === data.length - 1 ? 4.5 : 3} fill={color} stroke="#0b0d0c" strokeWidth="1.5" />
					{i % Math.ceil(data.length / 6) === 0 && (
						<text x={px(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#71717a">{d.short}</text>
					)}
				</g>
			))}
			<text x={W - 10} y={py(last.value) - 8} textAnchor="end" fontSize="10" fontWeight="800" fill={color}>
				{Math.round(last.value)} {unit}
			</text>
		</svg>
	)
})
