/**
 * Catálogo Planet Fitness sobre el dataset https://github.com/hasaneyldrm/exercises-dataset
 *
 * Rendimiento: en vez de descargar y parsear los 17 MB del exercises.json en el
 * hilo principal (lo que congelaba el localhost), usamos un catálogo curado y
 * ligero con los IDs exactos de máquina del dataset. Cero fetch en la ruta
 * crítica: solo se cargan bajo demanda las imágenes/GIF que el usuario despliega.
 *
 * Prioridad de implementos (Planet Fitness): leverage machine / sled machine /
 * smith machine primero; cable solo donde la estación de polea es lo correcto
 * (pushdown, patada de glúteo en polea baja); mancuerna/barra solo donde el
 * ejercicio libre es el movimiento real (skull crusher) o no hay máquina.
 *
 * Medios © Gym visual — https://gymvisual.com/ (ver NOTICE del repo).
 * Repo: https://github.com/hasaneyldrm/exercises-dataset
 */

const RAW = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'
const CDN = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main'

export const MEDIA_BASES = [RAW, CDN]
export const DATASET_REPO = 'https://github.com/hasaneyldrm/exercises-dataset'
export const ATTRIBUTION = '© Gym visual — https://gymvisual.com/'

const gif = (id, media) => `videos/${id}-${media}.gif`
const img = (id, media) => `images/${id}-${media}.jpg`

// id, nombre EN del dataset, implemento, target, zona, gif, instrucción ES, pasos ES
function E(id, name, equipment, target, bodyPart, media, es, steps = []) {
  return { id, name, equipment, target, bodyPart, gif: media ? gif(id, media) : null, image: media ? img(id, media) : null, es, steps }
}

