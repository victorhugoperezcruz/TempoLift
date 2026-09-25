// Sistema lb/kg: todo se guarda en lb (columna weight_kg histórica);
// solo cambia lo que se muestra.
import { LB_PER_KG } from '../data/plan.js'

export function readWeightUnit() {
	try {
		return localStorage.getItem('tempolift-weight-unit') === 'kg' ? 'kg' : 'lb'
	} catch {
		return 'lb'
	}
}

export function persistWeightUnit(unit) {
	try {
		localStorage.setItem('tempolift-weight-unit', unit)
	} catch {
		// sin localStorage: la preferencia vive solo en memoria
	}
}

// lb (número) → texto en la unidad visible
export function displayWeight(lb, unit) {
	const n = Number(lb)
	if (!Number.isFinite(n)) return ''
	if (unit === 'kg') return String(Math.round((n / LB_PER_KG) * 10) / 10)
	return String(Math.round(n * 10) / 10)
}

// texto visible → lb (número). NaN si no es válido.
export function displayToLb(raw, unit) {
	const v = parseFloat(raw)
	if (!Number.isFinite(v)) return NaN
	return unit === 'kg' ? v * LB_PER_KG : v
}

// Convierte el texto de un input al cambiar de unidad.
export function convertInputUnit(cur, from, to) {
	if (from === to || cur === '') return cur
	const lb = displayToLb(cur, from)
	return Number.isFinite(lb) ? displayWeight(lb, to) : cur
}

// kg (número) → texto en la unidad visible (lb/kg) para el peso corporal
export function bodyKgToDisplay(bodyKg, unit) {
	const kg = Number(bodyKg)
	if (!Number.isFinite(kg)) return ''
	if (unit === 'kg') return String(Math.round(kg * 10) / 10)
	return String(Math.round(kg * LB_PER_KG * 10) / 10)
}

// texto visible → kg (número). NaN si no es válido.
export function displayToBodyKg(raw, unit) {
	const v = parseFloat(raw)
	if (!Number.isFinite(v)) return NaN
	return unit === 'kg' ? v : v / LB_PER_KG
}
