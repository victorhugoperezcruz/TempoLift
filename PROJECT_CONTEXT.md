# TempoLift — Archivo de Contexto del Proyecto

> Actualizado el 2026-10-21: catálogo separado por implemento (56 ejercicios en `BUNDLES`), 12 rutinas en `workoutDays` (Pierna 1 y Pierna 2 ampliadas a 7 ejercicios cada una cubriendo músculos rezagados, más rutinas PPL y Upper/Lower), selector de splits famosos (`SplitPickerModal.jsx`), sustitución persistente de ejercicios por rutina (`routineOverrides.js` + `SwapExerciseModal.jsx` con buscador en tiempo real al abrir el catálogo completo), `CustomSelect` con scroll interno + apertura inteligente hacia arriba (`drop-up`) + fix de stacking context en `.day-row`, ajuste de meta semanal que preserva los días editados sin mezclar rutinas (forzando Full Body en 1 día), reinicio semanal inteligente (`computeDoneWorkoutIds`) que resuelve reposiciones y acarreos automáticamente, y optimización integral de rendimiento (cero consumo de GPU/CPU en segundo plano al pausar orbes y GIFs con `document.hidden`, memoización real de `ExerciseItem` durante la cuenta atrás, y consultas a Supabase en lote y en paralelo).
> Fuente de verdad: `src/App.jsx` (~1880 líneas, orquestador), `src/data/plan.js`, `src/lib/*` (`routineOverrides.js`, `weekly.js`, `health.js`, `terms.js`, etc.), `src/hooks/useAuth.js` + `useRestTimer.js` + `useDelayedVisible.js`, `src/components/*` (incl. `SplitPickerModal.jsx`, `SwapExerciseModal.jsx`, `CustomSelect.jsx`, `WorkoutModals.jsx`, `Charts.jsx`), `src/pages/*` (Login/Home/Day/History/Profile), `src/services/*`, `src/supabaseClient.js`, `src/main.jsx`, `src/index.css`, `src/App.css`, `package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`, `supabase/migrations/*.sql`.

## 1. Qué es

**TempoLift** es una SPA React + Vite + Supabase (sin router) para seguir un plan semanal de fuerza de 5 días estilo Planet Fitness, con tempo `3-1-1` y descanso `2-3 min`, ahora con **auth, historial persistente, pesos por serie, cardio/calentamiento contabilizados, estimación de kcal y perfil con stats**.

- Entrada: `index.html` → `div#root` → `src/main.jsx` (StrictMode) → `src/App.jsx`.
- Auth gate con `authChecking`: mientras se resuelve `getSession` no se muestra ni login ni app (fondo vacío, y skeleton solo si tarda >150ms); sin `session` solo login con Google; con sesión `home / history / profile` + detalle de día.
- Estilos: Tailwind (`src/index.css` + base body `#0b0d0c`) + `src/App.css` (sistema glassy, animaciones, tema claro, responsive, carrusel, visor GIF, bottom-nav, custom-select + fix z-index `:has(.open)`, modal-card, snackbar, day-row/day-list, skeletons `.skel` con shimmer).
- Lint: `oxlint`. Build: `vite build`. Dev: `vite`.
- PERF GPU y segundo plano: orbes estáticos sin `filter:blur` ni animación infinita (`animation: none` en `.orb`) para no forzar recomposición a 60fps detrás de capas `backdrop-filter`; `.day-row` sin `backdrop-filter` anidado redundante (ya vive dentro de `.glass-card`); transiciones de tema acotadas a contenedores principales (sin selector universal `.theme-dark *, .theme-light *`); superficies fijas/sticky casi opacas sin `backdrop-filter` (RestPill, snackbar, BottomNav, card sticky); GIFs animados de ejercicios pausados automáticamente a su póster `.jpg` cuando `document.hidden === true`.
- Tema claro fuera del `<main>`: modales y snackbar viven fuera (el `fixed` se rompería dentro) y no heredan `.theme-light`; llevan variante por clase (`.modal-light` / `.snackbar-light`, misma paleta) con `theme` por prop, igual que BottomNav/RestPill.
- Layout: columna única `max-w-lg` en TODAS las vistas (el home usaba `max-w-4xl` y "respiraba" al cambiar de pestaña en desktop); fondo del `body` según tema por effect (en claro los márgenes laterales son claros).

## 2. Stack

| Capa | Versión / detalle |
|---|---|
| `react`, `react-dom` | `^19.2.8` |
| `vite`, `@vitejs/plugin-react` | `^8.2.2`, `^6.1.0` |
| `tailwindcss`, `postcss`, `autoprefixer` | `^3.4.19`, `^8.5.28`, `^10.5.5` |
| `@supabase/supabase-js` | `^2.117.1` |
| Contenido Tailwind | `./index.html`, `./src/**/*.{js,ts,jsx,tsx}` |
| Backend | Supabase: Auth Google OAuth + Postgres + RLS por `user_id` |
| Estado | `useState`/`useEffect`/`useCallback`/`useMemo`/`useRef` en memoria + `localStorage` solo para prefs/perfil/orden/meta (ver F11) |
| Datos ejercicios | Catálogo curado local en `exercisesApi.js`, medios remotos bajo demanda (GIF/JPG de `exercises-dataset`) |
| Datos entreno | Supabase (`routines`, `exercises`, `routine_exercises`, `workout_sessions`, `set_logs`, `profiles`) vía `planSync.js` |

## 3. Estructura de archivos

