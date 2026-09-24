# TempoLift — Archivo de Contexto del Proyecto

> Generado el 2026-09-22 tras lectura completa del repo.
> Fuente de verdad: `src/App.jsx`, `src/components/ExerciseItem.jsx`, `src/services/exercisesApi.js`, `src/main.jsx`, `src/index.css`, `src/App.css`, `package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`.

## 1. Qué es

**TempoLift** es una SPA React + Vite (sin router, sin backend) para visualizar y seguir un plan semanal de fuerza de 5 días estilo Planet Fitness, con tempo controlado `3-1-1` y descanso `2-3 min`.

- Entrada: `index.html` → `div#root` → `src/main.jsx` (StrictMode) → `src/App.jsx`.
- Estilos: Tailwind (`src/index.css`: `@tailwind base/components/utilities` + base body `#0b0d0c`) + `src/App.css` (~1920 líneas: sistema glassy, animaciones, tema claro, responsive, carrusel, visor GIF).
- Lint: `oxlint`. Build: `vite build`. Dev: `vite`.

## 2. Stack

| Capa | Versión / detalle |
|---|---|
| `react`, `react-dom` | `^19.2.8` |
| `vite`, `@vitejs/plugin-react` | `^8.2.2`, `^6.1.0` |
| `tailwindcss`, `postcss`, `autoprefixer` | `^3.4.19`, `^8.5.28`, `^10.5.5` |
| Contenido Tailwind | `./index.html`, `./src/**/*.{js,ts,jsx,tsx}` |
| Estado | Solo `useState`/`useEffect`/`useCallback`/`useMemo` en memoria, sin persistencia (se pierde al recargar) |
| Datos ejercicios | Catálogo curado local en `exercisesApi.js`, medios remotos bajo demanda (GIF/JPG de `exercises-dataset`) |

## 3. Estructura de archivos

```
index.html
public/favicon.svg, public/icons.svg
src/main.jsx            # bootstrap React
src/App.jsx             # 423 líneas: toda la lógica de pantallas + datos del plan
src/components/ExerciseItem.jsx  # 239 líneas: fila ejercicio + visor + carrusel variantes
src/services/exercisesApi.js     # 217 líneas: catálogo MEDIA + BUNDLES + helpers URL
src/index.css           # Tailwind + base body
src/App.css             # sistema visual completo
src/assets/hero.png, react.svg, vite.svg
```

## 4. Modelo de datos (en `App.jsx`)

- `globalPhases`: `warmup` (Fase 1, 5-10 min caminadora 5km/h inc.0) y `cardio` (Fase 3, 20-30 min 4-5km/h inc.10-12).
- `globalRules`: `{ tempo: '3-1-1', rest: '2-3 min' }`.
- `workoutDays[5]`:
  1. Pecho y espalda / Torso / `bg-red-500` — 6 ej: Press inclinado 2x8, Remo en T 2x8-10, Press plano 2x8, Jalón a pecho 2x8-10, Pec Fly 1x fallo, Jalón unilateral 1x fallo/lado.
  2. Pierna / Cuádriceps y glúteo / `bg-orange-300` — 5 ej: Prensa 2x10, Extensión quad 2x10-12, Aductores 2x12, Abductores 2x12, Biserie pantorrillas 2x12+2x12.
  3. Hombro y brazo / Torso / `bg-sky-300` — 7 ej: Press militar 2x8, Laterales 2x12, Skull crushers 2x8-10, Curl predicador 2x10, Tríceps polea 2x10, Curl martillo 2x10, Colgado barra 2x fallo.
  4. Pierna / Isquios y glúteo / `bg-rose-300` — 5 ej: Prensa, Curl isquio sentado, Patada glúteo 2x10/pierna, Abductores, Biserie pantorrillas.
  5. Torso mixto / Pecho, espalda y hombro / `bg-violet-300` — 5 ej: Press inclinado, Jalón pecho, Press plano, Remo T, Laterales.
- `weekSchedule[7]`: Lun descanso, Mar descanso, Mié→id1, Jue→id2, Vie→id3, Sáb→id4, Dom→id5.

## 5. Funcionalidades (completo)