const MEDIA = {
  '1299': E('1299', 'lever incline chest press', 'leverage machine', 'pectorals', 'chest', 'jHAnWmT',
    'Ajusta asiento y respaldo. Espalda apoyada, pies planos. Agarre prono un poco más abierto que los hombros. Empuja al frente hasta extender los brazos, pausa y vuelve lento.',
    ['Ajusta el asiento y el respaldo a una posición cómoda.', 'Siéntate con la espalda apoyada y los pies planos.', 'Empuja al frente hasta extender los brazos y vuelve lento.']),
  '1479': E('1479', 'lever incline chest press v. 2', 'leverage machine', 'pectorals', 'chest', 'o17Jfkt',
    'Variante inclinada en máquina de palanca: mismo empuje al frente con respaldo inclinado.', []),
  '0577': E('0577', 'lever chest press', 'leverage machine', 'pectorals', 'chest', 'T0yTjgW',
    'Ajusta la altura del asiento, espalda totalmente apoyada. Agarre prono, codos a 90°. Empuja al frente hasta extender, exhalando. Pausa breve y vuelve lento.',
    ['Ajusta la altura del asiento con la espalda apoyada.', 'Agarre prono con codos a 90 grados.', 'Empuja al frente hasta extender y vuelve lento.']),
  '0576': E('0576', 'lever chest press', 'leverage machine', 'pectorals', 'chest', 'DOoWcnA', 'Press horizontal en máquina: variante de agarre del chest press.', []),
  '1300': E('1300', 'lever decline chest press', 'leverage machine', 'pectorals', 'chest', 'vsVoPHt', 'Press declinado en máquina: énfasis en la parte baja del pecho.', []),
  '0596': E('0596', 'lever seated fly', 'leverage machine', 'pectorals', 'chest', 'v3xmPAR',
    'Espalda apoyada, agarre pronado y codos semiflexionados. Junta las asas frente al pecho contrayendo, pausa y abre lento.',
    ['Espalda apoyada y codos ligeramente flexionados.', 'Junta las asas frente al pecho contrayendo.', 'Vuelve lento a la apertura inicial.']),
  '1349': E('1349', 'lever reverse t-bar row', 'leverage machine', 'upper back', 'back', 'BgljGjd',
    'Pecho contra la almohadilla, pies en la plataforma. Agarre prono algo más abierto que los hombros. Tira hacia el pecho juntando omóplatos, pausa y suelta lento.',
    ['Pecho contra la almohadilla y pies en la plataforma.', 'Agarre prono algo más abierto que los hombros.', 'Tira al pecho juntando omóplatos y suelta lento.']),
  '1351': E('1351', 'lever t-bar reverse grip row', 'leverage machine', 'upper back', 'back', 'FVM1AUZ', 'Remo en T con agarre invertido en máquina: más énfasis en dorsales bajos.', []),
  '1348': E('1348', 'lever reverse grip vertical row', 'leverage machine', 'upper back', 'back', 'ZqNOWQ6', 'Remo vertical con agarre supino en máquina para espalda alta.', []),
  '1350': E('1350', 'lever seated row', 'leverage machine', 'upper back', 'back', '7I6LNUG', 'Remo sentado en máquina con pecho apoyado y agarre prono.', []),
  '0588': E('0588', 'lever narrow grip seated row', 'leverage machine', 'upper back', 'back', 'IGjKj1v', 'Remo sentado con agarre estrecho neutro para grosor de espalda.', []),
  '0571': E('0571', 'lever alternating narrow grip seated row', 'leverage machine', 'upper back', 'back', 'w2oRpuH', 'Remo alterno un brazo a la vez para corregir descompensaciones.', []),
  '0579': E('0579', 'lever front pulldown', 'leverage machine', 'lats', 'back', '7F1DVzn',
    'Rodillas bajo las almohadillas, pies planos. Agarre prono algo más abierto que los hombros. Pecho alto y ligera curva lumbar. Tira hacia el pecho liderando con los codos.',
    ['Rodillas bajo las almohadillas y pies planos.', 'Agarre prono algo más abierto que los hombros.', 'Tira hacia el pecho liderando con los codos.']),
  '0673': E('0673', 'reverse grip machine lat pulldown', 'leverage machine', 'lats', 'back', 'ecpY0rH', 'Jalón en máquina con agarre supino: más trabajo de dorsal bajo y bíceps.', []),
  '2736': E('2736', 'lever reverse grip lateral pulldown', 'leverage machine', 'lats', 'back', 'ky8FLU8', 'Jalón lateral con agarre invertido en máquina de palanca.', []),
  '1347': E('1347', 'lever one arm lateral wide pulldown', 'leverage machine', 'lats', 'back', 'tTuZSDT',
    'Pecho contra la almohadilla. Un brazo extendido con ligera flexión de codo. Tira hacia abajo y cruzando hacia la cadera opuesta, apretando el dorsal.',
    ['Pecho contra la almohadilla, brazo extendido.', 'Tira hacia abajo cruzando a la cadera opuesta.', 'Aprieta el dorsal abajo y devuelve lento.']),
  '0739': E('0739', 'sled 45° leg press', 'sled machine', 'glutes', 'upper legs', '10Z2DXU',
    'Espalda contra el respaldo, pies a la altura de los hombros en la placa. Sujeta las asas laterales. Empuja extendiendo sin bloquear rodillas, talones siempre apoyados.',
    ['Espalda contra el respaldo y pies en la placa.', 'Sujeta las asas laterales para estabilizarte.', 'Empuja sin bloquear rodillas y baja controlado.']),
  '1464': E('1464', 'sled 45° leg press (back pov)', 'sled machine', 'glutes', 'upper legs', 'yn2lLSI', 'Prensa a 45° vista trasera: misma técnica, pies firmes y rodillas alineadas.', []),
  '1463': E('1463', 'sled 45° leg press (side pov)', 'sled machine', 'glutes', 'upper legs', '2Qh2J1e', 'Prensa a 45° vista lateral: controla la profundidad sin despegar la espalda.', []),
  '0585': E('0585', 'lever leg extension', 'leverage machine', 'quads', 'upper legs', 'my33uHU',
    'Asiento y respaldo a tu medida, espalda apoyada. Extiende las rodillas levantando el peso, pausa arriba y baja lento sin dejar caer.',
    ['Ajusta asiento y respaldo a tu cuerpo.', 'Extiende las rodillas levantando el peso.', 'Pausa arriba y baja lento sin dejar caer.']),
  '0598': E('0598', 'lever seated hip adduction', 'leverage machine', 'adductors', 'upper legs', 'oHsrypV',
    'Espalda apoyada, pies en los apoyos. Junta lentamente las piernas apretando la cara interna del muslo. Pausa en máxima contracción y abre lento.',
    ['Espalda apoyada y pies en los apoyos.', 'Junta las piernas apretando la cara interna.', 'Pausa arriba y abre lento.']),
  '0597': E('0597', 'lever seated hip abduction', 'leverage machine', 'abductors', 'upper legs', 'CHpahtl',
    'Rodillas a 90°, espalda apoyada. Empuja las piernas hacia afuera lejos de la línea media. Pausa al final y vuelve lento.',
    ['Rodillas a 90° con la espalda apoyada.', 'Empuja las piernas hacia afuera.', 'Pausa al final y vuelve lento.']),
  '0599': E('0599', 'lever seated leg curl', 'leverage machine', 'hamstrings', 'upper legs', 'Zg3XY7P',
    'Sentado con la espalda apoyada, tibias bajo la palanca justo encima de los tobillos. Flexiona hacia arriba apretando isquios, pausa y baja lento.',
    ['Espalda apoyada y tibias bajo la palanca.', 'Flexiona hacia arriba apretando isquios.', 'Pausa y baja lento a la posición inicial.']),
  '0582': E('0582', 'lever kneeling leg curl', 'leverage machine', 'hamstrings', 'upper legs', 'nnmCTLN', 'Curl de rodilla arrodillado en máquina para isquios.', []),
  '0586': E('0586', 'lever lying leg curl', 'leverage machine', 'hamstrings', 'upper legs', '17lJ1kr', 'Curl tumbado boca abajo en máquina para isquios.', []),
  '2286': E('2286', 'lever hip extension v. 2', 'leverage machine', 'glutes', 'upper legs', 'OPqShYN',
    'Ajusta la máquina, espalda apoyada y pies en los apoyos. Activa glúteos e isquios y extiende la cadera empujando atrás. Pausa arriba y baja lento.',
    ['Espalda apoyada y pies en los apoyos.', 'Extiende la cadera empujando atrás.', 'Pausa arriba y baja lento.']),
  '0593': E('0593', 'lever reverse hyperextension', 'leverage machine', 'glutes', 'upper legs', 'Krmb3cB', 'Hiperextensión inversa en máquina para glúteo e isquio.', []),
  '0578': E('0578', 'lever deadlift', 'leverage machine', 'glutes', 'upper legs', 'GUT8I22', 'Peso muerto en máquina de palanca para cadena posterior.', []),
  '0228': E('0228', 'cable standing hip extension', 'cable', 'glutes', 'upper legs', 'Kpajagk',
    'Tobillera en polea baja, de espaldas a la máquina. Extiende la pierna atrás apretando el glúteo arriba. Pausa y vuelve lento, una pierna a la vez.',
    ['Tobillera en polea baja, de espaldas.', 'Extiende atrás apretando el glúteo.', 'Pausa arriba y vuelve lento.']),
  '0605': E('0605', 'lever standing calf raise', 'leverage machine', 'calves', 'lower legs', 'ykUOVze',
    'De pie, hombros bajo las almohadillas. Eleva los talones al máximo extendiendo tobillos. Pausa arriba y baja lento.',
    ['Hombros bajo las almohadillas.', 'Eleva los talones al máximo.', 'Pausa arriba y baja lento.']),
  '0594': E('0594', 'lever seated calf raise', 'leverage machine', 'calves', 'lower legs', 'bOOdeyc',
    'Sentado con los metatarsos en la placa y talones fuera del borde. Empuja con la parte delantera del pie, sube al máximo y baja lento.',
    ['Metatarsos en la placa, talones fuera.', 'Empuja elevando los talones al máximo.', 'Baja lento a la posición inicial.']),
  '2289': E('2289', 'lever calf press', 'leverage machine', 'calves', 'lower legs', '7B4F5nZ', 'Prensa de gemelo en máquina de palanca.', []),
  '1385': E('1385', 'lever seated squat calf raise on leg press machine', 'leverage machine', 'calves', 'lower legs', 'IeDEXTe', 'Gemelo en la prensa de piernas con rodillas casi extendidas.', []),
  '0587': E('0587', 'lever military press', 'leverage machine', 'delts', 'shoulders', 'CggQhII',
    'Espalda apoyada, agarre prono algo más abierto que los hombros. Empuja arriba sin bloquear codos. Pausa y baja lento.',
    ['Espalda apoyada y agarre prono.', 'Empuja arriba sin bloquear codos.', 'Pausa y baja lento.']),
  '0603': E('0603', 'lever shoulder press', 'leverage machine', 'delts', 'shoulders', '67n3r98', 'Press de hombro en máquina con agarre prono a la altura de los hombros.', []),
  '0869': E('0869', 'lever shoulder press v. 2', 'leverage machine', 'delts', 'shoulders', 'vqsbmL0', 'Press de hombro en máquina, variante 2 de recorrido.', []),
  '2318': E('2318', 'lever shoulder press v. 3', 'leverage machine', 'delts', 'shoulders', 'dNFYIU1', 'Press de hombro en máquina, variante 3 de recorrido.', []),
  '0590': E('0590', 'lever one arm shoulder press', 'leverage machine', 'delts', 'shoulders', '2KGnL6M', 'Press de hombro unilateral en máquina para corregir descompensaciones.', []),
  '0584': E('0584', 'lever lateral raise', 'leverage machine', 'delts', 'shoulders', 'dRTfGZT',
    'Espalda contra la almohadilla, agarre prono y brazos rectos. Eleva lateral hasta la paralela al suelo. Pausa y baja lento.',
    ['Espalda contra la almohadilla, brazos rectos.', 'Eleva lateral hasta la paralela.', 'Pausa y baja lento.']),
  '0602': E('0602', 'lever seated reverse fly', 'leverage machine', 'delts', 'shoulders', 'myfUsKf', 'Apertura posterior sentada en máquina para deltoide posterior.', []),
  '0601': E('0601', 'lever seated reverse fly (parallel grip)', 'leverage machine', 'delts', 'shoulders', 'xiHiJcA', 'Apertura posterior con agarre neutro en máquina.', []),
  '0060': E('0060', 'barbell lying triceps extension skull crusher', 'barbell', 'triceps', 'upper arms', 'h8LFzo9',
    'En banco, brazos extendidos sobre el pecho. Solo flexiona los codos bajando la barra a la frente. Pausa y extiende sin mover el hombro.',
    ['Brazos extendidos sobre el pecho.', 'Baja a la frente solo flexionando codos.', 'Extiende de vuelta sin mover el hombro.']),
  '0607': E('0607', 'lever triceps extension', 'leverage machine', 'triceps', 'upper arms', 'Ser9eQp', 'Extensión de tríceps en máquina con la espalda apoyada.', []),
  '1451': E('1451', 'lever seated dip', 'leverage machine', 'triceps', 'upper arms', 'BRImeP8', 'Fondos sentados en máquina para tríceps.', []),
  '0592': E('0592', 'lever preacher curl', 'leverage machine', 'biceps', 'upper arms', 'b6hQYMb',
    'Brazos sobre la almohadilla, agarre supino. Flexiona hacia los hombros sin despegar los codos. Pausa contrayendo y baja lento.',
    ['Brazos sobre la almohadilla, agarre supino.', 'Flexiona hacia los hombros.', 'Pausa contrayendo y baja lento.']),
  '1614': E('1614', 'lever preacher curl v. 2', 'leverage machine', 'biceps', 'upper arms', 'ye84CTU', 'Predicador en máquina v.2 con pecho contra el soporte.', []),
  '0575': E('0575', 'lever bicep curl', 'leverage machine', 'biceps', 'upper arms', 'q6y3OhV', 'Curl de bíceps en máquina con espalda apoyada.', []),
  '1615': E('1615', 'lever hammer grip preacher curl', 'leverage machine', 'biceps', 'upper arms', 'OAguZoG',
    'Predicador en máquina con agarre neutro (palmas enfrentadas). Flexiona a los hombros sin mover el brazo. Ideal para braquial y antebrazo.',
    ['Agarre neutro con palmas enfrentadas.', 'Flexiona a los hombros sin mover el brazo.', 'Pausa arriba y baja lento.']),
  '0070': E('0070', 'barbell preacher curl', 'barbell', 'biceps', 'upper arms', 'qOgPVf6', 'Predicador con barra, variante libre del banco predicador.', []),
  '0201': E('0201', 'cable pushdown', 'cable', 'triceps', 'upper arms', '3ZflifB',
    'De pie ante la polea alta, codos pegados al torso. Empuja la barra abajo hasta extender, aprieta abajo y sube lento.',
    ['Codos pegados al torso, torso quieto.', 'Empuja abajo hasta extender.', 'Aprieta abajo y sube lento.']),
  '0241': E('0241', 'cable triceps pushdown (v-bar)', 'cable', 'triceps', 'upper arms', 'gAwDzB3', 'Pushdown con agarre en V para la cabeza lateral del tríceps.', []),
  // ——— Variantes con mancuerna: solo donde trabajan la misma zona ———
  '0314': E('0314', 'dumbbell incline bench press', 'dumbbell', 'pectorals', 'chest', 'ns0SIbU', 'Press inclinado con mancuernas: más recorrido y trabajo unilateral de cada lado del pecho.',
    ['Banco inclinado con una mancuerna en cada mano.', 'Baja hasta que los codos queden a 90 grados.', 'Empuja arriba sin chocar las mancuernas.']),
  '0289': E('0289', 'dumbbell bench press', 'dumbbell', 'pectorals', 'chest', 'SpYC0Kp', 'Press plano con mancuernas en banco: mayor estiramiento del pecho.',
    ['Acuéstate con las mancuernas al pecho.', 'Empuja arriba sin bloquear los codos.', 'Baja lento hasta sentir el estiramiento.']),
  '0308': E('0308', 'dumbbell fly', 'dumbbell', 'pectorals', 'chest', 'yz9nUhF', 'Apertura con mancuernas en banco plano para aislar el pecho.',
    ['Brazos abiertos con ligera flexión de codo.', 'Junta las mancuernas sobre el pecho contrayendo.', 'Abre lento sin perder la tensión.']),
  '0293': E('0293', 'dumbbell bent over row', 'dumbbell', 'upper back', 'back', 'BJ0Hz5L', 'Remo inclinado con mancuernas para el grosor de la espalda.',
    ['Torso inclinado a 45° con la espalda recta.', 'Tira de ambas mancuernas hacia el abdomen.', 'Aprieta los omóplatos y baja lento.']),
  '0292': E('0292', 'dumbbell one arm bent-over row', 'dumbbell', 'upper back', 'back', 'C0MA9bC', 'Remo a una mano con mancuerna para el dorsal, lado por lado.',
    ['Una rodilla y una mano en el banco, espalda plana.', 'Tira la mancuerna al costado del abdomen.', 'Baja con el brazo extendido y repite.']),
  '0405': E('0405', 'dumbbell seated shoulder press', 'dumbbell', 'delts', 'shoulders', 'znQUdHY', 'Press de hombro sentado con mancuernas y espalda apoyada.',
    ['Sentado con respaldo, mancuernas a los hombros.', 'Empuja arriba sin bloquear los codos.', 'Baja lento a la altura de los hombros.']),
  '0334': E('0334', 'dumbbell lateral raise', 'dumbbell', 'delts', 'shoulders', 'DsgkuIt', 'Elevación lateral con mancuernas para el ancho del hombro.',
    ['De pie, brazos a los costados semiflexionados.', 'Eleva lateral hasta la paralela al suelo.', 'Baja lento sin balancearte.']),
  '0351': E('0351', 'dumbbell lying triceps extension', 'dumbbell', 'triceps', 'upper arms', 'mpKZGWz', 'Extensión de tríceps tumbado con mancuernas, variante libre del skull crusher.',
    ['Tumbado con brazos extendidos sobre el pecho.', 'Flexiona solo los codos bajando a la frente.', 'Extiende de vuelta sin mover el hombro.']),
  '0372': E('0372', 'dumbbell preacher curl', 'dumbbell', 'biceps', 'upper arms', 'jivWf8n', 'Curl predicador con mancuernas en el banco para aislar el bíceps.',
    ['Brazos en el banco, agarre supino.', 'Flexiona hacia los hombros.', 'Baja lento sin extender del todo.']),
  '0313': E('0313', 'dumbbell hammer curl', 'dumbbell', 'biceps', 'upper arms', 'slDvUAU', 'Curl martillo con mancuernas y agarre neutro para braquial y antebrazo.',
    ['De pie con palmas enfrentadas al torso.', 'Flexiona sin despegar los codos.', 'Baja lento controlando el peso.']),
  '0333': E('0333', 'dumbbell kickback', 'dumbbell', 'triceps', 'upper arms', 'W6PxUkg', 'Patada de tríceps con mancuerna para la cabeza larga del tríceps.',
    ['Torso inclinado con el codo fijo atrás.', 'Extiende atrás apretando el tríceps.', 'Vuelve lento sin mover el hombro.']),
  '1760': E('1760', 'dumbbell goblet squat', 'dumbbell', 'quads', 'upper legs', 'yn8yg1r', 'Sentadilla goblet con mancuerna al pecho como empuje de pierna libre.',
    ['Mancuerna al pecho, pies al ancho de hombros.', 'Baja hasta muslos casi paralelos.', 'Empuja con los talones y sube.']),
}