```
index.html                          # título TempoLift, div#root
public/favicon.svg, public/icons.svg
src/main.jsx                        # bootstrap React (sin cambios)
src/App.jsx                         # ~1880 líneas: orquestador (estado + handlers + effects + switch de páginas). Sin JSX de vistas ni helpers puros
src/data/plan.js                    # ~570 líneas: workoutDays (12 rutinas), weekSchedule, SPLIT_TEMPLATES, adjustWeekMapForGoal, FULL_BODY_IDS, consts kcal, hints, EXERCISE_RENAMES
src/lib/format.js                   # formatRest + FINE_POINTER
src/lib/weights.js                  # sistema lb/kg (display/convert) + peso corporal display
src/lib/profile.js                  # tema, perfil local, bodyKg, isProfileComplete
src/lib/supabaseErrors.js           # friendlyError + upsertProfile tolerante (profilesTableState)
src/lib/health.js                   # kcal (fuerza/cardio/warmup), parseSessionExtras, dayStreak, sessionsByWeek, VOLUME_CHARTS + sessionVolumeByBodyPart + persistencia de gráficas activas
src/lib/restTimer.js                # timer por usuario (deadline + migración legado)
src/lib/draft.js                    # borrador rutina activa + hasOtherDayProgress
src/lib/weekly.js                   # trainingWeekStart + done journal + computeDoneWorkoutIds (reinicio inteligente ante reposiciones y acarreos)
src/lib/routineOverrides.js         # sustituciones de ejercicios por rutina y usuario (read/persist/applyRoutineOverrides)
src/lib/terms.js                    # traducción de músculos/zonas/equipos del dataset EN → ES (translateTerm/translateTerms)
src/hooks/useAuth.js                # sesión + gate + signIn/signOut
src/hooks/useRestTimer.js           # estado + cuenta atrás + título + timer por cuenta
src/hooks/useDelayedVisible.js      # retardo mínimo anti-flash para skeletons (ver F14)
src/components/Phase.jsx, BackgroundOrbs.jsx, RestPill.jsx, MoveButtons.jsx, UnitToggle.jsx, Snackbar.jsx
src/components/Charts.jsx           # CalorieBars + WeekBars + TrendLine con selección interactiva de nodos (SVG puro)
src/components/CustomSelect.jsx     # combobox glassy con scroll interno, auto-scroll a opción activa y apertura hacia arriba (shouldDropUp / .drop-up)
src/components/SplitPickerModal.jsx # modal para elegir un split famoso (PPL, Upper/Lower, Arnold, Full-body…) o armar la semana día por día
src/components/SwapExerciseModal.jsx # modal para sustituir un ejercicio de la rutina (mismo músculo, misma zona o catálogo completo con buscador)
src/components/OnboardingModal.jsx  # onboarding cuentas nuevas
src/components/WorkoutModals.jsx    # WeightModal + CardioModal + WarmupModal (reciben `theme`: fuera del main llevan variante `modal-light`)
src/components/CustomExerciseModal.jsx  # modal de extra: modo create (combobox+paso+reps+series, anota S1) y modo log (solo peso+reps)
src/components/CustomExerciseRow.jsx    # fila de extra (check + nota Extra + última marca + × con doble toque + botón Marcar serie N)
src/components/SearchCombobox.jsx       # input + lista filtrable con texto libre y teclado (para elegir extra de la BD)
src/components/ExerciseItem.jsx     # fila ejercicio + visor + carrusel + historial (partial/blocked/lastWeight/lastReps/history)
src/components/BottomNav.jsx        # nav fija Inicio/Historial/Perfil (acepta `value={null}` = ninguna activa, usado en detalle de día)
src/components/Skeleton.jsx         # Boot/Home/Day/History/Profile/Sets skeletons + SkeletonCard (ver F14)
src/pages/LoginPage.jsx, HomePage.jsx, DayPage.jsx, HistoryPage.jsx, ProfilePage.jsx  # vistas puras (props, sin estado global)
src/services/exercisesApi.js        # catálogo MEDIA + BUNDLES (56 ejercicios separados por implemento) + getSubstitutes + getExerciseThumb
src/services/planSync.js            # puente plan local ↔ Supabase (ensureDayRows, fetchLastWeights, fetchRecentLogs, saveDaySession)
src/supabaseClient.js               # createClient + normaliza URL (`/rest/v1` fuera) + aviso claro si faltan VITE_* (requiere reiniciar `npm run dev`)
src/index.css                       # Tailwind + base body
src/App.css                         # sistema visual completo (incluye fix de stacking context en .day-row y scroll/drop-up en .custom-select-list)
supabase/migrations/20260924174327_init_schema.sql  # schema completo + RLS + profiles
supabase/migrations/20260924000002_profiles.sql     # migración standalone de profiles
supabase/check_security.sql         # script de revisión
.env.local                          # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (no commitear)
```
> Nota refactor: `ActiveWorkout.jsx` (flujo legado no usado) se eliminó; `ThemeToggle` (sin uso) también. `App.jsx` pasó de ~3630 a ~1400 líneas moviendo código verbatim (misma lógica, mismo JSX/props).

## 4. Modelo de datos

### 4.1 Plan local (en `src/data/plan.js`)

- `globalPhases`: `warmup` (Fase 1, 5-10 min caminadora 5 km/h inc.0) y `cardio` (Fase 3, 20-30 min 4-5 km/h inc.10-12).
- `globalRules`: `{ tempo: '3-1-1', rest: '2-3 min' }`.
- `workoutDays[12]`:
  - **Split de la casa (ids 1–5)**:
    1. `Pecho y espalda` (6 ej: Press inclinado mancuernas, Remo inclinado mancuernas, Press plano mancuernas, Jalón al pecho máquina, Aperturas mancuernas, Remo a una mano mancuerna).
    2. `Pierna 1` · *Cuádriceps y glúteo* (**7 ej**: Sentadilla goblet con mancuerna, Extensión de cuádriceps en máquina, **Curl de isquios tumbado en máquina**, **Patada de glúteo en polea**, Aductores en máquina, Abductores en máquina, Pantorrilla de pie en máquina).
    3. `Hombro y brazo` (7 ej: Press militar mancuernas, Elevaciones laterales mancuernas, Skull crusher mancuernas, Curl predicador mancuernas, Patada de tríceps mancuerna, Curl martillo mancuernas, Curl de bíceps en máquina).
    4. `Pierna 2` · *Isquiosurales y glúteo* (**7 ej**: Prensa de piernas en máquina, Curl de isquios sentado en máquina, **Extensión de cuádriceps en máquina**, Patada de glúteo en máquina, **Aductores en máquina**, Abductores en máquina, Pantorrilla de pie en máquina).
    5. `Torso mixto` (5 ej: Press inclinado máquina, Jalón agarre invertido máquina, Press plano máquina, Remo en T máquina, Elevación lateral máquina).
  - **Full Body (ids 6–7, `FULL_BODY_IDS = [6, 7]`, `isFullBodyWorkout`)**:
    6. `Cuerpo completo A` (7 ej: pecho, espalda, pierna, hombro, brazo y pantorrilla).
    7. `Cuerpo completo B` (7 ej: torso, glúteo, isquios, hombro, brazo y abductores).
  - **Rutinas de splits famosos (ids 8–12)**:
    8. `Empuje` (Push, 7 ej), 9. `Tirón` (Pull, 6 ej), 10. `Pierna PPL` (5 ej), 11. `Tren superior` (Upper, 6 ej), 12. `Tren inferior` (Lower, 6 ej).