### F1 — Home / Calendario semanal (`App()` sin `selectedDay`)
- Hero: “Tu semana.” + “Tu plan de hoy / Visualiza tu entrenamiento…”.
- Toggle vista `calendarView: 'list' | 'grid'` con `role=tablist`, `aria-selected`, animación `view-switch` (`key={calendarView}` fuerza re-animación).
- Vista Lista: `divide-y`, filas descanso (`opacity-60`, “—”) vs entreno (botón → `selectDay(id)`, muestra `done/total ✓`, flecha `→` con hover).
- Vista Cuadrícula: `grid-cols-7 min-w-[700px]` con scroll horizontal `.calendar-scroll`, cards descanso dashed vs `glass-cell` entreno con “Ver sesión”.
- Header: logo `T` + `TempoLift` + `ThemeToggle`. Footer: “Plan de 5 días / Fuerza + cardio”.
- Contador “5 sesiones”.

### F2 — Detalle de día (`selectedDay != null`, `max-w-lg`)
- Header: botón `‹ Días` (`goBack`) + `ThemeToggle`.
- Título: `Día {id} / 5`, `name` (4xl black), `focus`.
- Tarjeta progreso glass: `Progreso del día done/total`, `role=progressbar` + `.progress-track/.progress-fill width %`, texto contextual (0 → “Marca cada ejercicio…”, parcial → “N por completar”, total → “¡Día completado! Reiniciando…”).
- Banner `dayComplete` (`role=status`): check animado SVG, “¡Día terminado! 🎉”, nota auto-reset, botón “Reiniciar ahora” → `resetDay(id)`.
- `routine-card` con 3 `Phase` acordeón (`openPhase`, default `'strength'`): Warmup (Fase1) / Fuerza (Fase2, `N ejercicios · toca para ver animación` + banda “Regla global tempo·rest”) / Cardio (Fase3). Solo una abierta a la vez; clic de nuevo cierra (`''`).
- Nota final: “Escucha tu cuerpo · Mantén el control”.

### F3 — Tracking de progreso por día
- Estado: `checkedByDay: { workoutId: number[] }`, `checkedList`, `doneCount`, `progress`, `allDone`.
- `toggleCheck(workoutId, index)`: Set + sort, resetea `dayComplete=false`.
- `resetDay`: vacía checks, cierra banner, colapsa detalle (`expandedKey=null`).
- `useEffect[allDone]`: si todo marcado → `setDayComplete(true)` + `setTimeout 4200ms → resetDay` (auto-limpieza sin recargar). Cleanup clearTimeout.
- `useEffect[selectedDay]`: al cambiar de día colapsa y oculta banner.
- `expandedKey: "workoutId-index"` — solo un ejercicio expandido a la vez.

### F4 — Fila de ejercicio (`ExerciseItem.jsx`)
- Layout: `custom-check` (role=checkbox) + `exercise-text` (num `01`, nombre, nota) + `expand-btn` chevron + `exercise-foot` (reps + `foot-chip target` + `foot-chip.dim equipment`).
- Check custom 100% CSS: pop `check-pop`, ripple `ripple-out`, draw SVG `stroke-dashoffset`, tachado animado `line-through-anim::after strike-in`, num verde `.done`.
- Expandir monta detalle bajo demanda (menos DOM/GIF/lag). `onExpand` alterna.
- Estado local por item: `activeId` (variante seleccionada), `enlarged` (visor grande).

### F5 — Detalle expandido de ejercicio
- `MainViewer`: GIF principal 180px sobre fondo blanco, spinner hasta `onLoad`, `useMediaRunner` prueba `gifs[]` luego `images[]`, fallback “🏋️ Animación no disponible offline”. Badge `GIF · {id}`, hint `⤢ amplía/reduce`. Clic alterna `.enlarged` (340px max). Si `!entry.gif` (ej. `hang` peso corporal) → tarjeta `hang-card 🤸 Peso corporal · barra + instrucción`.
- Tags: `target, bodyPart, equipment`. Nombre EN dataset. Si `bundle.pair && active==primary` → “🔁 Biserie: alterna con …”.
- Instrucción ES (`primary.es`, clamp 4 líneas) + `ol.detail-steps` (máx 3 pasos).
- `VariantCarousel`: solo si `>1` variante. Track horizontal scroll-snap + botones `‹ ›` (`scrollBy 220px smooth`), `role=listbox/option`, `aria-selected`. Card 148px: thumb 64px (jsDelivr con fallback a raw.githubusercontent, hide si falla), `★ nombre` para principal, `equipment`. Clic cambia `activeId` y colapsa zoom.
- Atribución: `© Gym visual — https://gymvisual.com/` + link `ver en el dataset ↗` (`getRepoVideoUrl`).