// Por ejercicio del plan: variante principal + carrusel de alternativas.
// TODAS las alternativas comparten bodyPart con la principal (misma zona).
const BUNDLES = {
  'Press inclinado': { primary: '0314', variants: ['0314', '1299', '1479', '0577', '1300'] },
  'Remo en T': { primary: '0293', variants: ['0293', '1349', '1351', '1348', '1350', '0588', '0571'] },
  'Press plano': { primary: '0289', variants: ['0289', '0577', '0576', '1299', '1300', '0596'] },
  'Jalón a pecho': { primary: '0579', variants: ['0579', '0673', '2736', '1347'] },
  'Pec Fly': { primary: '0308', variants: ['0308', '0596', '0577', '1299', '1300'] },
  'Jalón unilateral dorsal': { primary: '0292', variants: ['0292', '1347', '0579', '0673', '2736'] },
  'Prensa de piernas': { primary: '1760', variants: ['1760', '0739', '1464', '1463'] },
  'Extensión de cuádriceps': { primary: '0585', variants: ['0585', '0739'] },
  'Máquina de aductores': { primary: '0598', variants: ['0598', '0597', '0585', '0599'] },
  'Máquina de abductores': { primary: '0597', variants: ['0597', '0598', '0585', '0739'] },
  'Biserie de pantorrillas': { primary: '0605', pair: '0594', variants: ['0605', '0594', '2289', '1385'] },
  'Press militar': { primary: '0405', variants: ['0405', '0587', '0603', '0869', '2318', '0590'] },
  'Elevaciones laterales': { primary: '0334', variants: ['0334', '0584', '0602', '0601', '0603'] },
  'Skull crushers': { primary: '0351', variants: ['0351', '0060', '0607', '1451'] },
  'Curl predicador': { primary: '0372', variants: ['0372', '0592', '1614', '0575', '0070'] },
  'Tríceps en polea': { primary: '0333', variants: ['0333', '0201', '0241', '0607', '1451'] },
  'Curl martillo': { primary: '0313', variants: ['0313', '1615', '0575', '0592'] },
  'Curl de bíceps en máquina': { primary: '0575', variants: ['0575', '0592', '1614', '1615', '0372', '0070'] },
  'Curl de isquiosurales sentado': { primary: '0599', variants: ['0599', '0586', '0582'] },
  'Patada de glúteo': { primary: '2286', variants: ['2286', '0593', '0578', '0228', '0739'] },
}