- `SPLIT_TEMPLATES[6]`: `tempolift-5` (El plan de la casa, 5 días), `ppl-3` (Push · Pull · Legs, 3 días), `upper-lower-4` (Torso / Pierna ×2, 4 días), `arnold-3` (Arnold, 3 días), `fullbody-2` (Cuerpo completo, 2 días), `ppl-ul-5` (PPL + Torso/Pierna, 5 días). `findTemplateForMap(map)` detecta si el mapa actual coincide con alguno o es `'Semana personalizada'`.
- `weekSchedule[7]` fijo Lun-Dom (base de etiquetas). Plan por meta: `TRAINING_DAYS_BY_GOAL` (1:[Jue], 2:[Mié,Sáb], 3:[Mar,Jue,Sáb], 4:[Lun,Mar,Jue,Vie], 5:[Mié-Dom], 6:[Lun,Mar,Mié,Vie,Sáb,Dom], 7:toda) + `ROUTINES_BY_GOAL` (1:[6], 2:[6,7], 3:[6,4,3], 4:[1-4], 5:[1-5], 6:[1-6], 7:[1-7]).
- `adjustWeekMapForGoal(prevMap, nextGoal, protectedIds)`: ajusta los días activos al cambiar la meta en el perfil conservando cada día ya configurado por el usuario en su misma posición (sin desplazar ni desordenar sus rutinas y sin mezclar Full Body `6/7` al pasar a splits de 4–5 días). Si `nextGoal === 1`, asigna sí o sí una rutina **Full Body** (`6` o `7`).
- Cada usuario puede mover el CONTENIDO (rutina/descanso) entre días en home (`moveWeekDay`), elegir un split famoso (`applySplit` vía `SplitPickerModal`) o asignar la rutina de cada día con `CustomSelect` (`selectDayRoutine`, que también exige al menos 1 día activo y fuerza Full Body si queda 1 solo día de entreno). Persistido en `localStorage` por usuario (`tempolift-week-map-{uid}`).
- `REST_SECONDS = 120`, `formatRest(m:s)`.

### 4.2 Base de datos (Supabase, `init_schema.sql`)

- `routines(id, user_id, name, description)`: una por `workoutDays.name` (find-or-create por nombre).
- `exercises(id, user_id, name, muscle_group, equipment)`: una por nombre ES del plan (find-or-create).
- `routine_exercises(id, user_id, routine_id, exercise_id, target_sets=2, target_reps, rest_seconds=120, position, UNIQUE(routine_id, exercise_id))`.
- `workout_sessions(id, user_id, routine_id, started_at, ended_at, notes)`: `notes` = JSON `{cardioMin, cardioKcal, cardioMachineKcal?, warmupMin, warmupKcal, warmupMachineKcal?}`. Sesiones antiguas sin notes aportan 0 kcal extra.
- `set_logs(id, user_id, session_id, exercise_id, set_number IN (1,2), weight_kg NUMERIC (>=0, en realidad guarda **lb** por legado), reps, UNIQUE(session_id, exercise_id, set_number))`.
- `profiles(user_id PK, weight_kg, height_cm, age, sex IN ('masculino','femenino','otro'))`: una fila por usuario, para stats/kcal/IMC.
- RLS habilitado en las 6 tablas; policies `select/insert/update/delete_own_*` con `auth.uid() = user_id`. Índices por `user_id`, `routine_id`, `session_id`.

### 4.3 Estado de entreno en `App.jsx`

- `seriesByDay: { [workoutId]: { [index]: 1|2 } }` — solo `2` cuenta como ejercicio hecho (reemplaza al viejo `checkedByDay`).
- `weights: { [workoutId]: { [index]: { 1: {weight, reps}, 2: {weight, reps} } } }` — peso en **lb** + reps reales por serie.
- `cardioByDay / warmupByDay: { [workoutId]: { minutes, machineKcal: number|null } }` — cada uno cuenta como **1 ítem** del día.
- `totalExercises = exercises.length + 2`, `doneCount = series==2 + cardio + warmup`, `progress`, `allDone`, `missingLabels`.
- `planIds = { routineId, byIndex: { [index]: exercise_id } }`, `lastW = { [exercise_id]: {weight_kg, reps} }`, `recentW = { [exercise_id]: [{weight_kg, reps, set_number, created_at}]×4 }`, `syncError`, `saveStatus: idle|saving|saved|error` + `saveSigRef` dedupe, `dayStartRef`.

## 5. Funcionalidades

### F0 — Auth + gate (`supabaseClient.js`, `src/hooks/useAuth.js`, `src/pages/LoginPage.jsx`)

- `supabase.auth.getSession()` + `onAuthStateChange` (ambos ponen `setAuthChecking(false)`; sin guard `done` para no bloquear logins/logouts posteriores). `signInWithGoogle` (OAuth Google, `redirectTo: origin`), `signOut` (solo vive en Mi perfil → Cuenta).
- `authChecking=true` inicial: no se renderiza login ni app (fondo vacío con `aria-busy`); si tarda >150ms (`bootVisible = useDelayedVisible(authChecking, 150)`) se muestra `BootSkeleton`. Así no hay flash de login antes de saberse la sesión.
- Sin sesión: pantalla login (`T TempoLift + Continuar con Google + tagline estático Tempo 3-1-1 · 5 días`). Con sesión: app completa.
- Sin sesión: pantalla login (`T TempoLift + Continuar con Google + tagline estático Tempo 3-1-1 · 5 días`). Con sesión: app completa.
- `friendlyError(err)`: mensaje legible (permiso 42501, red, tabla faltante PGRST) + log técnico solo en `DEV`.
- El flujo paralelo de rutina genérica ("Tus rutinas" → `ActiveWorkout.jsx`) se eliminó del repo ("un solo flujo de entreno: el plan semanal") para evitar doble conteo. Si se quiere rutina libre, hay que recrearlo como página.

### F1 — Home / Calendario semanal (`currentView==='home'`, sin `selectedDay`)

