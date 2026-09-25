// Traducción ES de los términos del dataset (vienen en inglés).
// Se aplica a todas las pills del acordeón: zona, músculo e implemento,
// tanto de la variante activa como del plan, del carrusel y de la biserie.
// Desconocido → se devuelve el original (nunca en blanco).

const BODY_PART_ES = {
	'chest': 'Pecho',
	'back': 'Espalda',
	'upper legs': 'Piernas',
	'lower legs': 'Piernas',
	'shoulders': 'Hombros',
	'upper arms': 'Brazos',
	'lower arms': 'Antebrazos',
	'waist': 'Abdomen',
	'neck': 'Cuello',
	'cardio': 'Cardio',
}

const TARGET_ES = {
	'pectorals': 'Pecho',
	'traps': 'Trapecios',
	'upper back': 'Espalda alta',
	'lats': 'Dorsales',
	'delts': 'Deltoides',
	'biceps': 'Bíceps',
	'triceps': 'Tríceps',
	'forearms': 'Antebrazos',
	'abs': 'Abdomen',
	'obliques': 'Oblicuos',
	'quads': 'Cuádriceps',
	'hamstrings': 'Isquios',
	'glutes': 'Glúteos',
	'calves': 'Pantorrillas',
	'adductors': 'Aductores',
	'abductors': 'Abductores',
}

const EQUIPMENT_ES = {
	'leverage machine': 'Máquina',
	'sled machine': 'Máquina',
	'smith machine': 'Máquina Smith',
	'machine': 'Máquina',
	'cable': 'Polea',
	'barbell': 'Barra',
	'dumbbell': 'Mancuerna',
	'kettlebell': 'Pesa rusa',
	'band': 'Banda',
	'body weight': 'Peso corporal',
}

function lookup(dict, term) {
	if (term == null) return null
	const key = String(term).trim().toLowerCase()
	if (!key) return null
	return dict[key] ?? null
}

// Traduce cualquier término del dataset (zona, músculo o implemento).
export function translateTerm(term) {
	if (term == null) return null
	return lookup(BODY_PART_ES, term) ?? lookup(TARGET_ES, term) ?? lookup(EQUIPMENT_ES, term) ?? String(term).trim()
}

// Lista traducida, sin vacíos ni duplicados (p. ej. zona y músculo que
// caen en el mismo "Pecho" salen una sola vez).
export function translateTerms(terms) {
	const out = []
	for (const t of terms ?? []) {
		const es = translateTerm(t)
		if (es && !out.includes(es)) out.push(es)
	}
	return out
}