const bundleCache = new Map()

/** URLs candidatas por entrada: raw.githubusercontent ↔ jsDelivr (sin depender de una sola variante). */
export function getMediaCandidates(entry) {
  if (!entry || !entry.gif) return { gifs: [], images: [] }
  return {
    gifs: MEDIA_BASES.map((b) => `${b}/${entry.gif}`),
    images: MEDIA_BASES.map((b) => `${b}/${entry.image}`),
    attribution: ATTRIBUTION,
  }
}

export function getRepoVideoUrl(entry) {
  if (!entry?.gif) return DATASET_REPO
  return `${DATASET_REPO}/blob/main/${entry.gif}`
}

/** Devuelve { primary, pair, items } con objetos ya resueltos. items[0] === primary. */
export function getExerciseBundle(spanishName) {
  if (bundleCache.has(spanishName)) return bundleCache.get(spanishName)
  const def = BUNDLES[spanishName]
  if (!def) return null
  const bundle = {
    primary: MEDIA[def.primary] ?? null,
    pair: def.pair ? (MEDIA[def.pair] ?? null) : null,
    items: def.variants.map((id) => MEDIA[id]).filter(Boolean),
  }
  bundleCache.set(spanishName, bundle)
  return bundle
}

export const EXERCISE_SOURCES = { MEDIA_BASES, DATASET_REPO }