- Hero "Tu semana." + botón `Editar/Listo` (`aria-pressed`): activa el modo editar para reordenar días, elegir un split famoso o cambiar la rutina de cualquier día sin abrirlo por error. Cabecera con nombre del split actual (`Split: {currentSplitName}`), `{trainingCount} sesiones` y footer `Plan de {N} días` dinámicos.
- Modo editar:
  - Cada fila muestra `MoveButtons` (↑ ↓ con `aria-label`/`title` de destino `Mover {contenido} al {día vecino}`, desactivadas en bordes o si el vecino tiene lo mismo) vía `moveWeekDay(idx, dir)`.
  - Cada fila incluye un `CustomSelect` para asignar directamente cualquiera de las 12 rutinas o `Descanso` a ese día (`onSelectDayRoutine`). Si el usuario deja o configura **1 solo día de entrenamiento**, se fuerza automáticamente una rutina **Full Body** (`Cuerpo completo A` o `B`).
  - Botón `Splits` en la cabecera abre `SplitPickerModal` (con explicación, nivel, preview de ejercicios con miniaturas del dataset y selector día por día). Botón `Restablecer` vuelve al mapa por defecto.
- Filas glassy: contenedor `day-list` (gap, sin divide) + filas `day-row` (vidrio, radio 18px, stagger por `--d: idx*45ms`, hover desliz, active scale, badge `day-badge` con relieve, descanso `is-rest` dashed) + mini `day-progress` (rojo→verde `done`, con `progressbar` y %). Cuando un `CustomSelect` se abre dentro de una `.day-row`, la fila sube a `z-index: 50` (y `opacity: 1` si era descanso) para que el menú nunca quede tapado por las tarjetas vecinas.
- Header: logo `T` + `TempoLift`. Footer: "Plan de N días / Fuerza + cardio".
- `ThemeToggle` antiguo eliminado del home; el tema ahora vive en Mi perfil.

### F2 — Detalle de día y sustitución de ejercicios (`selectedWorkout != null`, `max-w-lg`)

- Header con `‹ Días` a la izquierda y botón `Editar/Listo` (`editingRoutine`) a la derecha para personalizar los ejercicios de la rutina.
- Modo edición de rutina (`editingRoutine`): cada ejercicio muestra un botón `Cambiar` que abre `SwapExerciseModal` (y badge `Tuyo` si ya fue sustituido), además de `Restablecer rutina` si hay cambios guardados (`routineOverrides.js`, persistido en `tempolift-routine-overrides-{uid}`).
- `SwapExerciseModal`: sugiere primero ejercicios del **mismo músculo** (`sameMuscle`) y luego de la **misma zona** (`sameZone`). Al pulsar **Ver todo el catálogo**, despliega el catálogo completo junto con un **buscador en tiempo real** (insensible a acentos/mayúsculas, busca por nombre, músculo o equipo) para localizar cualquier ejercicio sin recorrer toda la lista.
- `BottomNav` con `value={null}` en esta vista: la rutina no es ninguna pestaña, así que ninguna va activa (sin `aria-current`). `handleNav` cierra el día al navegar. Home/historial/perfil sí pasan `value={currentView}`.
- Título `Día {posición} / {trainingCount}` (posición entre los días que entrenan, no el id). `name`, `focus`.
- Si `planIds` tarda (>150ms, `showDaySkel`), la `routine-card` se reemplaza por `DaySkeleton` (cabecera y progreso, locales, se ven al instante).
- Progreso **sticky** (`position:sticky top-2`, clase `.progress-pin`): opaco siempre (fondo sólido por tema, sin blur) + borde rojo solo con scroll (`.is-stuck` desde listener en `DayPage`, `scrollY > 12`); en reposo no resalta. `done/total`, `progressbar`, texto contextual (incluye `falta: calentamiento + cardio`), línea viva `~X kcal est. (fuerza + cardio + calent.) · Y kg movidos`, `syncError` ámbar si el día no se guardará, card de descanso inline con `Omitir`.
- Banner `dayComplete`: muestra estado de guardado (`Guardado ✓ · ~X kcal / Guardando… / No se pudo guardar: …`), botón `Reiniciar ahora`.
- `routine-card` con 3 `Phase` acordeón (`warmup/strength/cardio`, default `strength`): warmup y cardio tienen su check propio de 1 marca que abre modal de minutos; fuerza lista `ExerciseItem`s con regla global tempo·rest. Cada `Phase` acepta `status/statusDone` y lo muestra en su cabecera aun colapsada: minutos en warmup/cardio al completarse (`✓ 7 min`) y `X/Y completados` siempre en fuerza (verde al completar).
- Al completar todo (`allDone`): `setDayComplete(true)` + `saveDaySession(...)` (una sola vez por firma) + `fetchSb()` + auto-`resetDay` a los **6s**.

### F3 — Tracking fuerza: 2 series + peso + descanso global

- Primer toque en check → modal peso `Serie 1/2` **vacío** (sin prefill, para no empujar marcas); subtítulo con último registro (`Último: X lb × Y reps` o `Sin registros previos`) + placeholder realista por ejercicio (`WEIGHT_HINTS_LB` + `weightHintFor`, redondeado al paso 0.5: ej. laterales 15 lb, prensa 270 lb → 122.5 kg). Confirmar guarda serie, dispara `restLeft=120`. Segundo toque → modal `Serie 2/2` + descanso. Tercer toque → desmarca y borra pesos.
- Validación de modales (peso, cardio, calentamiento) con `noValidate` + JS y avisos en `Snackbar` glassy (`snack/showSnack/closeSnack`, auto-cierre 3.5s, `role=alert`, z-60 sobre modales y navbar, render en las 3 ramas): peso múltiplo de 0.5, reps/minutos/kcal enteros dentro de rango. Sin errores inline (estados `setError/cardioError/warmupError` eliminados).
- Bloqueo durante `restLeft>0` o cualquier modal abierto (`weightModal/cardioModal/warmupModal`).
 - `restLeft` cuenta atrás por deadline (`useRestTimer`); **no se corta al cambiar de pantalla**. UI doble: card inline en detalle + `RestPill` fija (`fixed top-20`, `role=status`) visible en home/historial/perfil con `Volver al entrenamiento` (`returnToTraining` vía `lastDay`). En la fila: botones explícitos `Marcar serie 1/2` (`.set-btn`, S2 con cuenta atrás en descanso) además de la casilla; misma máquina de estados.
 - Extras del día (`customByDay`, card `+ Agregar ejercicio` al fondo de fuerza): combobox con ejercicios de la BD (`fetchUserExerciseNames`) + texto libre, peso, reps y series 1-4 (S1 queda anotada; S2+ solo pide peso+reps). Suman kcal e historial (`saveDaySession(..., customSets)`, set_number continúa tras el plan) pero NO tocan `done/total/allDone` (cierra con cardio). Van en el borrador (`customs`), respetan una sola rutina activa y se limpian con `resetDay`. Quitar con × en doble toque.
