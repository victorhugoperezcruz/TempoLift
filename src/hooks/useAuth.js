import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

// Sesión + gate de arranque: mientras se resuelve getSession no se sabe si
// hay usuario (sin esto la pantalla de login parpadea antes de entrar).
export function useAuth() {
	const [session, setSession] = useState(null)
	// Arranque de auth: mientras se resuelve getSession no se sabe si hay
	// usuario. Sin esto la pantalla de login parpadea antes de entrar.
	const [authChecking, setAuthChecking] = useState(true)

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
			setAuthChecking(false)
		}).catch(() => {
			setAuthChecking(false)
		})
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
			setAuthChecking(false)
		})
		return () => subscription.unsubscribe()
	}, [])

	const signInWithGoogle = useCallback(async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: window.location.origin,
			},
		})
	}, [])
	const signOut = useCallback(async () => {
		await supabase.auth.signOut()
	}, [])

	return { session, authChecking, signInWithGoogle, signOut }
}
