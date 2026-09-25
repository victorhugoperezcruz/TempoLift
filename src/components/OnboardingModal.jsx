import { memo } from 'react'
import { FINE_POINTER } from '../lib/format.js'
import UnitToggle from './UnitToggle.jsx'
import CustomSelect from './CustomSelect.jsx'

// Onboarding de cuentas nuevas: datos básicos para las stats (peso, altura, edad, sexo).
const OnboardingModal = memo(function OnboardingModal({ form, setForm, unit, onSwitchUnit, error, saving, onSubmit, onSkip, theme = 'dark' }) {
	return (
		<div className={`fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-black/70 p-4 sm:p-5${theme === 'light' ? ' modal-light' : ''}`} role="dialog" aria-modal="true" aria-label="Completa tus datos básicos">
			<div className="glass-card modal-card m-auto w-full max-w-sm rounded-2xl p-5">
				<h3 className="text-lg font-black text-white">Bienvenido · tus datos básicos</h3>
				<p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Nos ayudan a calcular tus stats (kcal, IMC)</p>
				<form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
					<UnitToggle unit={unit} onSwitch={onSwitchUnit} />
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						Tu peso ({unit}) *
						<input
							type="number"
							min="0"
							step="0.5"
							value={form.weight}
							onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
							placeholder={unit === 'kg' ? 'ej. 75' : 'ej. 165'}
							autoFocus={FINE_POINTER}
							className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
						/>
					</label>
					<div className="grid grid-cols-2 gap-2">
						<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
							Altura (cm)
							<input
								type="number"
								min="100"
								max="250"
								step="0.5"
								value={form.height}
								onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
								placeholder="ej. 175"
								className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
							/>
						</label>
						<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
							Edad
							<input
								type="number"
								min="10"
								max="100"
								step="1"
								value={form.age}
								onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
								placeholder="ej. 28"
								className="glass-inset rounded-xl px-4 py-3 text-sm normal-case tracking-normal text-white placeholder:text-zinc-600"
							/>
						</label>
					</div>
					<div className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
						<span id="onboarding-sex-label">Sexo</span>
						<CustomSelect
							value={form.sex}
							onChange={(v) => setForm((p) => ({ ...p, sex: v }))}
							placeholder="Prefiero no decir"
							ariaLabel="Tu sexo"
						/>
					</div>
					{error && (
						<p className="text-sm text-red-400">{error}</p>
					)}
					<button
						type="submit"
						disabled={saving}
						className="min-h-12 w-full rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition disabled:opacity-60"
					>
						{saving ? 'Guardando…' : 'Guardar y empezar'}
					</button>
					<button
						type="button"
						onClick={onSkip}
						className="min-h-10 w-full rounded-xl border border-white/10 px-4 text-xs font-bold uppercase tracking-widest text-zinc-400 transition hover:border-white/25"
					>
						Omitir por ahora
					</button>
				</form>
			</div>
		</div>
	)
})

export default OnboardingModal