- `resetDay(workoutId)`: limpia series, pesos, cardio, warmup, modales, banner, `expandedKey`, timer y `saveStatus`.

### F4 — Cardio / calentamiento (1 marca cada uno)

- `openCardio/openWarmup` → modal con minutos (cardio 1-180 default 25, warmup 1-60 default 7, enteros) + `Calorías de la máquina (opcional, enteras 0-5000)`. Validación con `parseMachineKcal` (entero) + snackbar. Preview vivo: usa máquina si se anotó, si no estima con `bodyKg`.
- Confirmar marca el check; clic de nuevo desmarca (`unmarkCardio/unmarkWarmup`). Se puede marcar con descanso activo (otra fase).

### F5 — Fila de ejercicio (`ExerciseItem.jsx`)

- Props nuevas: `partial` (S1 hecha → check ámbar `1/2`), `blocked` (descanso/modal → atenúa), `lastWeight + lastReps + weightUnit` (`exercise-reps` muestra tu última marca `150 lb × 8` con el plan en `title`; sin historial muestra el plan; chip `Últ:` eliminado por duplicado), `history` (últimas 4 series del usuario → caja `Tu historial` en el acordeón con peso×reps+fecha+serie, helpers locales `formatLb/shortDate`), `series-chip` (`2/2 ✓` verde). `aria-checked: mixed` en parcial.
- Resto igual: `custom-check` CSS (en tema claro el override base usa `:not(.checked):not(.partial)` + fills explícitos verde/ámbar con paloma blanca), `expand-btn`, `exercise-foot` (reps + target + equipment), detalle lazy con `MainViewer` (GIF 180px→340px, spinner, fallback offline, fallback genérico `hang-card` sin GIF), tags, instrucción ES, pasos (máx 3), `VariantCarousel` (scroll-snap, `listbox/option`, thumbs jsDelivr→raw fallback), atribución gymvisual + link dataset.

### F5b — Acordeón: pasos por variante + pills en ES (`ExerciseItem.jsx`, `src/lib/terms.js`)

- Sin párrafo de texto: lista ordenada `Cómo hacerlo` con los pasos de la variante ACTIVA del carrusel (fallback a la principal; `0575` recibió pasos propios en el catálogo).
- `translateTerm(s)/translateTerms(list)` (zona/músculo/implemento → ES, con dedupe; desconocido se devuelve tal cual): cable→Polea, dumbbell→Mancuerna, barbell→Barra, leverage/sled→Máquina, pectorals→Pecho, lats→Dorsales, delts→Deltoides, quads→Cuádriceps, hamstrings→Isquios, glutes→Glúteos, calves→Pantorrillas, adductors/abductors→Aductores/Abductores, upper/lower legs→Piernas, upper arms→Brazos, etc. Cubre tags, foot-chips, carrusel (equipo + encabezado + title) y biserie. Los nombres de variante siguen en inglés (dataset).

### F6 — Medios y catálogo (`exercisesApi.js`)

- Principio anti-confusión: cada nombre en español = **UN solo movimiento + UN solo implemento** (no se mezclan mancuernas, barra, polea y máquina en el mismo carrusel). Solo se agrupan en `variants` distintos ángulos/recorridos del mismo ejercicio y misma máquina.
- `MEDIA` (~63 entradas `E()`) y `BUNDLES` (**56 ejercicios** separados por equipo). Helpers: `getMediaCandidates` (RAW↔CDN), `getRepoVideoUrl`, `getExerciseBundle` (con cache `Map`), `getCatalogExerciseNames`, `getExerciseMeta`, `getSubstitutes(spanishName)` (devuelve `{ sameMuscle, sameZone, rest }`) y `getExerciseThumb`.

### F7 — Sincronización plan (`planSync.js`, nuevo)

- `parseTargetReps("2 x 8-10") → 8` (regex `/x\s*(\d+)/`, solo se usa en `planSync` para `target_reps`).
- `ensureDayRows(supabase, userId, workout)`: find-or-create rutina (por `name`) + por cada ejercicio find-or-create + link `routine_exercises` (`target_sets:2, rest_seconds:120, position:i`) si falta. Devuelve `{routineId, byIndex}`. Se llama al abrir un día (`useEffect[selectedDay]` + `dayStartRef=now`).
 - `fetchLastWeights(supabase, userId, ids, aliasMap = {})`: último `set_logs` por `exercise_id` → texto del modal + `exercise-reps`/`lastReps`. `fetchRecentLogs(supabase, userId, ids, 4, aliasMap = {})`: últimas 4 series por ejercicio → `recentW` → caja `Tu historial` del acordeón. `applyHistoryAliases` (puro) rellena huecos desde el alias; `fetchExerciseIdsByNames` resuelve IDs por nombre. `EXERCISE_RENAMES` (`data/plan.js`, ej. Pantorrilla ← Biserie): el historial se hereda sin mutar datos, así las reps son dinámicas (récord) y no el plan estático.
- `saveDaySession(...)`: inserta `workout_sessions` (started/ended + `notes` JSON cardio/warmup) y luego `set_logs` por cada serie anotada. Retorna `session.id`.

### F8 — Historial (`currentView==='history'`)

- `fetchSb()`: últimas 20 `routines` + `workout_sessions` (se re-fetch al cambiar de vista y tras guardar). Solo terminadas (`ended_at`) cuentan.
- Stale-while-revalidate: los datos viejos nunca se borran al recargar; el contador muestra el dato existente (`sbLoading && finished.length===0` es la única condición de "Cargando…"). Sin datos + carga >150ms (`showHistorySkel`) se muestra `HistorySkeleton` (cards estilo referencia: avatar + líneas + bloque + puntos).
- Lista expandible por sesión (`openSession`): fecha, cardio/calentamiento (min + kcal máq. o estimada), series vía `set_logs + exercises(name)` ordenadas por `created_at`. Series en carga: `SetsSkeleton` inline si tarda >100ms (`showSetsSkel`), si no texto "Cargando series…".
- Edición inline por serie (`editingSet`, `editWeight/editReps` con `UnitToggle`): `update set_logs`. Borrado en 2 toques (`confirmDelete`): borra `set_logs` de la sesión + la `workout_sessions`. Mensajes vía `setMsg + friendlyError`.

### F9 — Perfil + stats + onboarding (`currentView==='profile'`)

