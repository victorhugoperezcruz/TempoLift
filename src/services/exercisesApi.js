/**
 * Catálogo Planet Fitness sobre el dataset https://github.com/hasaneyldrm/exercises-dataset
 *
 * PRINCIPIO ANTI-CONFUSIÓN (principiantes): cada nombre en español = UN solo
 * movimiento + UN solo implemento. Nada de mezclar en el mismo carrusel
 * ejercicios distintos aunque trabajen el mismo músculo.
 *
 * Ejemplos de lo que NO se hace más:
 * - "Remo en T" ya no mezcla remo con mancuerna + remo en T en máquina +
 *   remo sentado en máquina. Ahora son: "Remo inclinado con mancuernas",
 *   "Remo en T en máquina", "Remo sentado en máquina", etc.
 * - "Skull crushers" ya NO incluye extensión en máquina ni fondos en máquina.
 *   Ahora son: "Skull crusher con mancuernas", "Skull crusher con barra",
 *   "Extensión de tríceps en máquina" y "Fondos en máquina" por separado.
 * - "Tríceps en polea" ya no tiene como principal un kickback con mancuerna.
 *   Ahora: "Patada de tríceps con mancuerna" vs "Tríceps en polea alta" vs
 *   "Tríceps en polea con V" por separado.
 * - "Prensa de piernas" ya no tiene como principal una goblet con mancuerna.
 *   Ahora: "Sentadilla goblet con mancuerna" vs "Prensa de piernas en máquina".
 *
 * Solo se agrupan en el mismo bundle las vistas del MISMO ejercicio y MISMA
 * máquina (distinto POV o v.2/v.3 del dataset): p. ej. prensa 45° (3 POVs),
 * press inclinado en máquina (2 vistas), press de hombro en máquina (3 rec.).
 * En esos casos el carrusel dice "Mismo ejercicio · otro ángulo", no
 * "variantes". Si el bundle tiene 1 solo ítem, el carrusel ni aparece.
 *
 * Rendimiento: catálogo curado y ligero con los IDs exactos del dataset.
 * Cero fetch en la ruta crítica: solo se cargan bajo demanda las
 * imágenes/GIF que el usuario despliega.
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
    'Press inclinado en máquina, segunda vista: mismo empuje al frente con respaldo inclinado, espalda bien apoyada.',
    ['Ajusta el respaldo inclinado y siéntate con la espalda apoyada.', 'Agarre prono un poco más abierto que los hombros.', 'Empuja al frente hasta extender y vuelve lento.']),
  '0577': E('0577', 'lever chest press', 'leverage machine', 'pectorals', 'chest', 'T0yTjgW',
    'Ajusta la altura del asiento, espalda totalmente apoyada. Agarre prono, codos a 90°. Empuja al frente hasta extender, exhalando. Pausa breve y vuelve lento.',
    ['Ajusta la altura del asiento con la espalda apoyada.', 'Agarre prono con codos a 90 grados.', 'Empuja al frente hasta extender y vuelve lento.']),
  '0576': E('0576', 'lever chest press', 'leverage machine', 'pectorals', 'chest', 'DOoWcnA',
    'Press horizontal en máquina: misma técnica que el chest press, variante de agarre. Espalda apoyada y empuje al frente controlado.',
    ['Siéntate con la espalda totalmente apoyada.', 'Toma el agarre alternativo con codos a 90 grados.', 'Empuja al frente hasta extender y vuelve lento.']),
  '1300': E('1300', 'lever decline chest press', 'leverage machine', 'pectorals', 'chest', 'vsVoPHt',
    'Press declinado en máquina: énfasis en la parte baja del pecho. Espalda apoyada, empuje al frente y abajo.',
    ['Ajusta el asiento en posición declinada.', 'Agarre prono con la espalda apoyada.', 'Empuja al frente hasta extender y vuelve lento.']),
  '0596': E('0596', 'lever seated fly', 'leverage machine', 'pectorals', 'chest', 'v3xmPAR',
    'Espalda apoyada, agarre pronado y codos semiflexionados. Junta las asas frente al pecho contrayendo, pausa y abre lento.',
    ['Espalda apoyada y codos ligeramente flexionados.', 'Junta las asas frente al pecho contrayendo.', 'Vuelve lento a la apertura inicial.']),
  '1349': E('1349', 'lever reverse t-bar row', 'leverage machine', 'upper back', 'back', 'BgljGjd',
    'Pecho contra la almohadilla, pies en la plataforma. Agarre prono algo más abierto que los hombros. Tira hacia el pecho juntando omóplatos, pausa y suelta lento.',
    ['Pecho contra la almohadilla y pies en la plataforma.', 'Agarre prono algo más abierto que los hombros.', 'Tira al pecho juntando omóplatos y suelta lento.']),
  '1351': E('1351', 'lever t-bar reverse grip row', 'leverage machine', 'upper back', 'back', 'FVM1AUZ',
    'Remo en T en máquina con agarre invertido (supino): más énfasis en dorsales bajos. Pecho apoyado, tira al abdomen.',
    ['Pecho contra la almohadilla, pies firmes.', 'Agarre invertido a lo ancho de los hombros.', 'Tira al abdomen juntando omóplatos y suelta lento.']),
  '1348': E('1348', 'lever reverse grip vertical row', 'leverage machine', 'upper back', 'back', 'ZqNOWQ6',
    'Remo vertical en máquina con agarre supino: tira de arriba hacia el pecho liderando con los codos.',
    ['Ajusta el asiento y toma el agarre supino.', 'Pecho alto con ligera curva lumbar.', 'Tira hacia el pecho liderando con los codos.']),
  '1350': E('1350', 'lever seated row', 'leverage machine', 'upper back', 'back', '7I6LNUG',
    'Remo sentado en máquina con pecho apoyado y agarre prono: tira al abdomen juntando omóplatos.',
    ['Siéntate con el pecho contra el soporte.', 'Agarre prono a lo ancho de los hombros.', 'Tira al abdomen y devuelve lento.']),
  '0588': E('0588', 'lever narrow grip seated row', 'leverage machine', 'upper back', 'back', 'IGjKj1v',
    'Remo sentado en máquina con agarre estrecho neutro: tira al abdomen para grosor de espalda.',
    ['Siéntate erguido con el pecho apoyado.', 'Toma el agarre estrecho neutro.', 'Tira al abdomen apretando omóplatos y suelta lento.']),
  '0571': E('0571', 'lever alternating narrow grip seated row', 'leverage machine', 'upper back', 'back', 'w2oRpuH',
    'Remo alterno en máquina, un brazo a la vez con agarre estrecho: corrige descompensaciones lado a lado.',
    ['Siéntate con el pecho apoyado.', 'Tira con un brazo al abdomen.', 'Alterna lados con el mismo recorrido.']),
  '0579': E('0579', 'lever front pulldown', 'leverage machine', 'lats', 'back', '7F1DVzn',
    'Rodillas bajo las almohadillas, pies planos. Agarre prono algo más abierto que los hombros. Pecho alto y ligera curva lumbar. Tira hacia el pecho liderando con los codos.',
    ['Rodillas bajo las almohadillas y pies planos.', 'Agarre prono algo más abierto que los hombros.', 'Tira hacia el pecho liderando con los codos.']),
  '0673': E('0673', 'reverse grip machine lat pulldown', 'leverage machine', 'lats', 'back', 'ecpY0rH',
    'Jalón en máquina con agarre supino (palmas hacia ti): más trabajo de dorsal bajo y bíceps. Tira al pecho sin balancearte.',
    ['Rodillas fijas bajo las almohadillas.', 'Agarre supino a lo ancho de los hombros.', 'Tira al pecho liderando con los codos.']),
  '2736': E('2736', 'lever reverse grip lateral pulldown', 'leverage machine', 'lats', 'back', 'ky8FLU8',
    'Jalón lateral en máquina con agarre invertido: misma técnica supina, tira al pecho controlado.',
    ['Fija las rodillas y toma el agarre invertido.', 'Pecho alto sin arquear de más.', 'Tira al pecho y sube lento.']),
  '1347': E('1347', 'lever one arm lateral wide pulldown', 'leverage machine', 'lats', 'back', 'tTuZSDT',
    'Pecho contra la almohadilla. Un brazo extendido con ligera flexión de codo. Tira hacia abajo y cruzando hacia la cadera opuesta, apretando el dorsal.',
    ['Pecho contra la almohadilla, brazo extendido.', 'Tira hacia abajo cruzando a la cadera opuesta.', 'Aprieta el dorsal abajo y devuelve lento.']),
  '0739': E('0739', 'sled 45° leg press', 'sled machine', 'glutes', 'upper legs', '10Z2DXU',
    'Espalda contra el respaldo, pies a la altura de los hombros en la placa. Sujeta las asas laterales. Empuja extendiendo sin bloquear rodillas, talones siempre apoyados.',
    ['Espalda contra el respaldo y pies en la placa.', 'Sujeta las asas laterales para estabilizarte.', 'Empuja sin bloquear rodillas y baja controlado.']),
  '1464': E('1464', 'sled 45° leg press (back pov)', 'sled machine', 'glutes', 'upper legs', 'yn2lLSI',
    'Prensa a 45° en máquina (vista trasera): misma técnica, pies firmes y rodillas alineadas con los pies.',
    ['Espalda pegada al respaldo.', 'Pies a lo ancho de los hombros en la placa.', 'Empuja sin bloquear y baja controlado.']),
  '1463': E('1463', 'sled 45° leg press (side pov)', 'sled machine', 'glutes', 'upper legs', '2Qh2J1e',
    'Prensa a 45° en máquina (vista lateral): controla la profundidad sin despegar la espalda baja del respaldo.',
    ['Espalda y cadera bien apoyadas.', 'Baja hasta muslos casi paralelos sin despegar la espalda.', 'Empuja con talones y sube.']),
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
  '0582': E('0582', 'lever kneeling leg curl', 'leverage machine', 'hamstrings', 'upper legs', 'nnmCTLN',
    'Curl de isquios arrodillado en máquina: apoya el torso, talón hacia el glúteo apretando el isquio.',
    ['Arrodíllate con el torso apoyado.', 'Flexiona el talón hacia el glúteo.', 'Pausa arriba y baja lento.']),
  '0586': E('0586', 'lever lying leg curl', 'leverage machine', 'hamstrings', 'upper legs', '17lJ1kr',
    'Curl de isquios tumbado boca abajo en máquina: talones hacia los glúteos sin despegar la cadera.',
    ['Túmbate con la cadera pegada al banco.', 'Flexiona talones hacia los glúteos.', 'Pausa y baja lento sin tirón.']),
  '2286': E('2286', 'lever hip extension v. 2', 'leverage machine', 'glutes', 'upper legs', 'OPqShYN',
    'Ajusta la máquina, espalda apoyada y pies en los apoyos. Activa glúteos e isquios y extiende la cadera empujando atrás. Pausa arriba y baja lento.',
    ['Espalda apoyada y pies en los apoyos.', 'Extiende la cadera empujando atrás.', 'Pausa arriba y baja lento.']),
  '0593': E('0593', 'lever reverse hyperextension', 'leverage machine', 'glutes', 'upper legs', 'Krmb3cB',
    'Hiperextensión inversa en máquina: torso apoyado, eleva las piernas extendidas apretando glúteo e isquio.',
    ['Torso bien apoyado en la máquina.', 'Eleva las piernas extendidas.', 'Pausa arriba y baja lento.']),
  '0578': E('0578', 'lever deadlift', 'leverage machine', 'glutes', 'upper legs', 'GUT8I22',
    'Peso muerto en máquina de palanca: cadera atrás, espalda recta y empuje con talones para la cadena posterior.',
    ['Pies firmes y espalda recta.', 'Bisagra de cadera llevando la carga abajo.', 'Empuja con talones y extiende la cadera.']),
  '0228': E('0228', 'cable standing hip extension', 'cable', 'glutes', 'upper legs', 'Kpajagk',
    'Tobillera en polea baja, de espaldas a la máquina. Extiende la pierna atrás apretando el glúteo arriba. Pausa y vuelve lento, una pierna a la vez.',
    ['Tobillera en polea baja, de espaldas.', 'Extiende atrás apretando el glúteo.', 'Pausa arriba y vuelve lento.']),
  '0605': E('0605', 'lever standing calf raise', 'leverage machine', 'calves', 'lower legs', 'ykUOVze',
    'De pie, hombros bajo las almohadillas. Eleva los talones al máximo extendiendo tobillos. Pausa arriba y baja lento.',
    ['Hombros bajo las almohadillas.', 'Eleva los talones al máximo.', 'Pausa arriba y baja lento.']),
  '0594': E('0594', 'lever seated calf raise', 'leverage machine', 'calves', 'lower legs', 'bOOdeyc',
    'Sentado con los metatarsos en la placa y talones fuera del borde. Empuja con la parte delantera del pie, sube al máximo y baja lento.',
    ['Metatarsos en la placa, talones fuera.', 'Empuja elevando los talones al máximo.', 'Baja lento a la posición inicial.']),
  '2289': E('2289', 'lever calf press', 'leverage machine', 'calves', 'lower legs', '7B4F5nZ',
    'Prensa de pantorrilla en máquina: solo la punta del pie en la placa, empuja extendiendo el tobillo.',
    ['Solo la punta del pie en la placa.', 'Empuja extendiendo el tobillo al máximo.', 'Pausa arriba y baja lento.']),
  '1385': E('1385', 'lever seated squat calf raise on leg press machine', 'leverage machine', 'calves', 'lower legs', 'IeDEXTe',
    'Pantorrilla en la prensa de piernas: rodillas casi extendidas, empuja solo con la punta del pie.',
    ['Puntas de los pies en la placa.', 'Rodillas casi extendidas sin bloquear.', 'Empuja con la punta y baja lento.']),
  '0587': E('0587', 'lever military press', 'leverage machine', 'delts', 'shoulders', 'CggQhII',
    'Espalda apoyada, agarre prono algo más abierto que los hombros. Empuja arriba sin bloquear codos. Pausa y baja lento.',
    ['Espalda apoyada y agarre prono.', 'Empuja arriba sin bloquear codos.', 'Pausa y baja lento.']),
  '0603': E('0603', 'lever shoulder press', 'leverage machine', 'delts', 'shoulders', '67n3r98',
    'Press de hombro en máquina: espalda apoyada, agarre prono a la altura de los hombros, empuje vertical.',
    ['Espalda apoyada en el respaldo.', 'Agarre prono a la altura de los hombros.', 'Empuja arriba y baja lento.']),
  '0869': E('0869', 'lever shoulder press v. 2', 'leverage machine', 'delts', 'shoulders', 'vqsbmL0',
    'Press de hombro en máquina (recorrido 2): mismo empuje vertical con la espalda bien apoyada.',
    ['Ajusta el asiento a tu altura.', 'Empuja arriba sin bloquear codos.', 'Baja lento a los hombros.']),
  '2318': E('2318', 'lever shoulder press v. 3', 'leverage machine', 'delts', 'shoulders', 'dNFYIU1',
    'Press de hombro en máquina (recorrido 3): variante de agarre del press vertical, mismo control.',
    ['Espalda apoyada y torso erguido.', 'Empuja arriba de forma vertical.', 'Pausa y baja lento.']),
  '0590': E('0590', 'lever one arm shoulder press', 'leverage machine', 'delts', 'shoulders', '2KGnL6M',
    'Press de hombro a una mano en máquina: corrige descompensaciones trabajando lado por lado.',
    ['Siéntate erguido con la espalda apoyada.', 'Empuja con un brazo a la vez.', 'Baja lento y cambia de lado.']),
  '0584': E('0584', 'lever lateral raise', 'leverage machine', 'delts', 'shoulders', 'dRTfGZT',
    'Espalda contra la almohadilla, agarre prono y brazos rectos. Eleva lateral hasta la paralela al suelo. Pausa y baja lento.',
    ['Espalda contra la almohadilla, brazos rectos.', 'Eleva lateral hasta la paralela.', 'Pausa y baja lento.']),
  '0602': E('0602', 'lever seated reverse fly', 'leverage machine', 'delts', 'shoulders', 'myfUsKf',
    'Apertura posterior sentada en máquina: brazos casi rectos, abre hacia atrás apretando deltoide posterior.',
    ['Pecho contra el soporte, brazos al frente.', 'Abre hacia atrás con codos semiflexionados.', 'Pausa y vuelve lento.']),
  '0601': E('0601', 'lever seated reverse fly (parallel grip)', 'leverage machine', 'delts', 'shoulders', 'xiHiJcA',
    'Apertura posterior en máquina con agarre neutro (paralelo): mismo movimiento para deltoide posterior.',
    ['Pecho apoyado y agarre neutro.', 'Abre hacia atrás apretando atrás.', 'Vuelve lento sin perder tensión.']),
  '0060': E('0060', 'barbell lying triceps extension skull crusher', 'barbell', 'triceps', 'upper arms', 'h8LFzo9',
    'En banco, brazos extendidos sobre el pecho. Solo flexiona los codos bajando la barra a la frente. Pausa y extiende sin mover el hombro.',
    ['Brazos extendidos sobre el pecho.', 'Baja a la frente solo flexionando codos.', 'Extiende de vuelta sin mover el hombro.']),
  '0607': E('0607', 'lever triceps extension', 'leverage machine', 'triceps', 'upper arms', 'Ser9eQp',
    'Extensión de tríceps en máquina: espalda apoyada, codos fijos, extiende hasta apretar el tríceps.',
    ['Siéntate con la espalda apoyada.', 'Codos fijos pegados al cuerpo.', 'Extiende apretando abajo y sube lento.']),
  '1451': E('1451', 'lever seated dip', 'leverage machine', 'triceps', 'upper arms', 'BRImeP8',
    'Fondos sentados en máquina: empuja hacia abajo extendiendo los codos, torso erguido.',
    ['Siéntate erguido con los agarres a los lados.', 'Empuja abajo hasta extender.', 'Sube lento sin encoger hombros.']),
  '0592': E('0592', 'lever preacher curl', 'leverage machine', 'biceps', 'upper arms', 'b6hQYMb',
    'Brazos sobre la almohadilla, agarre supino. Flexiona hacia los hombros sin despegar los codos. Pausa contrayendo y baja lento.',
    ['Brazos sobre la almohadilla, agarre supino.', 'Flexiona hacia los hombros.', 'Pausa contrayendo y baja lento.']),
  '1614': E('1614', 'lever preacher curl v. 2', 'leverage machine', 'biceps', 'upper arms', 'ye84CTU',
    'Curl predicador en máquina (vista 2): pecho contra el soporte, flexión a los hombros sin mover el brazo.',
    ['Pecho contra el soporte.', 'Agarre supino y codos apoyados.', 'Flexiona a los hombros y baja lento.']),
  '0575': E('0575', 'lever bicep curl', 'leverage machine', 'biceps', 'upper arms', 'q6y3OhV', 'Curl de bíceps en máquina con espalda apoyada.',
    ['Espalda apoyada en el respaldo de la máquina.', 'Agarre supino a la altura de los hombros.', 'Flexiona contrayendo el bíceps y baja lento.']),
  '1615': E('1615', 'lever hammer grip preacher curl', 'leverage machine', 'biceps', 'upper arms', 'OAguZoG',
    'Predicador en máquina con agarre neutro (palmas enfrentadas). Flexiona a los hombros sin mover el brazo. Ideal para braquial y antebrazo.',
    ['Agarre neutro con palmas enfrentadas.', 'Flexiona a los hombros sin mover el brazo.', 'Pausa arriba y baja lento.']),
  '0070': E('0070', 'barbell preacher curl', 'barbell', 'biceps', 'upper arms', 'qOgPVf6',
    'Curl predicador con barra: brazos en el banco, flexiona a los hombros sin despegar los codos.',
    ['Brazos apoyados en el banco predicador.', 'Agarre supino con barra.', 'Flexiona a los hombros y baja lento.']),
  '0201': E('0201', 'cable pushdown', 'cable', 'triceps', 'upper arms', '3ZflifB',
    'De pie ante la polea alta, codos pegados al torso. Empuja la barra abajo hasta extender, aprieta abajo y sube lento.',
    ['Codos pegados al torso, torso quieto.', 'Empuja abajo hasta extender.', 'Aprieta abajo y sube lento.']),
  '0241': E('0241', 'cable triceps pushdown (v-bar)', 'cable', 'triceps', 'upper arms', 'gAwDzB3',
    'Pushdown en polea con agarre en V: codos fijos al torso, empuje abajo para la cabeza lateral del tríceps.',
    ['Toma el agarre en V con codos pegados.', 'Empuja abajo hasta extender.', 'Aprieta abajo y sube lento.']),
  // ——— Variantes con mancuerna: cada una es SU propio ejercicio ———
  '0314': E('0314', 'dumbbell incline bench press', 'dumbbell', 'pectorals', 'chest', 'ns0SIbU', 'Press inclinado con mancuernas: más recorrido y trabajo unilateral de cada lado del pecho.',
    ['Banco inclinado con una mancuerna en cada mano.', 'Baja hasta que los codos queden a 90 grados.', 'Empuja arriba sin chocar las mancuernas.']),
  '0289': E('0289', 'dumbbell bench press', 'dumbbell', 'pectorals', 'chest', 'SpYC0Kp', 'Press plano con mancuernas en banco: mayor estiramiento del pecho.',
    ['Acuéstate con las mancuernas al pecho.', 'Empuja arriba sin bloquear los codos.', 'Baja lento hasta sentir el estiramiento.']),
  '0308': E('0308', 'dumbbell fly', 'dumbbell', 'pectorals', 'chest', 'yz9nUhF', 'Aperturas con mancuernas en banco plano para aislar el pecho.',
    ['Brazos abiertos con ligera flexión de codo.', 'Junta las mancuernas sobre el pecho contrayendo.', 'Abre lento sin perder la tensión.']),
  '0293': E('0293', 'dumbbell bent over row', 'dumbbell', 'upper back', 'back', 'BJ0Hz5L', 'Remo inclinado con mancuernas para el grosor de la espalda.',
    ['Torso inclinado a 45° con la espalda recta.', 'Tira de ambas mancuernas hacia el abdomen.', 'Aprieta los omóplatos y baja lento.']),
  '0292': E('0292', 'dumbbell one arm bent-over row', 'dumbbell', 'upper back', 'back', 'C0MA9bC', 'Remo a una mano con mancuerna para el dorsal, lado por lado.',
    ['Una rodilla y una mano en el banco, espalda plana.', 'Tira la mancuerna al costado del abdomen.', 'Baja con el brazo extendido y repite.']),
  '0405': E('0405', 'dumbbell seated shoulder press', 'dumbbell', 'delts', 'shoulders', 'znQUdHY', 'Press militar sentado con mancuernas y espalda apoyada.',
    ['Sentado con respaldo, mancuernas a los hombros.', 'Empuja arriba sin bloquear los codos.', 'Baja lento a la altura de los hombros.']),
  '0334': E('0334', 'dumbbell lateral raise', 'dumbbell', 'delts', 'shoulders', 'DsgkuIt', 'Elevaciones laterales con mancuernas para el ancho del hombro.',
    ['De pie, brazos a los costados semiflexionados.', 'Eleva lateral hasta la paralela al suelo.', 'Baja lento sin balancearte.']),
  '0351': E('0351', 'dumbbell lying triceps extension', 'dumbbell', 'triceps', 'upper arms', 'mpKZGWz', 'Skull crusher con mancuernas tumbado: baja a la frente solo con los codos.',
    ['Tumbado con brazos extendidos sobre el pecho.', 'Flexiona solo los codos bajando a la frente.', 'Extiende de vuelta sin mover el hombro.']),
  '0372': E('0372', 'dumbbell preacher curl', 'dumbbell', 'biceps', 'upper arms', 'jivWf8n', 'Curl predicador con mancuernas en el banco para aislar el bíceps.',
    ['Brazos en el banco, agarre supino.', 'Flexiona hacia los hombros.', 'Baja lento sin extender del todo.']),
  '0313': E('0313', 'dumbbell hammer curl', 'dumbbell', 'biceps', 'upper arms', 'slDvUAU', 'Curl martillo con mancuernas y agarre neutro para braquial y antebrazo.',
    ['De pie con palmas enfrentadas al torso.', 'Flexiona sin despegar los codos.', 'Baja lento controlando el peso.']),
  '0333': E('0333', 'dumbbell kickback', 'dumbbell', 'triceps', 'upper arms', 'W6PxUkg', 'Patada de tríceps con mancuerna para la cabeza larga del tríceps.',
    ['Torso inclinado con el codo fijo atrás.', 'Extiende atrás apretando el tríceps.', 'Vuelve lento sin mover el hombro.']),
  '1760': E('1760', 'dumbbell goblet squat', 'dumbbell', 'quads', 'upper legs', 'yn8yg1r', 'Sentadilla goblet con mancuerna al pecho: empuje de pierna libre.',
    ['Mancuerna al pecho, pies al ancho de hombros.', 'Baja hasta muslos casi paralelos.', 'Empuja con los talones y sube.']),
}

// Cada nombre en español = UN movimiento + UN implemento. El carrusel solo
// muestra el MISMO ejercicio desde otro ángulo (mismo equipo, mismo gesto).
// Si solo hay 1 ítem, el carrusel se oculta (ExerciseItem returns null).
const BUNDLES = {
  // Pecho: mancuernas vs máquina, separados
  'Press inclinado con mancuernas': { primary: '0314', variants: ['0314'] },
  'Press inclinado en máquina': { primary: '1299', variants: ['1299', '1479'] },
  'Press plano con mancuernas': { primary: '0289', variants: ['0289'] },
  'Press plano en máquina': { primary: '0577', variants: ['0577', '0576'] },
  'Press declinado en máquina': { primary: '1300', variants: ['1300'] },
  'Aperturas con mancuernas': { primary: '0308', variants: ['0308'] },
  'Pec Fly en máquina': { primary: '0596', variants: ['0596'] },
  // Espalda: cada remo/jalón por separado, con equipo explícito
  'Remo inclinado con mancuernas': { primary: '0293', variants: ['0293'] },
  'Remo a una mano con mancuerna': { primary: '0292', variants: ['0292'] },
  'Remo en T en máquina': { primary: '1349', variants: ['1349'] },
  'Remo en T agarre invertido en máquina': { primary: '1351', variants: ['1351'] },
  'Remo vertical agarre invertido en máquina': { primary: '1348', variants: ['1348'] },
  'Remo sentado en máquina': { primary: '1350', variants: ['1350'] },
  'Remo sentado agarre estrecho en máquina': { primary: '0588', variants: ['0588'] },
  'Remo alterno en máquina': { primary: '0571', variants: ['0571'] },
  'Jalón al pecho en máquina': { primary: '0579', variants: ['0579'] },
  'Jalón agarre invertido en máquina': { primary: '0673', variants: ['0673', '2736'] },
  'Jalón unilateral en máquina': { primary: '1347', variants: ['1347'] },
  // Pierna / glúteo: goblet separado de prensa; cada curl y cada pantorrilla aparte
  'Sentadilla goblet con mancuerna': { primary: '1760', variants: ['1760'] },
  'Prensa de piernas en máquina': { primary: '0739', variants: ['0739', '1464', '1463'] },
  'Extensión de cuádriceps en máquina': { primary: '0585', variants: ['0585'] },
  'Aductores en máquina': { primary: '0598', variants: ['0598'] },
  'Abductores en máquina': { primary: '0597', variants: ['0597'] },
  'Curl de isquios sentado en máquina': { primary: '0599', variants: ['0599'] },
  'Curl de isquios tumbado en máquina': { primary: '0586', variants: ['0586'] },
  'Curl de isquios arrodillado en máquina': { primary: '0582', variants: ['0582'] },
  'Patada de glúteo en máquina': { primary: '2286', variants: ['2286'] },
  'Hiperextensión inversa en máquina': { primary: '0593', variants: ['0593'] },
  'Peso muerto en máquina': { primary: '0578', variants: ['0578'] },
  'Patada de glúteo en polea': { primary: '0228', variants: ['0228'] },
  'Pantorrilla de pie en máquina': { primary: '0605', pair: '0594', variants: ['0605'] },
  'Pantorrilla sentado en máquina': { primary: '0594', variants: ['0594'] },
  'Prensa de pantorrilla en máquina': { primary: '2289', variants: ['2289'] },
  'Pantorrilla en prensa de piernas': { primary: '1385', variants: ['1385'] },
  // Hombro: mancuerna vs máquina, cada máquina por separado
  'Press militar con mancuernas': { primary: '0405', variants: ['0405'] },
  'Press militar en máquina': { primary: '0587', variants: ['0587'] },
  'Press de hombro en máquina': { primary: '0603', variants: ['0603', '0869', '2318'] },
  'Press de hombro a una mano en máquina': { primary: '0590', variants: ['0590'] },
  'Elevaciones laterales con mancuernas': { primary: '0334', variants: ['0334'] },
  'Elevación lateral en máquina': { primary: '0584', variants: ['0584'] },
  'Apertura posterior en máquina': { primary: '0602', variants: ['0602', '0601'] },
  // Brazo: skull solo con skull; máquina / fondos / polea aparte
  'Skull crusher con barra': { primary: '0060', variants: ['0060'] },
  'Skull crusher con mancuernas': { primary: '0351', variants: ['0351'] },
  'Extensión de tríceps en máquina': { primary: '0607', variants: ['0607'] },
  'Fondos en máquina': { primary: '1451', variants: ['1451'] },
  'Tríceps en polea alta': { primary: '0201', variants: ['0201'] },
  'Tríceps en polea con V': { primary: '0241', variants: ['0241'] },
  'Patada de tríceps con mancuerna': { primary: '0333', variants: ['0333'] },
  'Curl predicador con mancuernas': { primary: '0372', variants: ['0372'] },
  'Curl predicador con barra': { primary: '0070', variants: ['0070'] },
  'Curl predicador en máquina': { primary: '0592', variants: ['0592', '1614'] },
  'Curl de bíceps en máquina': { primary: '0575', variants: ['0575'] },
  'Curl martillo con mancuernas': { primary: '0313', variants: ['0313'] },
  'Curl martillo en máquina': { primary: '1615', variants: ['1615'] },
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

/** Todos los nombres del catálogo (para el buscador de extras y variedad). */
export function getCatalogExerciseNames() {
  return Object.keys(BUNDLES)
}