### F6 — Servicio de medios (`exercisesApi.js`)
- Sin fetch pesado: no descarga `exercises.json` 17MB; catálogo curado con IDs exactos.
- `MEDIA[id] = E(...)`: `{id,name EN,equipment,target,bodyPart,gif, image,es,steps}`. ~60 entradas + `hang` custom sin medios.
- `BUNDLES[nombreES] = {primary, pair?, variants[]}` — 19 ejercicios del plan. Todas las variantes comparten `bodyPart` con principal. `Biserie pantorrillas` tiene `pair: '0594'`.
- Helpers: `getMediaCandidates(entry)` → `{gifs:[RAW,CDN], images:[RAW,CDN]}`, `getRepoVideoUrl`, `getExerciseBundle(nombre)` con `Map` cache, `MEDIA_BASES=[RAW,CDN]`, `DATASET_REPO`, `ATTRIBUTION`.
- Prioridad Planet Fitness documentada: leverage/sled/smith primero; cable solo polea correcta; mancuerna/barra solo movimiento libre real.

### F7 — Tema claro/oscuro
- `theme: 'dark'|'light'`, `ThemeToggle` memo (☀ Claro / ☾ Oscuro, `aria-label`).
- Clases `theme-dark/theme-light` en `main.app-shell`. `App.css` sobrescribe Tailwind (`!important`) para fondo `#f4f6ef`, textos, glass claro esmerilado, orbes opacidad, checks, chips, carrusel.

### F8 — Sistema visual / UX
- Glassmorphism: `glass-card/hero-inset/pill/num/cell`, `backdrop-filter blur 20px saturate`, bordes `rgba(255,255,255,.12)`, sombras + `inset hi-light`. Orbes fijos `position:fixed 100dvh blur 70px` (rojo + azul) flotando `orb-float`.
- Animaciones spring `--spring: cubic-bezier(.22,1,.36,1)`, bounce `--spring-bounce`: `screen-enter 420ms`, `view-switch 360ms`, `card-enter 500ms`, `phase-content 320ms`, `calendar-item stagger 35ms*index`, `detail-in 380ms + detail-stagger 450ms` por hijo, `gif-in 550ms`, `shine-slide 2.8s`, `icon-in`, `banner-in`.
- Perf: detalle montado solo al expandir, `memo(Phase/ThemeToggle/BackgroundOrbs/ExerciseItem)`, `useCallback` handlers, sin blur por fila (`backdrop-filter:none` en chips/checks), orbes fijos para no repintar, `prefers-reduced-motion: reduce` desactiva todo.
- Responsive: `max-w-4xl` home / `max-w-lg` detalle, `sm:flex-row` hero, grid 7 con scroll en móvil, `@media (max-width:480px)` reduce paddings/fuentes/cards 132px/GIF 300px.
- A11y: `aria-expanded` fases/ejercicios, `role=checkbox/progressbar/tab/listbox/option/status`, `aria-label` botones, `loading=lazy decoding=async draggable=false` en imgs, `focus-visible` en checks.

### F9 — No-funcional / límites conocidos
- Sin persistencia (localStorage no usado), sin router, sin i18n (ES hardcoded + nombres EN dataset), sin tests, README es plantilla Vite sin documentar app.
- Dependencia red para GIF/JPG (raw.githubusercontent ↔ cdn.jsdelivr); offline muestra fallback.
- `hang` y variantes antebrazo (`1421,0721,1428`) son peso corporal sin GIF.

## 6. Cómo extender (pistas rápidas)

- Añadir ejercicio: 1) fila en `workoutDays` en `App.jsx`, 2) entrada `E()` en `MEDIA`, 3) bundle en `BUNDLES` con `primary+variants` mismo `bodyPart`.
- Cambiar plan semanal: editar `weekSchedule` (usa `workoutId` → `workoutDays.id`, `rest:true` para descanso).
- Persistir checks: envolver `checkedByDay` con `localStorage` en `useEffect`.
- Cambiar tempo/descanso: `globalRules` + textos `globalPhases`.

## 7. Glosario dominio

- `Tempo 3-1-1`: 3s excéntrica, 1s pausa, 1s concéntrica.
- `Biserie`: dos ejercicios seguidos (pantorrilla de pie + sentado).
- `al fallo`: hasta fallo muscular. `Por lado / por pierna`: unilateral.
- `bodyPart vs target`: zona (chest/back/upper legs…) vs músculo (pectorals/lats/quads…).
- `equipment`: leverage/sled/cable/dumbbell/barbell/body weight.