- Tarjeta usuario (inicial + email), stats últimas 20 sesiones: **sesiones, kcal totales, kcal/sesión, racha de días** (`dayStreak`: días consecutivos con sesión, tolera hoy vacío si ayer hubo). Los `…` solo salen sin datos previos (`sbLoading && finished.length===0`, `statsLoading && statsRows.length===0`); en refetch se conserva lo visible.
- Sin `statsRows` + carga >150ms (`showProfileSkel`) se muestra `ProfileSkeleton` (cabecera + 4 tiles + cards). La sección Gráficas ya no se reemplaza por "Calculando…" en refetch: ese texto (y el de vacío) solo sale con `chartData.length===0`.
- Agregado por sesión (`useEffect[currentView==='profile']`): `set_logs` (volumen kg = Σ lb→kg×reps, desglose por parte del cuerpo `volumeByPart` vía `sessionVolumeByBodyPart`, peso máx lb, kcal fuerza = volumen×0.05) + `notes` (cardio/warmup kcal) → `statsRows`.
- Gráficas SVG puras (últimas 10 sesiones cronológicas + 8 semanas) con resúmenes en lenguaje simple: `CalorieBars` (apiladas fuerza rojo + cardio ámbar + calent. sky, con valor total sobre cada barra, línea de promedio y pie "promedio/best") + `WeekBars` (`sessionsByWeek`: sesiones/semana lunes-domingo, meta configurable `weekGoal` en verde, semana en curso en rojo) + **gráficas separadas de peso movido (`VOLUME_CHARTS`: Pierna, Brazo, Pecho, Espalda, Hombro y Total)** con botones para habilitar/deshabilitar individualmente o todas (`Todas`/`Ninguna`, persistido en `tempolift-volume-charts-{uid}`), evitando picos anormales al mezclar días de pierna con brazo, y **nodos interactivos en `TrendLine`** que al pulsarlos muestran qué parte del cuerpo fue, la cantidad exacta de kilos (`kg`) y la sesión/fecha + lista `exerciseRecords` (mejor marca por ejercicio con reps y fecha, top 6 + ver todos, en la unidad lb/kg visible). La query de stats trae `exercises(name)` para los récords y el desglose por zona.
- Formulario `Mis datos`: peso (lb/kg + `UnitToggle`), altura cm, edad, sexo (`CustomSelect`); muestra IMC si hay peso+altura; guarda en memoria + local + Supabase `profiles` (tolerante si falta tabla). Secciones Apariencia (toggle tema), Meta semanal (stepper 1-7 `weekGoal`/`changeWeekGoal` —cambiarla ajusta la semana con `adjustWeekMapForGoal` conservando los días y rutinas ya configurados por el usuario, forzando Full Body en 1 día y avisando por snackbar— `readWeekGoal/persistWeekGoal` por usuario `tempolift-week-goal-{uid}`, barra `day-progress` + mensaje; consejo por nivel `weekGoalTip` sin emojis, ámbar en 7; alimenta `WeekBars goal` y su pie), Tus datos (`wipeHistory`: borra `set_logs` + `workout_sessions` del usuario con doble toque, rutinas/perfil intactos, estados `dataMsg/confirmWipe` reseteados en `handleNav`), Cuenta (cerrar sesión).
- `OnboardingModal` (cuentas nuevas sin peso): peso obligatorio (30-300) + altura/edad/sexo opcionales + `Omitir por ahora`. Se abre según `isProfileComplete`.
 - Sistema lb/kg global: todo se **guarda en lb** (columna `weight_kg` histórica); `readWeightUnit/persistWeightUnit`, `displayWeight/displayToLb/convertInputUnit`, `bodyKgToDisplay/displayToBodyKg`. `switchWeightUnit` convierte todos los inputs abiertos a la vez. Peso corporal default 75 kg (`DEFAULT_BODY_KG`). Sección `Unidades` en Mi perfil (mismo estado, con texto de alcance): récords, historial del acordeón y pesos se ven en esa unidad.

### F10 — Estimación de kcal

- Fuerza: `volumenKg × 0.05` (≈1 kcal / 20 kg movidos). Cardio: `8 MET × bodyKg × (min/60)`. Calentamiento: `3.5 MET × bodyKg × (min/60)`. Si hay kcal de máquina, reemplazan la estimación en día + historial + gráficas. `parseSessionExtras(notes)` tolera sesiones viejas/texto libre.

### F11 — Tema / perfil local / robustez

- `theme dark|light` (`tempolift-theme`), `weightUnit` (`tempolift-weight-unit`), `bodyKg` (`tempolift-body-kg` + `tempolift-profile-{uid}` JSON), `weekMap` (`tempolift-week-map-{uid}`), `weekGoal` (`tempolift-week-goal-{uid}`), clases `theme-dark/theme-light` en `<main>`.
- `profilesTableState` (null/true/false): si la migración no está aplicada (404/PGRST205) se detecta una vez y no se reintenta (cero ruido red/consola); todo sigue en local. `upsertProfile` tolerante. `markProfilesChecked/isMissingTableError`.
- `BottomNav` fija fuera del `<main>` animado (si no, `fixed` se vuelve relativo al main con `transform`); recibe `theme` por prop por el mismo motivo. `RestPill` igual.
- Modales sin scroll de fondo: `useEffect[anyModalOpen]` en `App.jsx` pone `body{overflow:hidden; overscroll:none}`; overlay `overflow-y-auto overscroll-contain` + card `.modal-card m-auto` (scroll interno si supera `100dvh-2rem`); `autoFocus={FINE_POINTER}` (solo puntero fino, en táctil no abre el teclado de golpe).
- SPA sin router: `useEffect[selectedDay, currentView]` hace `window.scrollTo(0,0)` para que cada pantalla empiece arriba.
- `CustomSelect` (reemplaza `<select>` vanilla): botón + lista glassy, teclado (↑↓/Enter/Esc), click-fuera, `listbox/option`, opción vacía/placeholder. Incluye:
  - **Scroll interno**: `.custom-select-list` tiene `max-height: 224px`, `overflow-y: auto`, `overscroll-behavior: contain` y scrollbar estilizada, además de sincronizar `scrollTop` con la opción activa/seleccionada al abrir o navegar con teclado sin desplazar la ventana.
  - **Apertura inteligente hacia arriba (`shouldDropUp` / `.drop-up`)**: mide el espacio disponible dentro de `.day-list`, `.modal-card` y el viewport; cuando está en los últimos días de la lista o cerca del borde inferior, abre hacia arriba (`bottom: calc(100% + 6px)`) para no cortar opciones.
  - **Fix de stacking context (`z-index`)**: cada `.glass-card` y cada `.day-row` crea su propio stacking context (`backdrop-filter`, y `opacity: 0.65` en `.day-row.is-rest`). Con `.custom-select.open { z-index: 40 }`, `.day-row:has(.custom-select.open), label:has(.custom-select.open) { position: relative; z-index: 50 }`, `.day-row.is-rest:has(.custom-select.open) { opacity: 1 }` y `.glass-card:has(.custom-select.open):not(.modal-card) { z-index: 30 !important; overflow: visible !important }`, el dropdown siempre se muestra opaco y por encima de las demás tarjetas de días.
