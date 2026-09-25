import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim().replace(/^["']|["']$/g, '');

// La URL base debe ser https://<ref>.supabase.co — si se pegó la URL REST
// (.../rest/v1) las peticiones van a rutas dobles y el gateway responde
// "No API key found in request". Se normaliza aquí como red de seguridad.
if (supabaseUrl) {
	supabaseUrl = supabaseUrl.replace(/\/+$/, '').replace(/\/(rest|auth)\/v1$/, '');
}

if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		'[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa .env.local y reinicia con `npm run dev` (Vite solo lee el .env al arrancar).',
	);
}

export const supabase = createClient(
	supabaseUrl,
	supabaseAnonKey
);