/** Meta de un ejercicio del catálogo: bundle + músculo + zona + equipo. null si no existe. */
export function getExerciseMeta(spanishName) {
  const bundle = getExerciseBundle(spanishName)
  if (!bundle?.primary) return null
  const { primary } = bundle
  return {
    name: spanishName,
    bundle,
    primary,
    target: primary.target ?? null,
    bodyPart: primary.bodyPart ?? null,
    equipment: primary.equipment ?? null,
  }
}

/**
 * Sustitutos para cambiar un ejercicio dentro de la rutina.
 * Orden: mismo músculo (target) primero, luego misma zona (bodyPart),
 * luego el resto del catálogo. Nunca incluye al propio ejercicio.
 */
export function getSubstitutes(spanishName) {
  const meta = getExerciseMeta(spanishName)
  const all = getCatalogExerciseNames().filter((n) => n !== spanishName)
  if (!meta) return { sameMuscle: [], sameZone: [], rest: all }
  const sameMuscle = []
  const sameZone = []
  const rest = []
  for (const n of all) {
    const m = getExerciseMeta(n)
    if (!m) { rest.push(n); continue }
    if (m.target && meta.target && m.target === meta.target) sameMuscle.push(n)
    else if (m.bodyPart && meta.bodyPart && m.bodyPart === meta.bodyPart) sameZone.push(n)
    else rest.push(n)
  }
  return { sameMuscle, sameZone, rest }
}

/** Miniatura (JPG) del ejercicio para listas y previews. null si no hay. */
export function getExerciseThumb(spanishName) {
  const meta = getExerciseMeta(spanishName)
  if (!meta?.primary?.image) return null
  return `${CDN}/${meta.primary.image}`
}

export const EXERCISE_SOURCES = { MEDIA_BASES, DATASET_REPO }