- `SEX_OPTIONS = masculino/femenino/otro`.

### F12 — Visual / UX / a11y (heredado + añadidos)

- Glassmorphism, orbes fijos, springs, stagger, `prefers-reduced-motion`, responsive `max-w-4xl/ max-w-lg`, `pb-28` por bottom-nav, `sticky` progreso, modales `fixed z-50 bg-black/70` con card `.modal-card` (scroll interno, inputs 16px en móvil), `UnitToggle`, `bottom-nav`, `custom-select`, `.snackbar`, skeletons `.skel` (ver F14), viewport con `viewport-fit=cover, interactive-widget=resizes-content` en `App.css` / `index.html`.
- A11y: `checkbox/progressbar/tab/listbox/option/status/dialog/alert`, `aria-expanded/checked/selected/pressed`, `aria-live` en descanso/kcal/IMC/meta, `loading=lazy`, `focus-visible`.

### F13 — Límites conocidos

- Sin router, sin i18n (ES + nombres EN dataset), sin tests, README aún plantilla Vite.
- GIF/JPG requieren red (raw↔jsDelivr); offline → fallback.
- Sin ejercicios de peso corporal sin GIF (colgado eliminado). Columna `weight_kg` guarda lb (legado, documentado en código).
- Sin tests (solo verificación `oxlint` + `vite build` + pruebas Node de lógica pura). `ThemeToggle` se eliminó (sin uso; el tema vive en Mi perfil).
- `.env.local` requerido (`VITE_SUPABASE_URL` base sin `/rest/v1` + `VITE_SUPABASE_ANON_KEY` formato `sb_…` válido); Vite solo lo lee al arrancar (`npm run dev` tras editarlo). Sin él Supabase falla (ver `friendlyError`).

### F14 — Skeleton screens con retardo mínimo (`Skeleton.jsx`, `useDelayedVisible.js`, `.skel` en `App.css`)

- Estilo de la imagen de referencia: card con cabecera (avatar/punto + 2 líneas), bloque grande y 3 puntos abajo, con barrido shimmer (`skel-sweep` 1.4s) + pulso en puntos. Variante gris en tema claro (`.theme-light .skel`), sin animación con `prefers-reduced-motion`. Todo `aria-hidden` dentro de contenedores `role=status` + `aria-label` ("Cargando…").
- `useDelayedVisible(active, delay)`: `setTimeout` en `useEffect`; solo muestra el skeleton si la carga persiste tras el retardo. Retardos mínimos anti-flash: **150ms** páginas (boot/historial/perfil/día, default del hook), **100ms** series inline (gesto del usuario). El retardo NO retrasa los datos: el contenido real se pinta en cuanto llega; home (datos locales) no usa skeleton.
- Regla anti-parpadeo "datos → vacío → datos": skeletons y textos de carga (`…`, "Cargando…", "Calculando…") solo aparecen **sin datos previos**; en refetch se conserva lo visible (stale-while-revalidate). `SetsSkeleton` inline en sesión expandida; `DaySkeleton` con `rows = exercises.length`.
- Nota lint: `oxlint` avisa `react(set-state-in-effect)` en el hook (patrón estándar de retardo, solo warning); resto de warnings preexistentes (`profileLoading`/`handleBodyKg` sin uso, `DATASET_REPO`, `dayWeights` en deps).

### F15 — Timer de descanso anti-segundo-plano + borrador y timer por cuenta (`src/hooks/useRestTimer.js`, `src/lib/restTimer.js`, `src/lib/draft.js`)

- Descanso por deadline (`endsAt = Date.now()+120s`, tick de `1000ms` que se pausa mientras `document.hidden === true` y se recalcula al instante en `visibilitychange/focus`, `ceil`), persistido en `tempolift-rest-timer-{uid}` (migra el global legado una vez). Por cuenta: cambiar de sesión muestra el timer propio; el ajeno queda intacto.
- Borrador en curso por usuario (`tempolift-active-workout-{uid}`): series/pesos/cardio/warmup/día/inicio/firma. Una sola rutina activa (los confirms limpian otros días con snackbar). `dayStartDayRef` evita mezclar inicios.

### F16 — Semana personalizada, meta sin desorden y reinicio automático ante reposiciones/acarreos (`App.jsx`, `src/lib/weekly.js`, `src/data/plan.js`)

- Semana de entreno = desde el primer día con rutina del `weekMap` (`trainingWeekStart`, 00:00 local).
- Rutinas con nombres e IDs únicos (`workoutDays` 1–12; `Pierna 1` id 2 y `Pierna 2` id 4 tienen 7 ejercicios cada una y fila propia en Supabase).
- **Reinicio inteligente (`computeDoneWorkoutIds` en `src/lib/weekly.js`, memoizado con `useMemo` en `App.jsx`)**: une el journal local (`tempolift-done-journal-{uid}`) y las sesiones terminadas de Supabase, y desbloquea automáticamente sin que el usuario tenga que marcar nada como "reposición":
  1. **Llegada de su día programado**: si una rutina asignada a `slotIdx` (p. ej. Sábado) se completó antes en la semana como reposición (p. ej. Lunes) y hoy ya llegó su día `slotIdx` (`doneDay < slotDayStart`), se desbloquea automáticamente para entrenarla en su día.
  2. **Acarreo de ejercicios**: si una rutina de un día posterior de la semana (`slotIdx`) se hizo a principio de semana como reposición y después se completó una rutina de un día anterior del calendario semanal (`otherSlotIdx < slotIdx`, p. ej. Miércoles en fecha posterior al Lunes), la reposición previa queda superada y desbloqueada para el ciclo en curso.
  3. **Ciclo semanal completado**: si todas las rutinas programadas en `weekMap` ya fueron completadas en días anteriores a hoy, el ciclo se reinicia.
  - Además, `capReached` comprueba si todas las rutinas programadas del mapa actual están en `doneIds`, de modo que una sesión de reposición hecha el lunes nunca bloquea por tope semanal los días programados pendientes de la semana.
