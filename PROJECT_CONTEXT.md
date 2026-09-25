# TempoLift — Archivo de Contexto del Proyecto

> Actualizado el 2026-09-25: combobox tras card Apariencia (fix z-index), logout fuera del detalle de día, skeletons con retardo mínimo + BottomNav sin marcar en rutina.
> Fuente de verdad: `src/App.jsx` (~3048 líneas), `src/ActiveWorkout.jsx` (~467), `src/components/ExerciseItem.jsx` (~272), `src/components/BottomNav.jsx` (93), `src/components/Skeleton.jsx` (~174), `src/hooks/useDelayedVisible.js` (21), `src/services/exercisesApi.js` (~211), `src/services/planSync.js` (~159), `src/supabaseClient.js` (22), `src/main.jsx`, `src/index.css`, `src/App.css` (~2538), `package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`, `supabase/migrations/*.sql`.

## 1. Qué es

**TempoLift** es una SPA React + Vite + Supabase (sin router) para seguir un plan semanal de fuerza de 5 días estilo Planet Fitness, con tempo `3-1-1` y descanso `2-3 min`, ahora con **auth, historial persistente, pesos por serie, cardio/calentamiento contabilizados, estimación de kcal y perfil con stats**.

- Entrada: `index.html` → `div#root` → `src/main.jsx` (StrictMode) → `src/App.jsx`.
- Auth gate con `authChecking`: mientras se resuelve `getSession` no se muestra ni login ni app (fondo vacío, y skeleton solo si tarda >150ms); sin `session` solo login con Google; con sesión `home / history / profile` + detalle de día.
- Estilos: Tailwind (`src/index.css` + base body `#0b0d0c`) + `src/App.css` (sistema glassy, animaciones, tema claro, responsive, carrusel, visor GIF, bottom-nav, custom-select + fix z-index `:has(.open)`, modal-card, snackbar, day-row/day-list, skeletons `.skel` con shimmer).
- Lint: `oxlint`. Build: `vite build`. Dev: `vite`.

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
src/App.jsx                         # ~3048 líneas: app completa (home, día, historial, perfil, onboarding, timers, kcal, skeletons)
src/ActiveWorkout.jsx               # ~467 líneas: LEGADO / NO USADO — flujo paralelo de rutina genérica (ver F0). Con scroll-lock + autofocus táctil igualados
src/components/ExerciseItem.jsx     # ~272 líneas: fila ejercicio + visor + carrusel + historial (partial/blocked/lastWeight/lastReps/history)
src/components/BottomNav.jsx        # 93 líneas: nav fija Inicio/Historial/Perfil (acepta `value={null}` = ninguna activa, usado en detalle de día)
src/components/Skeleton.jsx         # ~174 líneas: Boot/Home/Day/History/Profile/Sets skeletons + SkeletonCard (ver F14)
src/hooks/useDelayedVisible.js      # 21 líneas: hook retardo mínimo anti-flash para skeletons (ver F14)
src/services/exercisesApi.js        # ~211 líneas: catálogo MEDIA + BUNDLES + helpers URL (colgado/antebrazo eliminados, curl máquina añadido)
src/services/planSync.js            # ~159 líneas: puente plan local ↔ Supabase (ensureDayRows, fetchLastWeights, fetchRecentLogs, saveDaySession)
src/supabaseClient.js               # 22 líneas: createClient + normaliza URL (`/rest/v1` fuera) + aviso claro si faltan VITE_* (requiere reiniciar `npm run dev`)
src/index.css                       # Tailwind + base body
src/App.css                         # sistema visual completo
supabase/migrations/20260924174327_init_schema.sql  # schema completo + RLS + profiles
supabase/migrations/20260924000002_profiles.sql     # migración standalone de profiles
supabase/check_security.sql         # script de revisión
.env.local                          # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (no commitear)
```

## 4. Modelo de datos

### 4.1 Plan local (en `App.jsx`)

- `globalPhases`: `warmup` (Fase 1, 5-10 min caminadora 5 km/h inc.0) y `cardio` (Fase 3, 20-30 min 4-5 km/h inc.10-12).
- `globalRules`: `{ tempo: '3-1-1', rest: '2-3 min' }`.
- `workoutDays[7]`: 1 Pecho/espalda 6ej, 2 Pierna quad/glúteo 5ej, 3 Hombro/brazo 7ej (Press militar, Laterales, Skull, Predicador, Polea, Martillo, **Curl de bíceps en máquina** — colgado eliminado), 4 Pierna isquio/glúteo 5ej, 5 Torso mixto 5ej, 6 Cuerpo completo A 7ej (pecho/espalda/pierna/hombro/brazo/pantorrilla), 7 Cuerpo completo B 7ej (torso/glúteo/isquios/hombro/brazo/abductores). Solo usan nombres con bundle existente.
- `weekSchedule[7]` fijo Lun-Dom (base de etiquetas). Plan por meta: `TRAINING_DAYS_BY_GOAL` (1:[Jue], 2:[Mié,Sáb], 3:[Mar,Jue,Sáb], 4:[Lun,Mar,Jue,Vie], 5:[Mié-Dom], 6:[Lun,Mar,Mié,Vie,Sáb,Dom], 7:toda) + `ROUTINES_BY_GOAL` (1:[6], 2:[6,7], 3:[6,4,3], 4:[1-4], 5:[1-5], 6:[1-6], 7:[1-7]; pocos días → full-body A/B, 4-5 → enfocadas) → `buildWeekMapForGoal(goal)`. Cada usuario puede mover el CONTENIDO (rutina/descanso) entre días en home (modo editar): `weekMap` (`DEFAULT_WEEK_MAP` = plan de 5, `readWeekMap/persistWeekMap` en `localStorage` por usuario `tempolift-week-map-{uid}` con validación flexible: longitud 7, ids existentes, sin duplicados) → `dayRows` + `trainingRows/trainingCount`. Swap entre días vecinos vía `moveWeekDay`; `sameSlot` apaga flechas inútiles (dos descansos). Semanas imposibles (Dom,Jue,Lun…) imposibles por diseño. Sin emojis en la UI.
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

### F0 — Auth + gate (`supabaseClient.js`, `App.jsx`)

- `supabase.auth.getSession()` + `onAuthStateChange` (ambos ponen `setAuthChecking(false)`; sin guard `done` para no bloquear logins/logouts posteriores). `signInWithGoogle` (OAuth Google, `redirectTo: origin`), `signOut` (solo vive en Mi perfil → Cuenta).
- `authChecking=true` inicial: no se renderiza login ni app (fondo vacío con `aria-busy`); si tarda >150ms (`bootVisible = useDelayedVisible(authChecking, 150)`) se muestra `BootSkeleton`. Así no hay flash de login antes de saberse la sesión.
- Sin sesión: pantalla login (`T TempoLift + Continuar con Google + tagline estático Tempo 3-1-1 · 5 días`). Con sesión: app completa.
- Sin sesión: pantalla login (`T TempoLift + Continuar con Google + tagline estático Tempo 3-1-1 · 5 días`). Con sesión: app completa.
- `friendlyError(err)`: mensaje legible (permiso 42501, red, tabla faltante PGRST) + log técnico solo en `DEV`.
- `ActiveWorkout.jsx` es **legado no usado**: implementa su propio flujo de rutina genérica (`routine_exercises` + `ensureSessionId` lazy + modales S1/S2 + `finishWorkout`). `App.jsx` lo eliminó a propósito ("un solo flujo de entreno: el plan semanal") para evitar doble conteo. No se importa en ningún lado.

### F1 — Home / Calendario semanal (`currentView==='home'`, sin `selectedDay`)

- Hero "Tu semana." + botón `Editar/Listo` (`aria-pressed`): activa el modo editar para reordenar días sin abrir nada por error (anti-missclick). La vista de cuadrícula se eliminó (redundante): solo lista. Cabecera `{trainingCount} sesiones` y footer `Plan de {N} días` dinámicos.
- Modo editar: cada fila muestra `MoveButtons` (↑ ↓ con `aria-label`/`title` de destino `Mover {contenido} al {día vecino}`, desactivadas en bordes o si el vecino tiene lo mismo) vía `moveWeekDay(idx, dir)` (swap de contenidos, días fijos); al salir (`Listo`, abrir un día o cambiar de pestaña) se desactiva. Botón `Restablecer` en la cabecera vuelve al mapa por defecto. Nota explicativa bajo la cabecera solo en edición.
- Filas glassy: contenedor `day-list` (gap, sin divide) + filas `day-row` (vidrio, radio 18px, stagger por `--d: idx*45ms`, hover desliz, active scale, badge `day-badge` con relieve, descanso `is-rest` dashed) + mini `day-progress` (rojo→verde `done`, con `progressbar` y %).
- Header: logo `T` + `TempoLift`. Footer: "Plan de 5 días / Fuerza + cardio".
- `ThemeToggle` antiguo eliminado del home; el tema ahora vive en Mi perfil.

### F2 — Detalle de día (`selectedWorkout != null`, `max-w-lg`)

- Header solo `‹ Días` (`justify-start`): el botón `Cerrar sesión` se eliminó de esta vista (el logout vive solo en Mi perfil → Cuenta).
- `BottomNav` con `value={null}` en esta vista: la rutina no es ninguna pestaña, así que ninguna va activa (sin `aria-current`). `handleNav` cierra el día al navegar. Home/historial/perfil sí pasan `value={currentView}`.
- Título `Día {posición} / {trainingCount}` (posición entre los días que entrenan, no el id). `name`, `focus`.
- Si `planIds` tarda (>150ms, `showDaySkel`), la `routine-card` se reemplaza por `DaySkeleton` (cabecera y progreso, locales, se ven al instante).
- Progreso **sticky** (`position:sticky top-2`): `done/total`, `progressbar`, texto contextual (incluye `falta: calentamiento + cardio`), línea viva `~X kcal est. (fuerza + cardio + calent.) · Y kg movidos`, `syncError` ámbar si el día no se guardará, card de descanso inline con `Omitir`.
- Banner `dayComplete`: muestra estado de guardado (`Guardado ✓ · ~X kcal / Guardando… / No se pudo guardar: …`), botón `Reiniciar ahora`.
- `routine-card` con 3 `Phase` acordeón (`warmup/strength/cardio`, default `strength`): warmup y cardio tienen su check propio de 1 marca que abre modal de minutos; fuerza lista `ExerciseItem`s con regla global tempo·rest.
- Al completar todo (`allDone`): `setDayComplete(true)` + `saveDaySession(...)` (una sola vez por firma) + `fetchSb()` + auto-`resetDay` a los **6s** (antes 4.2s).

### F3 — Tracking fuerza: 2 series + peso + descanso global

- Primer toque en check → modal peso `Serie 1/2` **vacío** (sin prefill, para no empujar marcas); subtítulo con último registro (`Último: X lb × Y reps` o `Sin registros previos`) + placeholder realista por ejercicio (`WEIGHT_HINTS_LB` + `weightHintFor`, redondeado al paso 0.5: ej. laterales 15 lb, prensa 270 lb → 122.5 kg). Confirmar guarda serie, dispara `restLeft=120`. Segundo toque → modal `Serie 2/2` + descanso. Tercer toque → desmarca y borra pesos.
- Validación de modales (peso, cardio, calentamiento) con `noValidate` + JS y avisos en `Snackbar` glassy (`snack/showSnack/closeSnack`, auto-cierre 3.5s, `role=alert`, z-60 sobre modales y navbar, render en las 3 ramas): peso múltiplo de 0.5, reps/minutos/kcal enteros dentro de rango. Sin errores inline (estados `setError/cardioError/warmupError` eliminados).
- Bloqueo durante `restLeft>0` o cualquier modal abierto (`weightModal/cardioModal/warmupModal`).
- `restLeft` cuenta atrás por `setTimeout 1s`; **no se corta al cambiar de pantalla**. UI doble: card inline en detalle + `RestPill` fija (`fixed top-20`, `role=status`) visible en home/historial/perfil con `Volver al entrenamiento` (`returnToTraining` vía `lastDay`).
- `resetDay(workoutId)`: limpia series, pesos, cardio, warmup, modales, banner, `expandedKey`, timer y `saveStatus`.

### F4 — Cardio / calentamiento (1 marca cada uno)

- `openCardio/openWarmup` → modal con minutos (cardio 1-180 default 25, warmup 1-60 default 7, enteros) + `Calorías de la máquina (opcional, enteras 0-5000)`. Validación con `parseMachineKcal` (entero) + snackbar. Preview vivo: usa máquina si se anotó, si no estima con `bodyKg`.
- Confirmar marca el check; clic de nuevo desmarca (`unmarkCardio/unmarkWarmup`). Se puede marcar con descanso activo (otra fase).

### F5 — Fila de ejercicio (`ExerciseItem.jsx`)

- Props nuevas: `partial` (S1 hecha → check ámbar `1/2`), `blocked` (descanso/modal → atenúa), `lastWeight + lastReps + weightUnit` (`exercise-reps` muestra tu última marca `150 lb × 8` con el plan en `title`; sin historial muestra el plan; chip `Últ:` eliminado por duplicado), `history` (últimas 4 series del usuario → caja `Tu historial` en el acordeón con peso×reps+fecha+serie, helpers locales `formatLb/shortDate`), `series-chip` (`2/2 ✓` verde). `aria-checked: mixed` en parcial.
- Resto igual: `custom-check` CSS (en tema claro el override base usa `:not(.checked):not(.partial)` + fills explícitos verde/ámbar con paloma blanca), `expand-btn`, `exercise-foot` (reps + target + equipment), detalle lazy con `MainViewer` (GIF 180px→340px, spinner, fallback offline, fallback genérico `hang-card` sin GIF), tags, instrucción ES, pasos (máx 3), `VariantCarousel` (scroll-snap, `listbox/option`, thumbs jsDelivr→raw fallback), atribución gymvisual + link dataset.

### F6 — Medios (`exercisesApi.js`)

- `MEDIA` ~56 entradas `E()` (sin peso corporal: colgado/antebrazo eliminados); `BUNDLES` 19 ejercicios (día 3: `Curl de bíceps en máquina` primary `0575` en vez de `Colgado en barra`); `getMediaCandidates` (RAW↔CDN), `getRepoVideoUrl`, `getExerciseBundle` con cache `Map`. El fallback `hang-card` de `ExerciseItem` queda como genérico sin GIF.

### F7 — Sincronización plan (`planSync.js`, nuevo)

- `parseTargetReps("2 x 8-10") → 8` (regex `/x\s*(\d+)/`, solo se usa en `planSync` para `target_reps`).
- `ensureDayRows(supabase, userId, workout)`: find-or-create rutina (por `name`) + por cada ejercicio find-or-create + link `routine_exercises` (`target_sets:2, rest_seconds:120, position:i`) si falta. Devuelve `{routineId, byIndex}`. Se llama al abrir un día (`useEffect[selectedDay]` + `dayStartRef=now`).
- `fetchLastWeights(supabase, userId, ids)`: último `set_logs` por `exercise_id` → texto del modal + `exercise-reps`/`lastReps`. `fetchRecentLogs(supabase, userId, ids, 4)`: últimas 4 series por ejercicio → `recentW` → caja `Tu historial` del acordeón.
- `saveDaySession(...)`: inserta `workout_sessions` (started/ended + `notes` JSON cardio/warmup) y luego `set_logs` por cada serie anotada. Retorna `session.id`.

### F8 — Historial (`currentView==='history'`)

- `fetchSb()`: últimas 20 `routines` + `workout_sessions` (se re-fetch al cambiar de vista y tras guardar). Solo terminadas (`ended_at`) cuentan.
- Stale-while-revalidate: los datos viejos nunca se borran al recargar; el contador muestra el dato existente (`sbLoading && finished.length===0` es la única condición de "Cargando…"). Sin datos + carga >150ms (`showHistorySkel`) se muestra `HistorySkeleton` (cards estilo referencia: avatar + líneas + bloque + puntos).
- Lista expandible por sesión (`openSession`): fecha, cardio/calentamiento (min + kcal máq. o estimada), series vía `set_logs + exercises(name)` ordenadas por `created_at`. Series en carga: `SetsSkeleton` inline si tarda >100ms (`showSetsSkel`), si no texto "Cargando series…".
- Edición inline por serie (`editingSet`, `editWeight/editReps` con `UnitToggle`): `update set_logs`. Borrado en 2 toques (`confirmDelete`): borra `set_logs` de la sesión + la `workout_sessions`. Mensajes vía `setMsg + friendlyError`.

### F9 — Perfil + stats + onboarding (`currentView==='profile'`)

- Tarjeta usuario (inicial + email), stats últimas 20 sesiones: **sesiones, kcal totales, kcal/sesión, racha de días** (`dayStreak`: días consecutivos con sesión, tolera hoy vacío si ayer hubo). Los `…` solo salen sin datos previos (`sbLoading && finished.length===0`, `statsLoading && statsRows.length===0`); en refetch se conserva lo visible.
- Sin `statsRows` + carga >150ms (`showProfileSkel`) se muestra `ProfileSkeleton` (cabecera + 4 tiles + cards). La sección Gráficas ya no se reemplaza por "Calculando…" en refetch: ese texto (y el de vacío) solo sale con `chartData.length===0`.
- Agregado por sesión (`useEffect[currentView==='profile']`): `set_logs` (volumen kg = Σ lb→kg×reps, peso máx lb, kcal fuerza = volumen×0.05) + `notes` (cardio/warmup kcal) → `statsRows`.
- Gráficas SVG puras (últimas 10 sesiones cronológicas + 8 semanas) con resúmenes en lenguaje simple: `CalorieBars` (apiladas fuerza rojo + cardio ámbar + calent. sky, con valor total sobre cada barra, línea de promedio y pie "promedio/best") + `WeekBars` (`sessionsByWeek`: sesiones/semana lunes-domingo, meta configurable `weekGoal` en verde, semana en curso en rojo) + `TrendLine` de peso total movido (kg, azul, con % vs primera sesión) + lista `exerciseRecords` (mejor marca por ejercicio con reps y fecha, top 6 + ver todos, en la unidad lb/kg visible). La query de stats trae `exercises(name)` para los récords.
- Formulario `Mis datos`: peso (lb/kg + `UnitToggle`), altura cm, edad, sexo (`CustomSelect`); muestra IMC si hay peso+altura; guarda en memoria + local + Supabase `profiles` (tolerante si falta tabla). Secciones Apariencia (toggle tema), Meta semanal (stepper 1-7 `weekGoal`/`changeWeekGoal` —cambiarla **regenera la semana** con `buildWeekMapForGoal` y avisa por snackbar— `readWeekGoal/persistWeekGoal` por usuario `tempolift-week-goal-{uid}`, barra `day-progress` + mensaje; consejo por nivel `weekGoalTip` sin emojis, ámbar en 7; alimenta `WeekBars goal` y su pie), Tus datos (`wipeHistory`: borra `set_logs` + `workout_sessions` del usuario con doble toque, rutinas/perfil intactos, estados `dataMsg/confirmWipe` reseteados en `handleNav`), Cuenta (cerrar sesión).
- `OnboardingModal` (cuentas nuevas sin peso): peso obligatorio (30-300) + altura/edad/sexo opcionales + `Omitir por ahora`. Se abre según `isProfileComplete`.
- Sistema lb/kg global: todo se **guarda en lb** (columna `weight_kg` histórica); `readWeightUnit/persistWeightUnit`, `displayWeight/displayToLb/convertInputUnit`, `bodyKgToDisplay/displayToBodyKg`. `switchWeightUnit` convierte todos los inputs abiertos a la vez. Peso corporal default 75 kg (`DEFAULT_BODY_KG`).

### F10 — Estimación de kcal

- Fuerza: `volumenKg × 0.05` (≈1 kcal / 20 kg movidos). Cardio: `8 MET × bodyKg × (min/60)`. Calentamiento: `3.5 MET × bodyKg × (min/60)`. Si hay kcal de máquina, reemplazan la estimación en día + historial + gráficas. `parseSessionExtras(notes)` tolera sesiones viejas/texto libre.

### F11 — Tema / perfil local / robustez

- `theme dark|light` (`tempolift-theme`), `weightUnit` (`tempolift-weight-unit`), `bodyKg` (`tempolift-body-kg` + `tempolift-profile-{uid}` JSON), `weekMap` (`tempolift-week-map-{uid}`), `weekGoal` (`tempolift-week-goal-{uid}`), clases `theme-dark/theme-light` en `<main>`.
- `profilesTableState` (null/true/false): si la migración no está aplicada (404/PGRST205) se detecta una vez y no se reintenta (cero ruido red/consola); todo sigue en local. `upsertProfile` tolerante. `markProfilesChecked/isMissingTableError`.
- `BottomNav` fija fuera del `<main>` animado (si no, `fixed` se vuelve relativo al main con `transform`); recibe `theme` por prop por el mismo motivo. `RestPill` igual.
- Modales sin scroll de fondo: `useEffect[anyModalOpen]` pone `body{overflow:hidden; overscroll:none}` (en `App.jsx` y `ActiveWorkout.jsx`); overlay `overflow-y-auto overscroll-contain` + card `.modal-card m-auto` (scroll interno si supera `100dvh-2rem`); `autoFocus={FINE_POINTER}` (solo puntero fino, en táctil no abre el teclado de golpe).
- SPA sin router: `useEffect[selectedDay, currentView]` hace `window.scrollTo(0,0)` para que cada pantalla empiece arriba.
- `CustomSelect` (reemplaza `<select>` vanilla): botón + lista glassy, teclado (↑↓/Enter/Esc), click-fuera, `listbox/option`, opción vacía "Prefiero no decir/Selecciona…". Fix z-index: cada `.glass-card` crea stacking context (`backdrop-filter`), así que la lista (`z-60`) quedaba tras la card siguiente (Apariencia); con `.custom-select.open { z-index:40 }` + `.glass-card:has(.custom-select.open):not(.modal-card) { z-index:30; overflow:visible }` la card abierta sube por encima (`:not(.modal-card)` para no romper el scroll interno del onboarding).
- `SEX_OPTIONS = masculino/femenino/otro`.

### F12 — Visual / UX / a11y (heredado + añadidos)

- Glassmorphism, orbes fijos, springs, stagger, `prefers-reduced-motion`, responsive `max-w-4xl/ max-w-lg`, `pb-28` por bottom-nav, `sticky` progreso, modales `fixed z-50 bg-black/70` con card `.modal-card` (scroll interno, inputs 16px en móvil), `UnitToggle`, `bottom-nav`, `custom-select`, `.snackbar`, skeletons `.skel` (ver F14), viewport con `viewport-fit=cover, interactive-widget=resizes-content` en `App.css` / `index.html`.
- A11y: `checkbox/progressbar/tab/listbox/option/status/dialog/alert`, `aria-expanded/checked/selected/pressed`, `aria-live` en descanso/kcal/IMC/meta, `loading=lazy`, `focus-visible`.

### F13 — Límites conocidos

- Sin router, sin i18n (ES + nombres EN dataset), sin tests, README aún plantilla Vite.
- GIF/JPG requieren red (raw↔jsDelivr); offline → fallback.
- Sin ejercicios de peso corporal sin GIF (colgado eliminado). Columna `weight_kg` guarda lb (legado, documentado en código).
- `ActiveWorkout.jsx` muerto: si se quiere rutina libre, hay que reconectarlo o borrarlo.
- `.env.local` requerido (`VITE_SUPABASE_URL` base sin `/rest/v1` + `VITE_SUPABASE_ANON_KEY` formato `sb_…` válido); Vite solo lo lee al arrancar (`npm run dev` tras editarlo). Sin él Supabase falla (ver `friendlyError`).

### F14 — Skeleton screens con retardo mínimo (`Skeleton.jsx`, `useDelayedVisible.js`, `.skel` en `App.css`)

- Estilo de la imagen de referencia: card con cabecera (avatar/punto + 2 líneas), bloque grande y 3 puntos abajo, con barrido shimmer (`skel-sweep` 1.4s) + pulso en puntos. Variante gris en tema claro (`.theme-light .skel`), sin animación con `prefers-reduced-motion`. Todo `aria-hidden` dentro de contenedores `role=status` + `aria-label` ("Cargando…").
- `useDelayedVisible(active, delay)`: `setTimeout` en `useEffect`; solo muestra el skeleton si la carga persiste tras el retardo. Retardos mínimos anti-flash: **150ms** páginas (boot/historial/perfil/día, default del hook), **100ms** series inline (gesto del usuario). El retardo NO retrasa los datos: el contenido real se pinta en cuanto llega; home (datos locales) no usa skeleton.
- Regla anti-parpadeo "datos → vacío → datos": skeletons y textos de carga (`…`, "Cargando…", "Calculando…") solo aparecen **sin datos previos**; en refetch se conserva lo visible (stale-while-revalidate). `SetsSkeleton` inline en sesión expandida; `DaySkeleton` con `rows = exercises.length`.
- Nota lint: `oxlint` avisa `react(set-state-in-effect)` en el hook (patrón estándar de retardo, solo warning); resto de warnings preexistentes (`ThemeToggle`/`profileLoading`/`handleBodyKg` sin uso, `DATASET_REPO`, `ActiveWorkout`, `dayWeights` en deps).

## 6. Cómo extender (pistas rápidas)

- Añadir ejercicio al plan: 1) fila en `workoutDays` (`App.jsx`, id único), 2) entrada `E()` en `MEDIA` si es nombre nuevo, 3) bundle en `BUNDLES` con mismo `bodyPart`. `planSync` crea las filas Supabase solo. Si es rutina nueva, añadirla a `ROUTINES_BY_GOAL` según corresponda.
- Cambiar semana: `weekSchedule` fijo Lun-Dom (`workoutId` → `workoutDays.id`, `rest:true` descanso); el orden personalizado vive en `weekMap`/`dayRows` (swap de contenidos, nunca de días).
- Cambiar tempo/descanso: `globalRules` + `globalPhases` + `REST_SECONDS` (120) + defaults `rest_seconds` en `planSync` y `ActiveWorkout` si se revive.
- Cambiar fórmula kcal: constantes `LB_TO_KG/LB_PER_KG/KCAL_PER_KG_MOVED/CARDIO_MET/WARMUP_MET/DEFAULT_*` en `App.jsx` (y duplicadas `LB_PER_KG` en `ActiveWorkout.jsx`).
- Nueva tabla Supabase: añadir a `init_schema.sql` + policies RLS espejo + guard `profilesTableState`-like si debe ser tolerante.
- Borrar flujo muerto: eliminar `src/ActiveWorkout.jsx` (verificar que nada lo importe) o reconectarlo a `BottomNav` como 4ª pestaña.

## 7. Glosario dominio

- `Tempo 3-1-1`: 3s excéntrica, 1s pausa, 1s concéntrica.
- `Biserie`: dos ejercicios seguidos (pantorrilla de pie + sentado, `pair: '0594'`).
- `al fallo / por lado / por pierna`: hasta fallo muscular / unilateral.
- `bodyPart vs target`: zona (chest/back/upper legs…) vs músculo (pectorals/lats/quads…).
- `equipment`: leverage/sled/cable/dumbbell/barbell/body weight.
- `S1/S2`: serie 1 (ámbar, parcial) / serie 2 (verde, completa). Solo S2 suma progreso.
- `weight_kg`: columna que guarda **libras** por legado; la UI convierte a lb/kg.
- `notes` (sesión): JSON con minutos + kcal de cardio/calentamiento + opcional kcal de máquina.
