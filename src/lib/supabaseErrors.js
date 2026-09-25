// Errores legibles de Supabase + escritura tolerante a tabla ausente.
import { supabase } from '../supabaseClient.js'

// Muestra un aviso legible. El detalle técnico solo se imprime en desarrollo:
// en producción la consola queda limpia (nada de errores ni código interno).
export function friendlyError(err) {
	if (import.meta.env.DEV) console.error(err)
	const msg = err?.message ?? String(err ?? '')
	if (/42501|permission denied|permiso/i.test(msg)) return 'tu usuario no tiene permiso en la base de datos'
	if (/Failed to fetch|Network|network|fetch/i.test(msg)) return 'no hay conexión con la base de datos'
	if (/relation .* does not exist|Could not find the table|PGRST/i.test(msg)) return 'falta crear las tablas en la base de datos'
	return 'inténtalo de nuevo'
}

// La tabla `profiles` puede no existir si la migración aún no se aplicó en
// Supabase (el endpoint responde 404). Se detecta una sola vez por sesión y
// a partir de ahí no se vuelve a intentar: cero ruido en consola/red y el
// perfil sigue funcionando en local hasta que se aplique la migración.
let profilesTableState = null // null = sin probar | true = existe | false = no existe
export function isMissingTableError(err) {
	const code = err?.code ?? ''
	const msg = err?.message ?? ''
	return code === 'PGRST205' || /Could not find the table|relation .* does not exist/i.test(`${code} ${msg}`)
}
export function markProfilesChecked(err) {
	if (err) {
		if (isMissingTableError(err)) profilesTableState = false
		return
	}
	profilesTableState = true
}
// Lectura del estado para guards en la app (null = aún sin probar → se intenta).
export function isProfilesTableMissing() {
	return profilesTableState === false
}
// Escritura tolerante a tabla ausente: nunca deja 404s repetidos.
export function upsertProfile(uid, payload) {
	if (!uid || profilesTableState === false) return
	supabase.from('profiles').upsert(payload, { onConflict: 'user_id' }).then(
		({ error }) => markProfilesChecked(error),
		(err) => markProfilesChecked(err),
	)
}