- **Ajuste de meta semanal sin desorden (`adjustWeekMapForGoal` en `src/data/plan.js`)**:
  - Al cambiar el número de días en Mi perfil (`changeWeekGoal`), los días que el usuario ya había editado/acomodado en la página principal conservan exactamente su rutina en ese mismo día.
  - Al subir días (p. ej. de 4 a 5), el nuevo día se añade después del último día activo (o en los últimos descansos disponibles de la semana) con la rutina faltante del plan, y si el usuario venía de 1–3 días (con Full Body `6/7`) se limpian los Full Body al pasar a splits de 4–5 días para no mezclar rutinas.
  - Si la meta o la edición manual queda en **1 solo día de entrenamiento**, se asigna y exige siempre una rutina **Full Body** (`Cuerpo completo A` o `B`).

### F17 — Rendimiento en segundo plano, memoización y optimización de red (`App.css`, `ExerciseItem.jsx`, `DayPage.jsx`, `useRestTimer.js`, `useAuth.js`, `planSync.js`, `App.jsx`)

- **Cero consumo de GPU/CPU en segundo plano**:
  - Se desactivó la animación infinita `orb-float` en `.orb` y el `backdrop-filter` anidado en `.day-row` (`src/App.css`), evitando que el compositor gráfico recalcule desenfoques a 60fps cuando el navegador está en segundo plano o reproduciendo video.
  - Se eliminó la regla universal `.theme-dark *, .theme-light *` que adjuntaba transiciones de 360ms a todos los nodos del DOM.
  - En `MainViewer` (`src/components/ExerciseItem.jsx`), un listener de `visibilitychange` sustituye automáticamente el `.gif` animado por su imagen estática `.jpg` cuando `document.hidden` es `true`, deteniendo la decodificación de fotogramas en segundo plano.
  - `useRestTimer` (`src/hooks/useRestTimer.js`) usa intervalos de `1000ms` y omite ticks mientras `document.hidden === true`, recalculando por timestamp al recuperar visibilidad/foco.
- **Memoización real de filas durante la cuenta atrás (`ExerciseItem` + `DayPage` + `App.jsx`)**:
  - `handleToggleCheck` (`App.jsx`) y `handleExpandExercise` (`DayPage.jsx`) usan `useCallback` con referencias estables, y `ExerciseItem` recibe `workoutId` e `itemKey` por props y solo recibe `restLeft` cuando está en su serie 1 con descanso activo (`series === 1 && isResting ? restLeft : 0`), evitando re-renderizar los 7 ejercicios cada segundo del cronómetro.
  - `doneIds` (`computeDoneWorkoutIds`) está envuelto en `useMemo` para no leer ni parsear `localStorage` en cada render o pulsación de teclado.
- **Reducción y paralelización de llamadas a Supabase (`planSync.js`, `App.jsx`, `useAuth.js`)**:
  - `ensureDayRows` (`src/services/planSync.js`) agrupa las consultas de `exercises` y `routine_exercises` en lote con `.in(...)` e `insert`/`upsert` masivo (pasando de ~15 peticiones secuenciales por apertura de día a 2–3 consultas), y `fetchLastWeights` + `fetchRecentLogs` se ejecutan en paralelo con `Promise.all`.
  - `fetchSb` (`App.jsx`) consulta `routines` y `workout_sessions` en paralelo (`Promise.all`) con ventana de deduplicación de 8s entre cambios de pestaña (`fetchSb(true)` fuerza recarga al terminar sesión), y el efecto de estadísticas de `Mi perfil` espera a `!sbLoading` para no lanzar dos veces seguidas la consulta de `set_logs` (1000 filas).
  - `useAuth` (`src/hooks/useAuth.js`) conserva la misma referencia de `session` si el `user.id` no cambió en `INITIAL_SESSION` o `TOKEN_REFRESHED` al volver de segundo plano, evitando re-disparar efectos en cascada.

## 6. Cómo extender (pistas rápidas)

- Añadir ejercicio al plan: 1) fila en `workoutDays` (`src/data/plan.js`, id único, nombre único si es rutina), 2) entrada `E()` en `MEDIA` si es nombre nuevo, 3) bundle en `BUNDLES` con mismo `bodyPart`. `planSync` crea las filas Supabase solo. Si es rutina nueva, añadirla a `ROUTINES_BY_GOAL` según corresponda. Vistas en `src/pages/*` (puras, por props); lógica de entreno en `App.jsx` + `src/hooks/*`.
- Cambiar semana: `weekSchedule` fijo Lun-Dom (`workoutId` → `workoutDays.id`, `rest:true` descanso); el orden personalizado vive en `weekMap`/`dayRows` (swap de contenidos, nunca de días).
- Cambiar tempo/descanso: `globalRules` + `globalPhases` + `REST_SECONDS` (120) en `src/data/plan.js` + defaults `rest_seconds` en `planSync`.
- Cambiar fórmula kcal: constantes en `src/data/plan.js`, fórmulas en `src/lib/health.js`.
- Nueva tabla Supabase: añadir a `init_schema.sql` + policies RLS espejo + guard `profilesTableState`-like si debe ser tolerante.
- Nuevo componente visual: un archivo en `src/components/*` (memo + props); nueva pantalla: `src/pages/*` recibiendo props de `App.jsx` (ver auditoría de props tras cambios).

## 7. Glosario dominio

- `Tempo 3-1-1`: 3s excéntrica, 1s pausa, 1s concéntrica.
 - `Biserie`: dos ejercicios seguidos (de pie + sentado, `pair: '0594'`); en el plan se muestra como `Pantorrilla`.
- `al fallo / por lado / por pierna`: hasta fallo muscular / unilateral.
- `bodyPart vs target`: zona (chest/back/upper legs…) vs músculo (pectorals/lats/quads…).
- `equipment`: leverage/sled/cable/dumbbell/barbell/body weight.
- `S1/S2`: serie 1 (ámbar, parcial) / serie 2 (verde, completa). Solo S2 suma progreso.
- `weight_kg`: columna que guarda **libras** por legado; la UI convierte a lb/kg.
- `notes` (sesión): JSON con minutos + kcal de cardio/calentamiento + opcional kcal de máquina.
