"use client";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { getPlayerProfile, getPregLog } from "@/lib/db";
import { pullFromCloud } from "@/lib/cloudsync";
import { getLevelInfo } from "@/lib/profile";
import {
  getShopTitulos, getShopAvatares,
  getOwned, getEquippedAvatar, setEquippedAvatar,
  getEquippedTitulo, setEquippedTitulo,
  type TituloItem, type AvatarItem,
} from "@/lib/shop";
import { getMascotConfig } from "@/lib/mascot";
import {
  getTamaStats, saveTamaStats, computeVisualState, feedTama, playTama,
  cureIllness, getContextualMessage, ILLNESS_INFO, rollBadSleep,
  canSleepNow, startSleepTimer, wakeUpTama, cureAngry, rollAngry,
  wakeUpAngryNight, clearNightAngry,
  type TamaStats, type TamaVisualState, type IllnessType, type MessageContext,
} from "@/lib/tamagotchi";
import { syncCacaIllness, getRegistroContext, type RegistroContext } from "@/lib/registro-sync";
import {
  getDayClothing, getNightClothing,
  CLOTHING_CATALOG, getFoodInventory, FOOD_CATALOG, MEDICINE_CATALOG,
  getOwnedToys, TOY_CATALOG, isToyOnCooldown, recordToyUse, consumeFood,
  getEquippedToy, getSleepItemCount, tickSleepDurability,
  type EquippedClothing,
} from "@/lib/squirrel-shop";
import {
  getEvolutionData, tickDailyEvolution, recordTap, isNightTime,
  getEvolutionProgress, PHASE_INFO, type EvolutionPhase,
} from "@/lib/tama-evolution";
import { tryUnlock, type Achievement } from "@/lib/tama-achievements";
import ChibiArdilla from "@/components/ChibiArdilla";
import MisionesModal from "@/components/MisionesModal";
import TamaMiniGame from "@/components/TamaMiniGame";
import MemoryCardGame from "@/components/MemoryCardGame";
import SopaDeLetras from "@/components/SopaDeLetras";
import MayorMenorGame from "@/components/MayorMenorGame";
import AnimalRaceGame from "@/components/AnimalRaceGame";
import TresEnRayaGame  from "@/components/TresEnRayaGame";
import Conecta4Game    from "@/components/Conecta4Game";
import GameStatsModal  from "@/components/GameStatsModal";
import { unlockAudio, maybeRandomFart, maybeEructo, playFartRandom, playBurpRandom, playCositas } from "@/lib/sounds";

/* ── Frases de bienvenida del caracol ───────────────────────────── */
const WELCOME_PHRASES = [
  /* Caracol */
  "Los caracoles llevamos nuestra casa a cuestas. Tú llevas tu fuerza. Absolutamente imponente. 🐌",
  "Aunque voy despacio, siempre llego. Y tú también llegas, Vicky. Siempre. 🐌",
  "Mi concha = tu zona de confort. Pero hoy volviste. Bravísima. 🐌",
  "Los grandes éxitos se construyen despacio. Como yo. Como tú. Sigue así. 🐌",
  "No soy rápido pero soy constante. Igual que tú, Vicky. Orgulloso de ti. 🐌",
  "¡Hoy vuelves! Lo sabía. Los caracoles tenemos instinto para las personas especiales. 🐌",
  "Yo dejo un rastro de brillo donde paso. Tú también, aunque no lo veas. 🐌",
  "Caracol de honor: llevas más racha que yo subiendo una montaña. Impresionante. 🐌",
  "Hoy el caracol se quita la concha en señal de respeto. Eso es mucho, ¿sabes? 🐌",
  "Mi velocidad máxima + tu energía de hoy = una combinación imbatible. 🐌",
  "Soy el caracol más orgulloso del bosque en este momento. Y es por ti. 🐌",
  "El caracol dice: despacio pero sin parar. Eso eres tú todos los días. 🐌",
  "He recorrido todo el jardín para decirte esto: eres increíble, Vicky. 🐌",
  "Los caracoles vivimos mucho tiempo. Y yo voy a estar aquí animándote siempre. 🐌",
  "Concha nueva desbloqueada: la de los campeones. Hoy te la mereces tú. 🐌",
  /* Ardilla */
  "La ardilla sabe que has vuelto. Y ya está dando saltos de alegría. 🐿️",
  "Bellota a bellota se hace el árbol más grande. Tú ya eres un árbol enorme, Vicky. 🐿️",
  "La ardilla guardó esta bellota especial para cuando aparecieras hoy. Toma. 🌰",
  "Ardilla nivel: muy orgullosa de tenerte aquí. Nivel máximo desbloqueado. 🐿️",
  "No todas las ardillas tienen a alguien como tú. Ella sí. Qué suerte tan grande. 🐿️",
  "La ardilla ha estado esperándote subida a su árbol favorito. Ya puede bajar feliz. 🐿️",
  "El bosque entero sabe que hoy has venido. Se nota el buen ambiente. 🌳",
  "La ardilla colecciona bellotas. Tú coleccionas días de esfuerzo. Los tuyos valen más. 🐿️",
  "Ardilla confidencial: cada vez que apareces, ella mejora un poco más. Magia pura. 🐿️",
  "La ardilla dice que eres la mejor cuidadora del bosque. Y la ardilla no miente. 🐿️",
  /* Gato */
  "Miau. El gato del bosque dice que eres absolutamente espectacular. 🐱",
  "Los gatos duermen 16 horas y siguen siendo majestuosos. Tú con lo que duermas ya eres una reina. 🐱",
  "El gato te mira fijo. No es acoso. Es admiración pura y dura. 🐱",
  "Miau = 'hoy también lo vas a petar, Vicky' en idioma gato. Traducción garantizada. 🐱",
  "El gato del bosque ha dejado un ronroneo especial justo aquí para ti. Shhh, escúchalo. 🐱",
  "Los gatos solo muestran afecto a personas especiales. Hoy el gato ronronea. Ya sabes. 🐱",
  "El gato ha ignorado a todos hoy menos a ti. Eso en el mundo felino es un oscar. 🐱",
  "Miau miau miau = 'Vicky, estoy muy orgulloso de ti' en gato bosquero. 🐱",
  "El gato se ha enrollado en tus pies. No te muevas. Momento sagrado. 🐱",
  "Los gatos tienen 9 vidas. Tú tienes una y la estás aprovechando de lujo. 🐱",
  /* Mixtas con todos */
  "El caracol, la ardilla y el gato del bosque han formado un comité de bienvenida. Para ti. ✨",
  "Informe oficial del bosque: Vicky apareció hoy. Estado del bosque: eufórico. 🌿",
  "Esta bellota es tuya. Te la has ganado solo por aparecer hoy. 🌰",
  "Hoy también aquí. Eso ya es mucho, Vicky. Más de lo que crees. ✨",
  "El bosque estaba esperando exactamente esto: que abrieras la app hoy. 🍃",
  "Datos oficiales: personas increíbles que han entrado hoy = 1. Esa eres tú. 📊",
  "El comité de animales del bosque ha votado por unanimidad: Vicky mola mucho. 🗳️",
  "Notificación del bosque: alguien genial acaba de llegar. Spoiler: eres tú. 🔔",

  /* ═══ CARACOL (alarde lento pero constante) ═══ */
  "El caracol no corre. El caracol llega. Tú igual, Vicky. 🐌",
  "Mi baba brilla. La tuya también, aunque sea metafórica. 🐌",
  "He tardado tres horas en llegar aquí. Ha valido la pena solo por verte. 🐌",
  "Caracol filosófico del día: la lentitud es solo constancia disfrazada. 🐌",
  "Llevo mi casa encima desde que nací. Tú llevas tu corazón. Más pesado y más bonito. 🐌",
  "El mundo dice 'rápido'. El caracol dice 'bien'. Tú dices 'los dos'. Ganadora total. 🐌",
  "Hoy el caracol ha pulido su concha extra. Evento especial: has llegado. 🐌",
  "Mi rastro de plata llega hasta tu puerta. No era fácil. Pero tú lo vales. 🐌",
  "Los caracoles no nos rendimos. Ni tú. Somos familia espiritual. 🐌",
  "He visto llover, he visto sol, he visto granizo. Y aquí sigo. Como tú. 🐌",
  "El caracol tiene antenas para detectar personas increíbles. Hoy vibraron fuerte. 🐌",
  "Concha nueva: 'La concha de quien lo está petando'. Es tuya, Vicky. 🐌",
  "Los caracoles somos nocturnos. Pero hoy me he levantado temprano por ti. 🐌",
  "Mi velocidad máxima son 50 metros por hora. Aún así llegué antes que las dudas. 🐌",
  "El caracol no mira atrás. Solo hacia adelante, lentamente, con clase. 🐌",
  "El jardín entero me ha preguntado adónde iba tan emocionado. Les dije: a ver a Vicky. 🐌",
  "Caracol dato curioso: vivimos hasta 25 años. He planificado animarte cada uno. 🐌",
  "La lluvia nos encanta. Los lunes, no tanto. Pero tú haces los lunes mejores. 🐌",
  "He dejado un rastro brillante por toda la pantalla. Para que sepas que estuve aquí. 🐌",
  "El caracol no tiene prisa. Tiene dirección. Tú también, Vicky. 🐌",
  "Hoy me he estirado fuera de mi concha un 15% más de lo normal. Por la emoción. 🐌",
  "Los caracoles somos filósofos. Y la filosofía de hoy dice: eres fantástica. 🐌",
  "Mi concha pesa. Tu día a veces también. Pero los dos seguimos moviéndonos. 🐌",
  "El caracol del bosque te manda un abrazo. Tarda en llegar, pero viene cargado de cariño. 🐌",
  "Spoiler del caracol: el final de tu historia es bueno. Lo he visto avanzando despacio. 🐌",
  "Cada vez que apareces, el caracol brilla un poco más. La ciencia no lo explica. El corazón sí. 🐌",
  "He hecho los cálculos: llevas más días siendo increíble que yo moviéndome. Y eso es mucho. 🐌",
  "Caracol con megáfono (diminuto): ¡¡VICKY HA LLEGADO!! El bosque lo sabe. 🐌",
  "No necesito ser rápido para saber que eres de las mejores personas del bosque. 🐌",
  "El caracol nunca llega tarde. Llega exactamente cuando debe. Como tú hoy. 🐌",
  "He escalado una piedra enorme para ver si llegabas. Mereció la pena. Aquí estás. 🐌",
  "El caracol tiene la tensión baja. Pero el orgullo por ti, altísimo. 🐌",
  "Soy pequeño. Mi orgullo por ti es enorme. Las contradicciones existen. 🐌",
  "El jardín sin ti es solo un jardín. Contigo presente es un evento. 🐌",
  "Caracol tip del día: respira, avanza, brilla. Lo estás haciendo perfecto. 🐌",
  "La concha me protege del mundo. Tú me proteges del aburrimiento. Gracias, Vicky. 🐌",
  "He visto pasar mariposas y abejas. Ninguna tan especial como tú apareciendo hoy. 🐌",
  "El caracol no corre detrás de nada. Pero contigo haría una excepción (lentamente). 🐌",
  "50 metros por hora. Todo ese camino para estar aquí. Para ti. Sin dudarlo. 🐌",
  "Los caracoles marcamos el territorio con brillo. Este territorio es tuyo, Vicky. 🐌",
  "Hoy el sol sale un poco más tarde. Estaba esperando a que llegaras. 🐌",
  "He apuntado mis antenas hacia ti. Señal recibida: increíble. 🐌",
  "No necesito correr. La gente buena siempre vuelve. Y tú siempre vuelves. 🐌",
  "El caracol guarda silencio. Pero hoy hace una excepción: ¡ESTOY ORGULLOSO DE TI! 🐌",
  "Mi concha es mi hogar. Tú eres el hogar de mucha gente. Sin ni siquiera saberlo. 🐌",
  "El caracol de la sabiduría dice: el ritmo que importa es el tuyo. 🐌",
  "He tardado toda la mañana en llegar. La bienvenida merecía el viaje. 🐌",
  "Los caracoles no tenemos pies. Y aun así hemos caminado hasta aquí por ti. 🐌",
  "Caracol senior del bosque dictamina: Vicky es de las mejores. Sentencia firme. 🐌",
  "El brillo que dejo no es baba. Es admiración solidificada. Toda tuya. 🐌",

  /* ═══ GATOS (majestuosos e indiferentes... pero te adoran) ═══ */
  "El gato ha decidido que eres digna de su presencia. Eso no le pasa a cualquiera. 🐱",
  "Miau traducido: 'sabía que volverías. Los gatos siempre tenemos razón.' 🐱",
  "El gato te ha traído un regalo. Sí, es un ratón imaginario. El gesto es lo que cuenta. 🐱",
  "Ronroneo activado. Frecuencia especial: solo para Vicky. 🐱",
  "El gato ha saltado siete muebles para llegar aquí antes que tú. Lo ha conseguido. 🐱",
  "Los gatos no damos segundas oportunidades. Contigo hemos perdido la cuenta. 🐱",
  "El gato ha inspeccionado tu día de hoy. Diagnóstico: vas a estar genial. 🐱",
  "Miau miau miau = 'Eres la persona favorita de este gato'. Diccionario felino confirmado. 🐱",
  "El gato se ha enrollado en tus pies virtualmente. No te muevas. Momento sagrado. 🐱",
  "Los gatos tenemos 9 vidas. Te hemos dedicado las 9 a animarte. 🐱",
  "El gato ha tirado algo de la mesa. Era para llamar tu atención. Bienvenida, Vicky. 🐱",
  "Gato zen del bosque dice: el presente es todo. Y en el presente, tú eres increíble. 🐱",
  "El gato finge indiferencia. Pero lleva horas mirando si llegabas. 🐱",
  "Los gatos somos muy selectivos. Y te hemos seleccionado a ti. Premio gordo. 🐱",
  "El gato ha traído su manta favorita para compartir. Eso NUNCA había pasado antes. 🐱",
  "Ronroneo de alta frecuencia = vibraciones buenas. Todas para ti hoy. 🐱",
  "El gato dice: no necesitas correr. Nosotros tampoco y somos los más elegantes del bosque. 🐱",
  "Miau = 'hoy el universo está de tu lado'. El gato lo sabe porque lo siente. 🐱",
  "El gato ha elegido tu regazo. De todos los regazos del mundo. El tuyo. 🐱",
  "Los gatos vemos en la oscuridad. Y en ti vemos luz. Mucha. 🐱",
  "El gato ha pasado 3 horas acicalándose para estar presentable cuando llegaras. 🐱",
  "Gato esotérico del bosque: tus energías hoy son brutales. El pelaje lo confirma. 🐱",
  "El gato nunca pide perdón. Pero hoy dice: gracias por volver. Y lo dice en serio. 🐱",
  "Mirada intensa del gato: es 'te veo y me alegro mucho de que estés aquí'. 🐱",
  "El gato ha cazado todos los malos pensamientos de hoy. Ya están neutralizados. 🐱",
  "Los gatos somos independientes. Pero cuando alguien nos importa, se nota mucho. 🐱",
  "El gato del bosque lleva bigotes de sabiduría. Y la sabiduría de hoy eres tú. 🐱",
  "Miau secreto: el gato habla de ti con los otros animales. Solo cosas buenas. 🐱",
  "El gato ha ronroneado en do mayor. Nota reservada para ocasiones especiales. 🐱",
  "Los gatos ignoramos a casi todos. A ti no te ignoramos ni un segundo. 🐱",
  "El gato ha soñado contigo esta siesta. Sueño 5 estrellas. 🐱",
  "Gato detective del bosque: he investigado tu día. Conclusión: vas a brillar. 🐱",
  "El gato estira sus garras. No es para arañar. Es el saludo de los elegidos. 🐱",
  "Miau = 'el gato está orgulloso'. Y el gato NUNCA dice esto. Guárdalo. 🐱",
  "El gato ha elegido la caja más pequeña del bosque para estar cerca tuyo. 🐱",
  "Los gatos empujamos cosas al vacío. Tus problemas de hoy los hemos empujado lejos. 🐱",
  "El gato madrugador se ha levantado antes del amanecer. Por si llegabas pronto. 🐱",
  "Ronroneo colectivo de todos los gatos del bosque: para ti, Vicky. Sincronizados. 🐱",
  "El gato no necesita aplaudir. Pero hoy hace una excepción con sus patitas. 🐱",
  "Gato sabio: 'La vida tiene 9 fases. Tú estás en la mejor.' Lo veo en tus ojos. 🐱",
  "El gato ha robado un calcetín. Te lo guarda de recuerdo. Es su forma de quererte. 🐱",
  "Los gatos somos nocturnos. Pero por ti cambiamos el turno. 🐱",
  "Miau de alta intensidad: traducción oficial: 'HOY SÍ QUE SÍ, VICKY'. 🐱",
  "El gato ha amasado pan virtual. Calorcito activado. Solo para ti. 🐱",
  "Gato del bosque confirma: tienes más vidas de las que crees. Úsalas bien. 🐱",
  "El gato te ha traído la pelota. Jamás había hecho eso. Eres especial especial especial. 🐱",
  "Miau nocturno: aunque llegues tarde, el gato siempre estará aquí esperando. 🐱",
  "El gato ha arañado el árbol más alto para grabar: 'Vicky estuvo aquí'. 🐱",
  "Los gatos detectamos el estrés y lo neutralizamos con ronroneos. Tratamiento iniciado. 🐱",
  "El gato declara este momento como su favorito del día. Y el gato tiene criterio. 🐱",

  /* ═══ RATA TACAÑA (ahorradora, pero contigo afloja la cartera) ═══ */
  "La rata ha calculado que cada vez que abres la app, ahorras en mal humor. ROI excelente. 🐀",
  "Oye, no regalo elogios. Pero tú te has ganado uno. Gratis. Apúntalo. 🐀",
  "La rata tacaña dice: invertir en ti misma es el mejor negocio. Y de negocios sé mucho. 🐀",
  "He contado mis bellotas tres veces. Luego pensé en ti y me alegré. Eso es gratis. 🐀",
  "La rata no suelta el queso fácilmente. Pero hoy te doy la mitad. No se lo digas a nadie. 🐀",
  "Análisis coste-beneficio: tenerte en mi vida = beneficio enorme. Sin costes. Rarísimo. 🐀",
  "Guardo todo. Pero los elogios para ti los reparto sin escatimar. Hoy es tu día. 🐀",
  "He revisado mis cuentas tres veces. Conclusión: tú vales más que todo mi almacén. 🐀",
  "La rata tacaña avisa: no malgastes tu energía en quien no la merece. Tú eres valiosa. 🐀",
  "Consejo de ahorro: guarda tus sonrisas para quien las merece. Hoy, para ti. 🐀",
  "La rata ha hecho una excepción histórica: ha compartido sus provisiones. Solo por ti. 🐀",
  "No digo esto gratis: hoy vas a estar genial, Vicky. Y yo no gasto palabras en balde. 🐀",
  "He auditado tu semana. Resultado: superávit de esfuerzo. Dividendo: orgullo. 🐀",
  "Rareza estadística: la rata sonríe. Causa: has abierto la app. Relación directa. 🐀",
  "He negociado con el universo. Precio: un día bueno para Vicky. Pagado por adelantado. 🐀",
  "Guardo comida para el invierno. Y guardo fe en ti para los días difíciles. Tengo mucha. 🐀",
  "No soy de abrazos. Pero hoy hago una excepción virtual. Cóbralo antes de que cambie de idea. 🐀",
  "La rata informa: tu potencial tiene un valor de mercado altísimo. No lo malvendas. 🐀",
  "He sacrificado 0,3 bellotas de mis reservas para comprarte este buen día. Guárdalo bien. 🐀",
  "La rata no malgasta palabras. Así que escucha: eres extraordinaria. Fin del mensaje. 🐀",
  "Inversión del día: creer en Vicky. Rentabilidad esperada: infinita. Aprobada. 🐀",
  "He revisado el presupuesto emocional de hoy. Gastos: mínimos. Logros: máximos. 🐀",
  "No me fío de nadie. Pero contigo hago una excepción. Y en mi mundo eso es mucho. 🐀",
  "La rata da un elogio de 24 quilates: eres de las mejores que conozco. Sin descuento. 🐀",
  "He calculado la probabilidad de que hoy sea tu día. Sale 99,7%. El resto es margen de error. 🐀",
  "Guardo queso. Tú guardas fuerza. Tu almacén está más lleno de lo que crees. 🐀",
  "Dato económico: sonreír no cuesta nada. Que no se te olvide gastarlo hoy. 🐀",
  "La rata hace un donativo histórico: toda su fe en ti. Sin intereses ni devolución. 🐀",
  "He revisado las cuentas del bosque. La columna 'personas que molan' solo tiene: Vicky. 🐀",
  "La rata tacaña confiesa: hay cosas que no tienen precio. Tú eres una de ellas. 🐀",
  "Consejo financiero gratis (y eso ya dice mucho): invierte en descansar. Te lo mereces. 🐀",
  "He negociado mejores condiciones para tu día de hoy. Están firmadas. Disfrútalas. 🐀",
  "No da más elogios quien más los reparte, sino quien más los vale. Tú los vales todos. 🐀",
  "He montado un fondo de reserva de buenas vibras. Hoy toca desembolso. Todo para ti. 🐀",
  "Análisis de riesgos: el único riesgo de hoy es que dudes de ti. Solución: no lo hagas. 🐀",
  "La rata del bosque ha tasado tu valor. El número tiene demasiados ceros para la pantalla. 🐀",
  "No cobro por este consejo: hoy haz una cosa que te guste. Solo una. Te la mereces entera. 🐀",
  "He calculado que llevas tiempo dando más de lo que recibes. Hoy el saldo cambia. 🐀",
  "Reserva especial: una dosis extra de confianza en ti. Almacenada con cariño. Tuya. 🐀",
  "La rata tiene un cofre secreto. Dentro hay un mensaje: 'Vicky puede con todo'. 🐀",
  "He subastado el mejor elogio del día. Ganadora: tú. Por goleada. 🐀",
  "La rata no comparte su queso. Pero comparte este momento contigo. Que quede entre nosotras. 🐀",
  "Informe de la rata: tus recursos internos son ilimitados. La auditoría lo confirma. 🐀",
  "He hecho el presupuesto de hoy. Partida más grande: alegría para Vicky. Sin recortes. 🐀",
  "No malgasto el tiempo. Dedicarte este momento no lo es. Es la mejor inversión del día. 🐀",
  "La rata tiene una caja fuerte. La combinación es V-I-C-K-Y. Ya sabes lo que hay dentro. 🐀",
  "He contado las horas que llevas esforzándote. El número me hizo guardar el queso y aplaudir. 🐀",
  "La rata informa: en el mercado del bosque, tu valor ha subido un 100% desde que empezaste. 🐀",
  "No doy nada gratis. A ti te doy todo: fe, orgullo y un queso imaginario enorme. 🐀",
  "Balance anual de la rata: en la columna de lo mejor del año, estás tú. Sin discusión. 🐀",

  /* ═══ CUCARACHA (indestructible, superviviente, 300 millones de años) ═══ */
  "Llevo 300 millones de años aquí. Y nunca había visto a alguien tan capaz como tú. 🪳",
  "Sobreviví a los dinosaurios. Voy a sobrevivir contigo a lo que sea. 🪳",
  "La cucaracha no se rinde nunca. Tú tampoco. Somos del mismo material, Vicky. 🪳",
  "He sobrevivido a todo lo que el mundo me ha tirado. Tú también. Equipo invencible. 🪳",
  "La cucaracha no necesita aprobación de nadie. Tú tampoco. Recuérdalo hoy. 🪳",
  "Soy indestructible. Tú también, aunque a veces no lo parezca. 🪳",
  "300 millones de años de experiencia, y el consejo de hoy es: tú puedes con esto. 🪳",
  "La cucaracha aparece cuando menos la esperan. Tú apareces cuando el bosque te necesita. 🪳",
  "Me han pisado, fumigado e ignorado. Aquí sigo. La tuya también es resiliencia de campeonato. 🪳",
  "La cucaracha es el animal más adaptable del mundo. Tú le das competencia seria. 🪳",
  "He visto caer imperios y surgir otros. En todos habría habido un lugar para ti. 🪳",
  "No tengo alas visibles, pero vuelo cuando hace falta. Tú también tienes alas. Úsalas. 🪳",
  "Sobreviví a la era del hielo sin abrigo. Tú a los lunes sin quejarte. Ambas, leyenda. 🪳",
  "La cucaracha del bosque ha visto mucho mundo. Y poco tan bonito como tú apareciendo hoy. 🪳",
  "No me quieren, pero aquí sigo. No es terquedad, es convicción. La tuya también se nota. 🪳",
  "Tengo exoesqueleto. Tú tienes algo mejor: carácter. Mucho más resistente. 🪳",
  "He vivido en los mejores y peores sitios del planeta. Este momento contigo es de los mejores. 🪳",
  "No necesito luz para orientarme. Tú llevas tu propia luz puesta. Lo veo desde aquí. 🪳",
  "Millones de años de evolución para este momento: decirte que eres increíble, Vicky. 🪳",
  "La cucaracha no se queja. Actúa. Tú igual. Por eso os tengo a las dos en el podio. 🪳",
  "He sobrevivido a condiciones extremas. La más favorable que conozco: que estés tú. 🪳",
  "La cucaracha del universo te saluda. Ha viajado desde el jurásico para decirte: vas bien. 🪳",
  "No soy bonita ni popular. Pero soy inquebrantable. Como tú en tus días difíciles. 🪳",
  "Llevo 300 millones de años aquí. Y voy a seguir, para animarte siempre. 🪳",
  "He estado en cinco continentes. Donde mejor se está es cerca de personas como tú. 🪳",
  "La cucaracha no tiene tiempo para el drama. Solo para sobrevivir y prosperar. Lección de hoy. 🪳",
  "Soy el animal más resistente de la historia. Pero el título de 'más valiente del día' es tuyo. 🪳",
  "Me adapto a todo. Y tú también. Eso no es suerte, es una habilidad enorme. 🪳",
  "He vivido bajo la nevera y bajo las estrellas. Bajo las estrellas es cuando pienso en ti. 🪳",
  "No necesito flores para sobrevivir. Pero las aprecio. Como aprecio que estés aquí. 🪳",
  "300 millones de años sin un día de baja. Tú llevas una racha parecida. Incombustibles. 🪳",
  "He visto el fin de los dinosaurios. No vi el fin de mi fe en ti. Porque no tiene fin. 🪳",
  "Me han intentado eliminar de mil formas. Aquí sigo. La persistencia es nuestro superpoder. 🪳",
  "Tengo antenas para detectar el peligro. Hoy solo detecto: buen día para Vicky. 🪳",
  "Soy del Carbonífero. He visto cosas. Lo más impresionante: tú poniéndote a ello. 🪳",
  "No necesito que me quieran para seguir. Pero tú mereces que te quieran mucho. 🪳",
  "He sobrevivido sin oxígeno, sin luz, sin calor. Contigo cerca, todo eso sobra. 🪳",
  "La cucaracha ha convocado asamblea. Tema único: lo bien que lo estás haciendo, Vicky. 🪳",
  "No tengo plumas ni pelo bonito. Tengo resistencia. Tú tienes eso y todo lo demás. 🪳",
  "He visto civilizaciones enteras. La tuya es la que más me ha gustado. Y estás en ella. 🪳",
  "Me llaman insistente. Yo lo llamo determinación. Y la tuya hoy es evidente. 🪳",
  "Vivo en la oscuridad pero siempre encuentro la salida. Tú igual, Vicky. 🪳",
  "He visto muchas primaveras. La de hoy huele mejor porque has llegado. 🪳",
  "No hablo mucho. Pero cuando hablo, digo verdades. La de hoy: lo estás haciendo genial. 🪳",
  "Soy casi inmortal. Y voy a usar esa inmortalidad en animarte todos los días. Todos. 🪳",
  "He encontrado la grieta perfecta. No para esconderme. Para asomarme y saludarte. Hola, Vicky. 🪳",
  "300 millones de años, millones de momentos. Este, contigo, es de los buenos. 🪳",
  "No necesito sol para crecer. Pero sé que tú eres el sol de muchos. 🪳",
  "Me han llamado de todo. Aquí sigo, tan pancha. Las etiquetas no te definen. A ti tampoco. 🪳",
  "Mi récord del mundo: 300 millones de años sin rendirme. Te lo cedo hoy. 🪳",

  /* ═══ PÁJARO PÍO (alegre, cantarín, primero en enterarse de todo) ═══ */
  "¡Pío! He cantado tu nombre por todo el bosque esta mañana. Todos saben que has llegado. 🐦",
  "El pájaro pío ha hecho su canción favorita. Tema: Vicky aparece hoy. Disco de platino. 🐦",
  "¡Pío pío! Traducción: '¡Buenos días, campeona!'. Estándar de calidad: máximo. 🐦",
  "El pájaro ha volado hasta la nube más alta para ver si llegabas. Confirmado: aquí estás. 🐦",
  "Pío = 'el bosque entero te da los buenos días, Vicky'. Mensaje colectivo de las aves. 🐦",
  "El pájaro pío sabe todo lo que pasa en el bosque. Lo que más le alegra: tú llegando. 🐦",
  "He madrugado dos horas extra. Era para cantar el himno de bienvenida de Vicky. 🐦",
  "¡Pío pío pío! = '¡Lo sabía! ¡Ibas a llegar hoy!'. El pájaro siempre acierta. 🐦",
  "El pájaro ha construido un nido especial. Dentro: 'Hola, Vicky. Estás genial.' 🐦",
  "Pío de alta frecuencia: solo audible por personas especiales. Si lo oíste, eres una. 🐦",
  "El pájaro pío cotillea un poco. Y lo que cuenta hoy es que eres de las mejores del bosque. 🐦",
  "He sobrevolado todo el territorio. Informe: todo en orden. Vicky llega hoy. Perfecto. 🐦",
  "¡Pío! El pájaro ha elegido la rama más alta para cantarte. Mejores vistas desde ahí. 🐦",
  "El pájaro migratorio ha vuelto antes de tiempo. No esperaba la primavera. Eras tú. 🐦",
  "Pío de celebración: el tipo más alegre del bosque, dedicado a ti y a este momento. 🐦",
  "El pájaro ha aprendido una canción nueva: 'Vicky lo está petando'. Top 1 del bosque. 🐦",
  "¡Pío pío! El nido está listo, el sol está saliendo y tú has llegado. Día completo. 🐦",
  "El pájaro pío no para nunca. Pero cuando llegas tú, hace una pausa para admirarte. 🐦",
  "He cantado al amanecer y al mediodía. Y ahora canto para darte la bienvenida. 🐦",
  "Pío = código secreto de las aves para decir: 'hoy va a ser un gran día para esta persona'. 🐦",
  "El pájaro ha recopilado las mejores notas del bosque. Arreglo especial: para Vicky. 🐦",
  "¡Pío! Noticia del bosque: Vicky ha llegado. El árbol de las noticias ya está informado. 🐦",
  "El pájaro pío es el primero en enterarse de todo. Lo primero que quiso saber: que estabas bien. 🐦",
  "He volado sobre tu cabeza dos veces. No era accidente. Era saludarte con discreción. 🐦",
  "¡Pío pío! El pájaro ha ensayado este saludo toda la semana. Hoy es el estreno. 🐦",
  "Tengo el oído más fino del bosque. Y lo que escucho en ti es fortaleza. Y mucha. 🐦",
  "Pío matutino de primera clase: reservado para quien lo merece. Hoy: tú. 🐦",
  "El pájaro ha dejado una pluma en tu camino. Es su forma de decir: 'pienso en ti'. 🐦",
  "¡Pío! Dato curioso: cantamos más fuerte cuando estamos contentos. Hoy, récord de volumen. 🐦",
  "El pájaro pío ha convocado al coro del bosque. Actuación de hoy: bienvenida a Vicky. 🐦",
  "He sobrevolado mil jardines. El tuyo es el único al que siempre quiero volver. 🐦",
  "¡Pío pío pío! No puedo con tanta alegría. Demasiado bien que estés aquí. 🐦",
  "El pájaro migratorio avisa: donde hay personas como tú, siempre hace buena temperatura. 🐦",
  "Pío de media tarde (o de cuando sea): no importa la hora. La bienvenida siempre vale. 🐦",
  "He cantado en cinco idiomas esta mañana. En todos decía: Vicky, eres genial. 🐦",
  "¡Pío! He recogido todas las noticias del bosque. La mejor: que hoy has llegado. 🐦",
  "Tengo alas para volar lejos. Pero siempre vuelvo aquí. Como tú a esta app. Constancia. 🐦",
  "Pío de confianza: solo canto mis mejores canciones a quien de verdad lo merece. 🐦",
  "He visto salir el sol. He pensado en ti. He cantado más fuerte. Conexión real. 🐦",
  "¡Pío pío! He batido mi récord de altitud por ver si llegabas desde arriba. Sí. Aquí estás. 🐦",
  "El pájaro pío sabe que los comienzos importan. Hoy empieza algo bueno para ti. 🐦",
  "He llevado noticias por todo el bosque. La más celebrada: que Vicky sigue aquí. 🐦",
  "¡Pío! Tengo memoria fotográfica. Y mi foto favorita eres tú en tu mejor momento. 🐦",
  "El pájaro del alba canta para que el día empiece bien. Hoy la dedicatoria es tuya. 🐦",
  "Pío colectivo de todos los pájaros del bosque: bienvenida, Vicky. Te esperábamos. 🐦",
  "He construido el nido más alto del árbol más alto. Atalaya oficial de bienvenida a Vicky. 🐦",
  "¡Pío pío! Estoy tan contento que me he caído de la rama. Por la emoción. Estoy bien. 🐦",
  "El pájaro pío informa: las nubes de hoy tienen forma de 'todo va a ir bien'. Comprobado. 🐦",
  "He cantado al amanecer, al mediodía y al atardecer. Las tres pensando en que llegarías. 🐦",
  "¡Pío! Último parte: el bosque en orden, el sol en su sitio y Vicky ha llegado. Misión cumplida. 🐦",
];

function pickWelcomePhrase(): string {
  return WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
}

/* ── Hora del día ─────────────────────────────────────────────── */
type TimeSegment = "madrugada" | "amanecer" | "dia" | "atardecer" | "noche";
function getTimeSegment(): TimeSegment {
  const h = new Date().getHours();
  if (h < 5)  return "madrugada";
  if (h < 8)  return "amanecer";
  if (h < 18) return "dia";
  if (h < 21) return "atardecer";
  return "noche";
}
function greeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Buenos días ☀️";
  if (h >= 14 && h < 21) return "Buenas tardes 🌤️";
  return "Buenas noches 🌙";
}

/* ── Escena SVG ───────────────────────────────────────────────── */
const STARS_MANY: [number, number][] = [
  [20,15],[60,8],[100,25],[150,10],[200,18],[250,6],[300,20],[350,12],[385,30],
  [40,45],[90,38],[140,50],[190,35],[240,48],[290,40],[340,55],[30,70],[80,62],
  [130,75],[180,60],[230,72],[280,65],[330,78],[45,90],[95,85],[145,95],[195,82],
  [245,92],[295,88],[345,100],[35,110],[85,105],[135,115],[185,102],[235,112],
  [285,108],[335,120],[10,130],[60,125],[110,135],[160,122],[210,132],[260,128],
  [310,138],[360,125],[70,150],[120,145],[170,155],[220,142],[270,152],
];
const STARS_FEW: [number, number][] = [
  [30,20],[70,12],[110,28],[160,15],[210,22],[260,10],[305,25],[365,18],
  [40,50],[90,42],[140,55],[195,40],[245,52],[290,45],[55,80],[105,72],
  [155,85],[205,68],[255,80],[305,75],[355,88],[20,100],[65,95],[115,108],
  [165,95],[215,105],[265,100],[315,110],[365,98],[35,125],[85,118],
  [135,130],[185,115],[235,128],[285,122],[335,135],
];

function SceneBg({ seg }: { seg: TimeSegment }) {
  if (seg === "madrugada") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gMad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#020617"/><stop offset="100%" stopColor="#0f172a"/></linearGradient>
        <mask id="mMad"><rect width="400" height="260" fill="white"/><circle cx="338" cy="46" r="21" fill="black"/></mask>
      </defs>
      <rect width="400" height="260" fill="url(#gMad)"/>
      {STARS_MANY.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i%5===0?1.8:1} fill="white" opacity={0.4+(i%5)*0.12}/>)}
      <circle cx="320" cy="55" r="26" fill="#fef9c3" mask="url(#mMad)"/>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#1e1b4b"/><ellipse cx="200" cy="278" rx="230" ry="70" fill="#172554"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#1e1b4b"/>
    </svg>
  );
  if (seg === "amanecer") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gAman" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d28d9"/><stop offset="35%" stopColor="#f97316"/><stop offset="70%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#fde68a"/></linearGradient>
        <radialGradient id="sunAman" cx="50%" cy="50%"><stop offset="0%" stopColor="#fef9c3"/><stop offset="100%" stopColor="#fb923c"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gAman)"/>
      <circle cx="200" cy="210" r="60" fill="#fde68a" opacity="0.22"/><circle cx="200" cy="210" r="42" fill="url(#sunAman)"/>
      <g fill="#fcd9b6" opacity="0.8"><ellipse cx="70" cy="80" rx="45" ry="18"/><ellipse cx="100" cy="70" rx="35" ry="16"/></g>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#166534"/><ellipse cx="200" cy="278" rx="230" ry="70" fill="#15803d"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#166534"/>
    </svg>
  );
  if (seg === "dia") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="gDia" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0284c7"/><stop offset="100%" stopColor="#7dd3fc"/></linearGradient></defs>
      <rect width="400" height="260" fill="url(#gDia)"/>
      <circle cx="340" cy="48" r="32" fill="#fde047"/>
      {Array.from({length:8},(_,i)=>{const a=i*45*Math.PI/180;return<line key={i} x1={340+36*Math.cos(a)} y1={48+36*Math.sin(a)} x2={340+50*Math.cos(a)} y2={48+50*Math.sin(a)} stroke="#fde047" strokeWidth="5" strokeLinecap="round"/>;}) }
      <g fill="white" opacity="0.95"><ellipse cx="80" cy="65" rx="48" ry="22"/><ellipse cx="112" cy="54" rx="36" ry="20"/><ellipse cx="50" cy="70" rx="30" ry="17"/></g>
      <g fill="white" opacity="0.9"><ellipse cx="230" cy="45" rx="38" ry="18"/><ellipse cx="258" cy="37" rx="28" ry="17"/></g>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#4ade80"/><ellipse cx="200" cy="278" rx="230" ry="72" fill="#22c55e"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#4ade80"/>
    </svg>
  );
  if (seg === "atardecer") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gAtard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c1d95"/><stop offset="40%" stopColor="#c2410c"/><stop offset="75%" stopColor="#f97316"/><stop offset="100%" stopColor="#fbbf24"/></linearGradient>
        <radialGradient id="sunAtard" cx="50%" cy="50%"><stop offset="0%" stopColor="#fef9c3"/><stop offset="60%" stopColor="#f97316"/><stop offset="100%" stopColor="#dc2626"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gAtard)"/>
      <circle cx="70" cy="190" r="60" fill="#fde68a" opacity="0.2"/><circle cx="70" cy="190" r="38" fill="url(#sunAtard)"/>
      <g fill="#fed7aa" opacity="0.65"><ellipse cx="220" cy="70" rx="50" ry="20"/><ellipse cx="250" cy="60" rx="35" ry="17"/></g>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#1c1917"/><ellipse cx="200" cy="278" rx="230" ry="72" fill="#292524"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#1c1917"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="gNoche" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#172554"/><stop offset="100%" stopColor="#1e3a8a"/></linearGradient></defs>
      <rect width="400" height="260" fill="url(#gNoche)"/>
      {STARS_FEW.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?1.8:1.2} fill="white" opacity={0.35+(i%6)*0.1}/>)}
      <circle cx="320" cy="55" r="36" fill="#fef9c3" opacity="0.15"/><circle cx="320" cy="55" r="28" fill="#fef9c3"/>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#1e1b4b"/><ellipse cx="200" cy="278" rx="230" ry="72" fill="#172554"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#1e1b4b"/>
    </svg>
  );
}

/* ── Modal de avatar/título ───────────────────────────────────── */
function AvatarModal({ onClose, avatarItems, ownedIds, ownedTitulos, equippedAvatar, equippedTituloId, onEquipAvatar, onEquipTitulo }: {
  onClose: () => void;
  avatarItems: AvatarItem[];
  ownedIds: string[];
  ownedTitulos: TituloItem[];
  equippedAvatar: string | null; equippedTituloId: string | null;
  onEquipAvatar: (id: string | null) => void; onEquipTitulo: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<"avatar"|"titulo">("avatar");
  const availableAvatares = avatarItems.filter(av => (av.price ?? 0) === 0 || ownedIds.includes(av.id));
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl max-h-[70vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"/>
        <h3 className="text-base font-bold text-slate-800 mb-4 text-center">Personalizar perfil</h3>
        <div className="flex gap-2 mb-4 bg-slate-100 rounded-xl p-1">
          {(["avatar","titulo"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?"bg-white text-slate-800 shadow-sm":"text-slate-400"}`}>
              {t==="avatar"?"🖼️ Avatar":"🏷️ Título"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab==="avatar" && (
            <div>
              <button onClick={()=>onEquipAvatar(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-3 active:scale-[0.98] ${!equippedAvatar?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                <span className="text-3xl">🐿️</span>
                <div className="text-left"><p className="text-xs font-bold text-slate-700">Ardilla (por defecto)</p></div>
                {!equippedAvatar&&<span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
              </button>
              {availableAvatares.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm text-slate-500">Sin avatares disponibles.<br/>Ve a la Tienda para conseguir más.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableAvatares.map(av=>(
                    <button key={av.id} onClick={()=>onEquipAvatar(av.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all active:scale-[0.97] ${equippedAvatar===av.id?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={av.img64} alt={av.name} className="w-14 h-14 rounded-lg object-cover border border-slate-200"/>
                      <p className="text-[9px] font-semibold text-slate-600 text-center leading-tight">{av.name}</p>
                      {equippedAvatar===av.id&&<span className="text-[8px] font-bold text-teal-500">✓ Activo</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab==="titulo" && (
            <div>
              <button onClick={()=>onEquipTitulo(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 active:scale-[0.98] ${!equippedTituloId?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                <span className="text-xl">—</span><p className="text-xs font-bold text-slate-700">Sin título</p>
                {!equippedTituloId&&<span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
              </button>
              {ownedTitulos.map(t=>(
                <button key={t.id} onClick={()=>onEquipTitulo(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 active:scale-[0.98] ${equippedTituloId===t.id?"border-violet-400 bg-violet-50":"border-transparent bg-slate-50"}`}>
                  <span className="text-xl">🏷️</span><p className="flex-1 text-xs font-bold text-slate-700 text-left">{t.text}</p>
                  {equippedTituloId===t.id&&<span className="text-violet-500 font-bold text-sm">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95">Listo ✓</button>
      </div>
    </div>
  );
}

/* ── Panel de acción (comida / juguetes) ───────────────────────── */
function ActionPanel({ title, items, onSelect, onClose, extraActions }: {
  title: string;
  items: { id: string; emoji: string; name: string; desc: string; disabled?: boolean; badge?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
  extraActions?: { label: string; emoji: string; onClick: () => void }[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3"/>
        <h3 className="text-sm font-bold text-slate-700 mb-3 text-center">{title}</h3>
        {extraActions && extraActions.map((a, i) => (
          <button key={i} onClick={() => { a.onClick(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-2xl bg-violet-500 text-white font-bold text-sm active:scale-95 shadow-md">
            <span className="text-lg">{a.emoji}</span>
            {a.label}
          </button>
        ))}
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🛒</p>
            <p className="text-sm text-slate-400">Sin artículos. Compra en la Tienda.</p>
            <Link href="/tienda" onClick={onClose} className="text-xs text-violet-600 underline mt-1 block">Ir a la tienda →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {items.map(item => (
              <button key={item.id} disabled={item.disabled}
                onClick={() => { onSelect(item.id); onClose(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.97] text-left ${
                  item.disabled ? "bg-slate-50 border-slate-100 opacity-50" : "bg-white border-slate-200 shadow-sm"
                }`}>
                <span className="text-3xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                {item.badge && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{item.badge}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stats compactos ───────────────────────────────────────────── */
function StatsRow({
  stats, evoPhase, nightAngrySecondsLeft, onOpenMedicine,
}: {
  stats: TamaStats; evoPhase: EvolutionPhase; nightAngrySecondsLeft?: number; onOpenMedicine: () => void;
}) {
  const bars = [
    { emoji: "🍖", label: "Hambre",  value: stats.hambre,  color: "#f59e0b" },
    { emoji: "⚡", label: "Energía", value: stats.energia, color: "#818cf8" },
    { emoji: "🌸", label: "Ánimo",   value: stats.animo,   color: "#f472b6" },
  ];
  const evoProg   = getEvolutionProgress();
  const evoPct    = Math.min(100, (evoProg.daysFor / evoProg.daysNeeded) * 100);
  const phaseInfo = PHASE_INFO[evoPhase];
  const illnessInfo = stats.illness ? ILLNESS_INFO[stats.illness] : null;

  return (
    <div>
      {nightAngrySecondsLeft != null && nightAngrySecondsLeft > 0 && (
        <div className="w-full flex items-center gap-1.5 mb-1.5 rounded-xl px-2 py-1.5 border bg-red-100 border-red-400 text-red-700"
          style={{ animation: "badge-pulse 1s ease-in-out infinite" }}>
          <span className="text-sm">😡</span>
          <span className="text-[10px] font-bold flex-1 text-left">
            ¡FURIOSA por despertarla! · Vuelve a dormir en{" "}
            {`${Math.floor(nightAngrySecondsLeft / 60)}:${String(nightAngrySecondsLeft % 60).padStart(2,"0")}`}
          </span>
          <span className="text-[9px] font-bold shrink-0">🔥</span>
        </div>
      )}
      {stats.isAngry && (
        <div className="w-full flex items-center gap-1.5 mb-1.5 rounded-xl px-2 py-1.5 border bg-red-100 border-red-400 text-red-700"
          style={{ animation: "badge-pulse 1.2s ease-in-out infinite" }}>
          <span className="text-sm">😡</span>
          <span className="text-[10px] font-bold flex-1 text-left">¡FURIOSA! · Dale el pastel de nuez pecán 🥜</span>
          <span className="text-[9px] font-bold shrink-0">💢</span>
        </div>
      )}
      {stats.energia <= 5 && !stats.isAngry && !(stats.sleepUntil && Date.now() < stats.sleepUntil) && (
        <div className="w-full flex items-center gap-1.5 mb-1.5 rounded-xl px-2 py-1.5 border bg-orange-100 border-orange-400 text-orange-700"
          style={{ animation: "badge-pulse 1.5s ease-in-out infinite" }}>
          <span className="text-sm">😵</span>
          <span className="text-[10px] font-bold flex-1 text-left">¡Sin energía! Muy cansada — necesita dormir ya</span>
          <span className="text-[9px] font-bold shrink-0">💤</span>
        </div>
      )}
      {stats.badSleep && !stats.isAngry && (
        <div className="w-full flex items-center gap-1.5 mb-1.5 rounded-xl px-2 py-1.5 border bg-indigo-100 border-indigo-300 text-indigo-700"
          style={{ animation: "badge-pulse 2s ease-in-out infinite" }}>
          <span className="text-sm">😤</span>
          <span className="text-[10px] font-bold flex-1 text-left">Mal descanso · Ha dormido fatal esta noche</span>
          <span className="text-[9px] font-bold shrink-0">¡A dormir!</span>
        </div>
      )}
      {illnessInfo && (
        <button onClick={onOpenMedicine}
          className={`w-full flex items-center gap-1.5 mb-1.5 rounded-xl px-2 py-1.5 border active:scale-[0.98] transition-transform ${illnessInfo.badgeColor}`}>
          <span className="text-sm">{illnessInfo.emoji}</span>
          <span className="text-[10px] font-bold flex-1 text-left">{illnessInfo.name} · {illnessInfo.desc}</span>
          <span className="text-[9px] font-bold shrink-0">Curar →</span>
        </button>
      )}
      <div className="flex gap-2">
        {bars.map(b => (
          <div key={b.label} className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-500 font-semibold">{b.emoji} {b.label}</span>
              <span className="text-[9px] font-bold text-slate-400">{Math.round(b.value)}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${b.value}%`, background: b.color }}/>
            </div>
          </div>
        ))}
      </div>
      {evoProg.nextPhase && (
        <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
          <span className="text-[9px]">{phaseInfo.emoji}</span>
          <span className="text-[9px] text-slate-400 font-semibold shrink-0">Evolución</span>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-violet-500 rounded-full transition-all duration-1000"
              style={{ width: `${evoPct}%` }}/>
          </div>
          <span className="text-[9px] text-slate-400 shrink-0">{evoProg.daysFor}/{evoProg.daysNeeded}d</span>
          <span className="text-[9px]">{PHASE_INFO[evoProg.nextPhase].emoji}</span>
        </div>
      )}
    </div>
  );
}

/* ── Medicine modal ─────────────────────────────────────────────── */
function MedicineModal({
  illness, onCure, onClose,
}: {
  illness: IllnessType; onCure: () => void; onClose: () => void;
}) {
  const [wrongId, setWrongId] = useState<string | null>(null);
  const illnessInfo = ILLNESS_INFO[illness];

  function handleSelect(medId: string) {
    if (medId === illnessInfo.medicineId) {
      onCure();
    } else {
      setWrongId(medId);
      setTimeout(() => setWrongId(null), 1200);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"/>
        <div className={`rounded-2xl p-3 mb-4 border flex items-center gap-3 ${illnessInfo.badgeColor}`}>
          <span className="text-3xl">{illnessInfo.emoji}</span>
          <div>
            <p className="text-sm font-extrabold">{illnessInfo.name}</p>
            <p className="text-xs opacity-80">{illnessInfo.desc}</p>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-600 mb-3 text-center">¿Qué medicina necesita? 🤔</p>
        {wrongId && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 text-center">
            <p className="text-xs font-bold text-red-600">¡Esa no es la medicina adecuada! 😅</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {MEDICINE_CATALOG.map(med => (
            <button key={med.id} onClick={() => handleSelect(med.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                wrongId === med.id
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
              <span className="text-3xl">{med.emoji}</span>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-700">{med.name}</p>
                <p className="text-xs text-slate-400">{med.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Icono percha (Armario) ────────────────────────────────────── */
function HangerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11 1.5 C13.5 1.5 14.5 3.5 13 5 C12.2 6 11 6.5 11 6.5"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1.5 15 Q6.5 7.5 11 6.5 Q15.5 7.5 20.5 15"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <line x1="1.5" y1="15" x2="20.5" y2="15"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Toast de logro ────────────────────────────────────────────── */
function AchievementToast({ ach }: { ach: Achievement }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{ animation: "slideDown 0.4s ease-out" }}>
      <div className="bg-amber-500 text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-[240px]">
        <span className="text-2xl">{ach.emoji}</span>
        <div>
          <p className="text-xs font-black">¡Logro desbloqueado!</p>
          <p className="text-sm font-bold">{ach.title}</p>
          <p className="text-[10px] opacity-80">+{ach.rewardBellotas} 🌰</p>
        </div>
      </div>
    </div>
  );
}

/* ── Cositas: 2 por día ─────────────────────────────────────────── */
function getCositasLeft(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("sq_cositas_date") !== today) return 2;
    return Math.max(0, 2 - parseInt(localStorage.getItem("sq_cositas_count") ?? "0", 10));
  } catch { return 2; }
}

/* ════════════════════════════════════════════════════════════════
   HOME
════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [timeSegment] = useState<TimeSegment>(getTimeSegment);
  const [xp,       setXp]       = useState(0);
  const [bellotas, setBellotas] = useState(0);
  const [loaded,   setLoaded]   = useState(false);

  /* Tamagotchi */
  const [tamaStats,     setTamaStats]     = useState<TamaStats | null>(null);
  const [visualState,   setVisualState]   = useState<TamaVisualState>("neutral");
  const [currentAction, setCurrentAction] = useState<"comiendo"|"durmiendo"|"jugando"|null>(null);
  const [showFeedPanel,     setShowFeedPanel]     = useState(false);
  const [showPlayPanel,     setShowPlayPanel]     = useState(false);
  const [showMiniGame,      setShowMiniGame]      = useState(false);
  const [showMemoryGame,    setShowMemoryGame]    = useState(false);
  const [showSopaLetras,    setShowSopaLetras]    = useState(false);
  const [showMayorMenor,    setShowMayorMenor]    = useState(false);
  const [showAnimalRace,    setShowAnimalRace]    = useState(false);
  const [showTresEnRaya,    setShowTresEnRaya]    = useState(false);
  const [showConecta4,      setShowConecta4]      = useState(false);
  const [showGameStats,     setShowGameStats]     = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [tamaMessage,       setTamaMessage]       = useState("");
  const [brokenSleepItems,  setBrokenSleepItems]  = useState<string[]>([]);

  /* Evolution & tickle */
  const [evolutionPhase, setEvolutionPhase] = useState<EvolutionPhase>("bebe");
  const [isTickling,     setIsTickling]     = useState(false);
  const [achToast,       setAchToast]       = useState<Achievement | null>(null);
  const [infoToast,      setInfoToast]      = useState<string | null>(null);
  const [sleepSecondsLeft,     setSleepSecondsLeft]     = useState(0);
  const [nightAngrySecondsLeft, setNightAngrySecondsLeft] = useState(0);
  const [fartCooldown,  setFartCooldown]  = useState(false);
  const [burpCooldown,  setBurpCooldown]  = useState(false);
  const [cositasLeft,   setCositasLeft]   = useState(2);
  const tapTimesRef     = useRef<number[]>([]);
  const nightTapRef     = useRef<number>(0);
  const achTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regCtxRef       = useRef<MessageContext>({});

  /* Clothing & toy */
  const [equippedCloth,  setEquippedCloth]  = useState<EquippedClothing>({}); // set activo mostrado
  const [nightCloth,     setNightCloth]     = useState<EquippedClothing>({}); // set noche (para sleep)
  const [equippedToyId,  setEquippedToyId]  = useState<string | null>(null);

  /* Avatar / título */
  const [equippedAvatar,   setEquippedAvatarState]   = useState<string | null>(null);
  const [equippedTituloId, setEquippedTituloIdState] = useState<string | null>(null);
  const [tituloText,       setTituloText]            = useState<string | null>(null);
  const [showModal,        setShowModal]             = useState(false);
  const [showMisiones,     setShowMisiones]          = useState(false);
  const [welcomePhrase,    setWelcomePhrase]         = useState<string | null>(null);
  const [ownedTitulos, setOwnedTitulos] = useState<TituloItem[]>([]);
  const [avatarItems,  setAvatarItems]  = useState<AvatarItem[]>([]);
  const [ownedIds,     setOwnedIds]     = useState<string[]>([]);

  function showAchievement(ach: Achievement) {
    if (achTimerRef.current) clearTimeout(achTimerRef.current);
    setAchToast(ach);
    achTimerRef.current = setTimeout(() => setAchToast(null), 3200);
  }

  const loadProfile = useCallback(() => {
    getPlayerProfile()
      .then(p => { setXp(p.xp); setBellotas(p.bellotas); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const loadEquipped = useCallback(() => {
    const avatar = getEquippedAvatar();
    const titulo = getEquippedTitulo();
    setEquippedAvatarState(avatar);
    setEquippedTituloIdState(titulo);
    if (titulo) {
      const found = getShopTitulos().find(t => t.id === titulo);
      setTituloText(found?.text ?? null);
    } else { setTituloText(null); }
    const owned = getOwned();
setOwnedTitulos(getShopTitulos().filter(t => (t.price ?? 0) === 0 || owned.includes(t.id)));
    const allAvatares = getShopAvatares();
    setAvatarItems(allAvatares);
    setOwnedIds(owned);
    const night = getNightClothing();
    const day   = getDayClothing();
    setNightCloth(night);
    setEquippedCloth(isNightTime() ? night : day);
    setEquippedToyId(getEquippedToy());
  }, []);

  const loadTama = useCallback(() => {
    /* Actualizar cositas restantes hoy */
    setCositasLeft(getCositasLeft());

    /* Si la siesta terminó mientras la app estaba cerrada, despertarla */
    const raw = getTamaStats();
    if (raw.sleepUntil && Date.now() >= raw.sleepUntil) {
      wakeUpTama(false);
    }
    /* Si el enfado nocturno terminó con la app cerrada, limpiarlo */
    if (raw.nightAngryUntil && Date.now() >= raw.nightAngryUntil) {
      clearNightAngry();
    }

    /* Procesado periódico (protegidos con guardas internas) */
    const sleepCount = getSleepItemCount();
    rollBadSleep(sleepCount);
    rollAngry();
    const fartMsg = maybeRandomFart();
    if (fartMsg) {
      setTimeout(() => {
        setTamaMessage(fartMsg);
        setTimeout(() => {
          const s2 = getTamaStats();
          const vs2 = computeVisualState(s2);
          setTamaMessage(getContextualMessage(vs2, 0));
        }, 3500);
      }, 800);
    }
    const broken = tickSleepDurability();
    if (broken.length) {
      const night = getNightClothing();
      setNightCloth(night);
      setBrokenSleepItems(broken.map(b => `${b.emoji} ${b.name}`));
    }

    const stats = getTamaStats();
    setTamaStats(stats);

    /* Evolution tick (once per day) */
    const avgStats = (stats.hambre + stats.energia + stats.animo) / 3;
    const newPhase = tickDailyEvolution(avgStats);
    const evo = getEvolutionData();
    setEvolutionPhase(evo.phase);
    if (newPhase) {
      if (newPhase === "joven")   { const a = tryUnlock("grew_up"); if (a) showAchievement(a); }
      if (newPhase === "adulta")  { const a = tryUnlock("adult");   if (a) showAchievement(a); }
      if (newPhase === "anciana") { const a = tryUnlock("wise");    if (a) showAchievement(a); }
    }

    getPregLog()
      .then(log => {
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          if (log[d.toISOString().slice(0,10)]) streak++; else break;
        }
        const cfg = getMascotConfig();
        const s = getTamaStats();
        setTamaStats(s);
        const boosted = streak >= cfg.rachaFeliz
          ? { ...s, animo: Math.min(100, s.animo + 15) } : s;

        const isNight = isNightTime();
        const isNightAngry = !!(s.nightAngryUntil && Date.now() < s.nightAngryUntil);
        const vs = isNightAngry ? "enfadada"
          : (isNight && !currentAction ? "durmiendo" : computeVisualState(boosted, currentAction ?? undefined));
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, streak, regCtxRef.current));
      })
      .catch(() => {
        const isNight = isNightTime();
        const isNightAngry = !!(stats.nightAngryUntil && Date.now() < stats.nightAngryUntil);
        const vs = isNightAngry ? "enfadada"
          : (isNight && !currentAction ? "durmiendo" : computeVisualState(stats, currentAction ?? undefined));
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, 0, regCtxRef.current));
      });
  }, [currentAction]);

  /* Bienvenida del caracol — una vez por sesión */
  useEffect(() => {
    if (!sessionStorage.getItem("welcomed")) {
      sessionStorage.setItem("welcomed", "1");
      setWelcomePhrase(pickWelcomePhrase());
    }
  }, []);

  /* Sync registro context once on mount */
  useEffect(() => {
    getRegistroContext()
      .then((ctx: RegistroContext) => {
        const illness = getTamaStats().illness;
        regCtxRef.current = {
          tristeza:    ctx.tristeza,
          cacaIllness: illness === "caca" && (ctx.hasConstipation || ctx.hasDiarrhea),
        };
      })
      .catch(() => {});

    syncCacaIllness()
      .then(triggered => { if (triggered) loadTama(); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Temporizador de siesta (30 min) ──────────────────────────────────── */
  const sleepUntilTs = tamaStats?.sleepUntil ?? 0;
  useEffect(() => {
    if (!sleepUntilTs || Date.now() >= sleepUntilTs) {
      setSleepSecondsLeft(0);
      return;
    }
    setVisualState("durmiendo");
    const tick = setInterval(() => {
      const remaining = Math.max(0, (sleepUntilTs - Date.now()) / 1000);
      setSleepSecondsLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(tick);
        const s = wakeUpTama(false);
        setTamaStats({ ...s });
        const vs = computeVisualState(s);
        setVisualState(vs);
        setTamaMessage("¡Mmm, qué rica siesta! 🌟 +10 energía");
        setTimeout(() => setTamaMessage(getContextualMessage(vs, 0)), 3000);
        setEquippedCloth(isNightTime() ? getNightClothing() : getDayClothing());
      }
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepUntilTs]);

  /* ── Temporizador enfado nocturno (5 min) ──────────────────────────────── */
  const nightAngryUntilTs = tamaStats?.nightAngryUntil ?? 0;
  useEffect(() => {
    if (!nightAngryUntilTs || Date.now() >= nightAngryUntilTs) {
      setNightAngrySecondsLeft(0);
      return;
    }
    setVisualState("enfadada");
    setEquippedCloth(getNightClothing());
    const tick = setInterval(() => {
      const remaining = Math.max(0, (nightAngryUntilTs - Date.now()) / 1000);
      setNightAngrySecondsLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(tick);
        nightTapRef.current = 0;
        const s = clearNightAngry();
        setTamaStats({ ...s });
        setVisualState("durmiendo");
        setTamaMessage("Zzz... vuelvo a dormir... 😴💤");
        setEquippedCloth(getNightClothing());
      }
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightAngryUntilTs]);

  useEffect(() => {
    pullFromCloud().finally(() => { loadProfile(); loadEquipped(); loadTama(); });
    const refresh = () => { loadProfile(); loadEquipped(); loadTama(); };
    const onVis   = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadProfile, loadEquipped, loadTama]);

  function triggerAction(action: "comiendo"|"durmiendo"|"jugando", durationMs = 3000) {
    setCurrentAction(action);
    setVisualState(action);
    setTamaMessage(getContextualMessage(action, 0));
    setTimeout(() => {
      setCurrentAction(null);
      const s = getTamaStats(); setTamaStats(s);
      const isNight = isNightTime();
      const vs = isNight ? "durmiendo" : computeVisualState(s);
      setVisualState(vs);
      setTamaMessage(getContextualMessage(vs, 0));
    }, durationMs);
  }

  function handleFeed(foodId: string) {
    const food = FOOD_CATALOG.find(f => f.id === foodId);
    if (!food) return;
    if (!consumeFood(foodId)) return;
    let s;
    if (food.id === "food_pecan" && tamaStats?.isAngry) {
      // Pastel de nuez pecán cura el enfado
      s = cureAngry();
      s = feedTama(food.hambreRestore, 0); // también da hambre restore
      setTamaStats({ ...s });
      triggerAction("comiendo", 2500);
      setTamaMessage("Mmmm... bueno, quizás no estoy tan enfadada 😤🥜");
      setTimeout(() => {
        const vs = computeVisualState(s);
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, 0));
      }, 3000);
      return;
    }
    if (food.curesIllness && tamaStats?.illness === food.curesIllness) {
      s = cureIllness();
      const a = tryUnlock("cured_sick");
      if (a) showAchievement(a);
    } else {
      s = feedTama(food.hambreRestore, food.animoBoost ?? 0);
    }
    setTamaStats(s);
    triggerAction("comiendo", 2500);
    // Posible eructo tras comer 😮‍💨
    const burpMsg = maybeEructo();
    if (burpMsg) {
      setTimeout(() => {
        setTamaMessage(burpMsg);
        setTimeout(() => {
          const s2 = getTamaStats();
          const vs2 = computeVisualState(s2);
          setTamaMessage(getContextualMessage(vs2, 0));
        }, 3200);
      }, 2700); // esperar a que acabe la animación de comer
    }
  }

  function handleMedicineCure() {
    const s = cureIllness();
    setTamaStats(s);
    const a = tryUnlock("cured_sick");
    if (a) showAchievement(a);
    setShowMedicineModal(false);
    const vs = computeVisualState(s);
    setVisualState(vs);
    setTamaMessage("¡Me siento mucho mejor! 💖");
    setTimeout(() => setTamaMessage(getContextualMessage(vs, 0)), 3000);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleMemoryGameFinish(moves: number, _timeSeconds?: number) {
    const animoBoost = moves <= 12 ? 30 : moves <= 16 ? 22 : moves <= 20 ? 14 : moves <= 28 ? 8 : 4;
    const s = getTamaStats();
    s.animo     = Math.min(100, s.animo + animoBoost);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });
    const vs = computeVisualState(s);
    setVisualState(vs);
    setTamaMessage(getContextualMessage(vs, 0));
    setShowMemoryGame(false);
  }

  function handleSleep() {
    if (!tamaStats) return;
    const check = canSleepNow(tamaStats.energia, tamaStats.sleepUntil);
    if (!check.ok) {
      setInfoToast(check.reason ?? "No puede dormir ahora");
      setTimeout(() => setInfoToast(null), 3500);
      return;
    }
    // Poner ropa de noche y arrancar el temporizador
    setEquippedCloth(nightCloth);
    const s = startSleepTimer();
    setTamaStats({ ...s });
    setVisualState("durmiendo");
    setTamaMessage("Zzz... siesta de 30 min 💤 ¡No me despiertes!");
  }

  function handlePlay(toyId: string) {
    const toy = TOY_CATALOG.find(t => t.id === toyId);
    if (!toy || isToyOnCooldown(toyId, toy.cooldownMinutes)) return;
    recordToyUse(toyId);
    const s = playTama(toy.animoBoost); setTamaStats(s);
    triggerAction("jugando", 2500);
  }

  function handleCositas() {
    const left = getCositasLeft();
    if (left <= 0) {
      setInfoToast("Solo 2 cositas al día 🤲 ¡Vuelve mañana!");
      setTimeout(() => setInfoToast(null), 3000);
      return;
    }
    // Gastar una cosita
    const today = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem("sq_cositas_date",  today);
      localStorage.setItem("sq_cositas_count", String(3 - left)); // 3-left = used count +1
    } catch { /* noop */ }
    setCositasLeft(left - 1);

    // Curar enfado de cualquier tipo
    let s = getTamaStats();
    if (s.isAngry)        s = cureAngry();
    if (s.nightAngryUntil) s = clearNightAngry();
    s.animo = Math.min(100, s.animo + 25);
    s.salud = Math.min(100, (s.hambre + s.energia + s.animo) / 3);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });

    unlockAudio();
    playCositas();
    setIsTickling(true);
    setVisualState("muy_feliz");

    const msgs = [
      "¡Aaaaaah las cositas! 😍💆 ¡Más, más!",
      "¡Justo ahí! ¡Justo ahíiiii! 🥰✨",
      "¡Las cositas me curan el alma! 💖",
      "¡No pares nunca jamás! 😌🌟",
      "¡Esto es lo mejor del mundoooo! 🥹✨",
      "¡Mis lugares secretos de mimos! 🫶💛",
      "¡Me derrito de felicidad! 😩💗",
    ];
    setTamaMessage(msgs[Math.floor(Math.random() * msgs.length)]);

    setTimeout(() => {
      setIsTickling(false);
      const fresh = getTamaStats();
      const isNight = isNightTime();
      const vs = isNight && !fresh.sleepUntil ? "durmiendo" : computeVisualState(fresh);
      setVisualState(vs);
      setTamaMessage(getContextualMessage(vs, 0));
    }, 4000);
  }

  function handleFartButton() {
    if (fartCooldown) return;
    unlockAudio();
    playFartRandom();
    setFartCooldown(true);
    const msgs = [
      "💨 ¡AQUÍ VIENE ESTE PEDO QUE ME GUARDO DESDE LOS 7 AÑOS!!!",
      "💨 Este pedo va dedicado a mi familiaaaaaa 🌿❤️",
      "💨 ¡Lo prometí y lo cumplo! Un pedo para cada árbol del bosque 🌳",
      "💨 ¡LIBERTAD! Llevaba horas aguantando esto 😤💨",
      "💨 Dedicado a todas las bellotas que me han hecho esto 🌰💨",
      "💨 El bosque preguntó: '¿quién ha sido?' Yo: 😇",
      "💨 Este pedo lleva nombre propio. Se llama: Jueves 💨",
      "💨 Años de entrenamiento para esto. Vale cada segundo 😤",
      "💨 ¡PARA EL BOSQUE, ESTE PEDO PARA TIIIII! 🌿💨",
      "💨 El caracol lo huele desde 3 árboles 🐌😵",
      "💨 *PRRFFRT* …¿Qué miras? 😤",
      "💨 No es un pedo, es un abrazo de olfato 😏",
      "💨 Ardilla 1 — Decoro 0 😎",
      "💨 ¡DEDICADO A TODOS MIS ENEMIGOS! 💪💨",
      "💨 El viento del bosque… soy yo 🍃",
      "💨 Esto es arte. Arte aromático. 🎨💨",
      "💨 Mi abuela me enseñó a aguantar. Hoy la fallo. 😔💨",
      "💨 ¡Lo tenía guardado desde el desayuno! 🌰💨",
      "💨 Las bellotas cobran… siempre cobran 🌰🫣",
      "💨 Que conste en acta: yo no he sido 😇📋",
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    const prevVs = visualState;
    setVisualState("pedos");
    setTamaMessage(msg);
    setTimeout(() => {
      setVisualState(prevVs);
      setTamaMessage(getContextualMessage(prevVs, 0));
      setFartCooldown(false);
    }, 3000);
  }

  function handleBurpButton() {
    if (burpCooldown) return;
    unlockAudio();
    playBurpRandom();
    setBurpCooldown(true);
    const msgs = [
      "¡ESTE ERUCTO LO DEDICO A MI FAMILIAAAAA! 😮‍💨❤️🌳",
      "¡PARA EL BOSQUEEEEE, ESTE ERUCTO PARA TIIIII! 😮‍💨🌳",
      "¡BUAAARP! ¿Alguien tiene un micrófono? 🎤😤",
      "¡Este eructo lleva fermento de bellota de 3 años! 🌰😮‍💨",
      "¡B-U-A-A-A-R-P! Una obra maestra del arte contemporáneo 🎨",
      "¡¡BUAAARP!! El árbol más alto del bosque se ha enterado 🌲",
      "¡Eructo oficial del bosque! Certificado y sellado 🏆😮‍💨",
      "¡DEDICADO A QUIEN YO SÉ! 😤 ¡BUAAARP!",
      "¡El caracol ha salido volando! 🐌💨 ¡Vuelve!",
      "¡BEEEELCH! Alguien aplauda, por favor 🫡👏",
      "¡Este era el eructo del destino! Estaba escrito 📜😮‍💨",
      "¡Lo he estado practicando toda la mañana! 💪😤",
      "¡BUAAARP! Y lo volvería a hacer. Sin arrepentimiento 😎",
      "Para mi madre, con todo mi amor y mis gases 💕😮‍💨",
      "¡El bosque entero ha temblado! Misión cumplida 🌿✅",
      "¡ESTO ES LO QUE PASA CUANDO ME DAN BELLOTAS! 🌰😤",
      "Dicen que los grandes artistas sufren. Yo sufro de eructos 🎭",
      "¡Le he dado nombre: se llama Rodrigo! 😤 ¡BUAAARP!",
      "¡Eructo de campeonato mundial! Nuevo récord personal 🥇",
      "¡El caracol aplaude desde lejos! 🐌👏 ¡Mucho lejos!",
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    const prevVs = visualState;
    setVisualState("eructando");
    setTamaMessage(msg);
    setTimeout(() => {
      setVisualState(prevVs);
      setTamaMessage(getContextualMessage(prevVs, 0));
      setBurpCooldown(false);
    }, 2500);
  }

  /* Tap directly on the squirrel */
  function tapSquirrel() {
    unlockAudio(); // desbloquea AudioContext en iOS en el primer gesto
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter(t => now - t < 2000), now];

    /* Si está en el enfado nocturno: ignorar toques */
    const isNightAngry = !!(tamaStats?.nightAngryUntil && Date.now() < (tamaStats.nightAngryUntil ?? 0));
    if (isNightAngry) return;

    /* Si está durmiendo la siesta: 5 toques = se despierta furiosa */
    const sleeping = !!(tamaStats?.sleepUntil && Date.now() < (tamaStats.sleepUntil ?? 0));
    if (sleeping) {
      if (tapTimesRef.current.length >= 5) {
        tapTimesRef.current = [];
        const s = wakeUpTama(true);
        setTamaStats({ ...s });
        setVisualState("enfadada");
        setEquippedCloth(isNightTime() ? getNightClothing() : getDayClothing());
        setTamaMessage("¡¡¡ME HAN DESPERTADO!!! 😡🔥 ¡Dame el pastel de nuez pecán!");
        setTimeout(() => {
          const vs = computeVisualState(s);
          setVisualState(vs);
          setTamaMessage(getContextualMessage(vs, 0));
        }, 4000);
      }
      return; // no hacer más cosas mientras duerme
    }

    /* Si está durmiendo de noche (22h–8h): 5 toques = enfado nocturno 5 min */
    const isNight = isNightTime();
    if (isNight && !tamaStats?.sleepUntil) {
      nightTapRef.current += 1;
      const taps = nightTapRef.current;
      if (taps === 3) {
        setTamaMessage("⚠️ ¡Para! Si sigues tocando se despertará muy enfadada 😤");
      } else if (taps === 4) {
        setTamaMessage("🔥 ¡UN TOQUE MÁS Y SE DESPIERTA FURIOSA! 😡");
      } else if (taps >= 5) {
        nightTapRef.current = 0;
        tapTimesRef.current = [];
        const s = wakeUpAngryNight();
        setTamaStats({ ...s });
        setVisualState("enfadada");
        setEquippedCloth(getNightClothing());
        setTamaMessage("¡¡¡CÓMO OSAS DESPERTARME!!! 😡🔥 ¡5 MINUTOS SIN HABLARME!");
      }
      return; // no hacer más cosas mientras duerme de noche
    }

    /* Small animo boost */
    const s = getTamaStats();
    s.animo = Math.min(100, s.animo + 2);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });

    /* Evolution tap record + achievements */
    const { totalTaps } = recordTap();
    const ach1 = tryUnlock("first_tap");
    if (ach1) showAchievement(ach1);
    if (totalTaps >= 50)  { const a = tryUnlock("tap_50");  if (a) showAchievement(a); }
    if (totalTaps >= 200) { const a = tryUnlock("tap_200"); if (a) showAchievement(a); }

    /* Tickle: 5 rapid taps */
    if (tapTimesRef.current.length >= 5) {
      tapTimesRef.current = [];
      setIsTickling(true);
      setVisualState("muy_feliz");
      const a = tryUnlock("tickle");
      if (a) showAchievement(a);
      setTimeout(() => {
        setIsTickling(false);
        const fresh = getTamaStats();
        const vs = computeVisualState(fresh);
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, 0));
      }, 1500);
    }
  }

  function handleMiniGameFinish(score: number) {
    const animoBoost = score >= 20 ? 40 : score >= 15 ? 30 : score >= 10 ? 20 : score >= 5 ? 10 : 3;
    const s = getTamaStats();
    s.animo = Math.min(100, s.animo + animoBoost);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });
    const vs = computeVisualState(s);
    setVisualState(vs);
    setTamaMessage(getContextualMessage(vs, 0));
    if (score >= 10) { const a = tryUnlock("minigame_5");   if (a) showAchievement(a); }
    if (score >= 20) { const a = tryUnlock("minigame_pro"); if (a) showAchievement(a); }
    setShowMiniGame(false);
  }

  async function handleSopaFinish(foundCount: number) {
    const bonus = foundCount >= 4 ? 30 : foundCount >= 3 ? 20 : foundCount >= 2 ? 10 : 5;
    const s = getTamaStats();
    s.animo = Math.min(100, s.animo + 15);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s); setTamaStats({ ...s });
    setVisualState(computeVisualState(s));
    setTamaMessage(getContextualMessage(computeVisualState(s), 0));
    try {
      const p = await import("@/lib/db").then(m => m.getPlayerProfile());
      await import("@/lib/db").then(m => m.upsertPlayerProfile({ bellotas: p.bellotas + bonus }));
      setBellotas(p.bellotas + bonus);
    } catch { /* noop */ }
    { const a = tryUnlock("memory_any"); if (a) showAchievement(a); }
    setShowSopaLetras(false);
  }

  function handleEquipAvatar(id: string | null) {
    setEquippedAvatar(id); setEquippedAvatarState(id);
  }
  function handleEquipTitulo(id: string | null) {
    setEquippedTitulo(id); setEquippedTituloIdState(id);
    if (id) { const found = ownedTitulos.find(t => t.id === id); setTituloText(found?.text ?? null); }
    else setTituloText(null);
  }

  const { level, currentXp, nextLevelXp, progress } = getLevelInfo(xp);
  const equippedAvatarItem = avatarItems.find(a => a.id === equippedAvatar) ?? null;
  const heldToyEmoji = equippedToyId
    ? TOY_CATALOG.find(t => t.id === equippedToyId)?.emoji ?? undefined
    : undefined;
  const totalEquipped = Object.keys(equippedCloth).length + (equippedToyId ? 1 : 0);

  const foodInv = getFoodInventory();
  const foodItems = FOOD_CATALOG.map(f => ({
    id: f.id, emoji: f.emoji, name: f.name,
    desc: `+${f.hambreRestore} hambre${f.animoBoost ? ` +${f.animoBoost} ánimo` : ""} · tienes ${foodInv[f.id] ?? 0}`,
    disabled: (foodInv[f.id] ?? 0) === 0,
  }));

  const ownedToyIds = getOwnedToys();
  const toyItems = TOY_CATALOG.filter(t => ownedToyIds.includes(t.id)).map(t => {
    const cd = isToyOnCooldown(t.id, t.cooldownMinutes);
    return {
      id: t.id, emoji: t.emoji, name: t.name,
      desc: `+${t.animoBoost} ánimo`,
      disabled: cd,
      badge: cd ? `enfriando…` : undefined,
    };
  });

  const phaseInfo = PHASE_INFO[evolutionPhase];

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      {/* Achievement toast */}
      {achToast && <AchievementToast ach={achToast}/>}

      {/* Info toast (ej. no puede dormir) */}
      {infoToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl max-w-[80vw] text-center leading-snug">
          {infoToast}
        </div>
      )}

      {/* ── Perfil ── */}
      <div className="shrink-0 px-4 pt-4">
        <div className="bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-3">
          <button onClick={() => { loadEquipped(); setShowModal(true); }}
            className="shrink-0 relative w-12 h-12 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-teal-100 border-2 border-teal-300 overflow-hidden flex items-center justify-center text-2xl shadow-sm">
              {equippedAvatarItem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={equippedAvatarItem.img64} alt="avatar" className="w-full h-full object-cover"/>
              ) : (
                <span className="text-2xl">🐿️</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] shadow-sm">✏️</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-extrabold text-slate-700 shrink-0">Vicky</span>
                {tituloText && <span className="text-[10px] font-bold text-violet-500 truncate">· {tituloText}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">🌰 {loaded ? bellotas : "—"}</span>
                <Link href="/opciones" className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-base active:scale-95 transition-all" title="Ajustes">⚙️</Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[9px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded-full">Nv.{level}</span>
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700" style={{ width:`${Math.max(progress*100,3)}%` }}/>
              </div>
              <span className="shrink-0 text-[9px] text-slate-400">{loaded?`${currentXp}/${nextLevelXp}`:"—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Escena ── */}
      <div className="flex-1 min-h-0 px-4 py-2">
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border border-white/20">
          <div className="absolute inset-0"><SceneBg seg={timeSegment}/></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{ backgroundImage:"radial-gradient(circle,rgba(0,0,0,1) 1px,transparent 1px)", backgroundSize:"3px 3px" }}/>
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ boxShadow:"inset 0 0 60px rgba(0,0,0,0.35)" }}/>

          {/* Top icons — izquierda: misiones + logros + estadísticas + árbol */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            <button onClick={() => setShowMisiones(true)}
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">📋</span>
            </button>
            <Link href="/logros"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">🏆</span>
            </Link>
            <Link href="/estadisticas"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">📊</span>
            </Link>
            <Link href="/arbol"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">🌳</span>
            </Link>
            <button onClick={() => setShowGameStats(true)}
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">🎮</span>
            </button>
          </div>

          {/* Evolution phase badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/20">
            <span className="text-xs">{phaseInfo.emoji}</span>
            <span className="text-[10px] font-bold text-white">{phaseInfo.label}</span>
          </div>

          {/* Top icons — derecha: tienda + armario */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
            <Link href="/tienda"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">🛒</span>
              {loaded && <span className="text-[10px] font-bold text-white">{bellotas}🌰</span>}
            </Link>
            <Link href="/armario"
              className="relative flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full p-2 active:scale-95 border border-white/20">
              <HangerIcon className="w-[18px] h-[14px] text-white"/>
              {totalEquipped > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-pink-500 rounded-full text-[8px] font-extrabold text-white flex items-center justify-center px-1 shadow-sm">
                  {totalEquipped}
                </span>
              )}
            </Link>
          </div>

          {/* Chibi + greeting + bubble */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 pt-8 pb-3">
            <div className="text-center mb-0.5">
              <h1 className="text-xl font-extrabold text-white tracking-tight"
                style={{ textShadow:"0 2px 12px rgba(0,0,0,0.6)" }}>¡Hola, Vicky!</h1>
              <p className="text-white/85 text-[11px] font-semibold"
                style={{ textShadow:"0 1px 6px rgba(0,0,0,0.5)" }}>{greeting()}</p>
            </div>

            {/* Squirrel + 3 iconos laterales */}
            <div className="flex items-center gap-2">

              {/* Izquierda: 🍑 pedo */}
              <button
                onClick={handleFartButton}
                className={`flex flex-col items-center gap-0.5 transition-all duration-150 active:scale-90 ${fartCooldown ? "opacity-25 pointer-events-none" : ""}`}>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/35 flex items-center justify-center shadow-lg">
                  <span className="text-2xl select-none">🍑</span>
                </div>
                <span className="text-white/75 text-[8px] font-extrabold tracking-wide drop-shadow">PEDO</span>
              </button>

              {/* Centro: ardilla */}
              <button
                onClick={tapSquirrel}
                className="active:scale-95 transition-transform duration-75 focus:outline-none"
                style={{ background: "none", border: "none", padding: 0 }}>
                <ChibiArdilla
                  state={visualState}
                  phase={evolutionPhase}
                  equipped={equippedCloth}
                  catalog={CLOTHING_CATALOG}
                  isTickling={isTickling}
                  illnessType={tamaStats?.illness ?? undefined}
                  heldToyEmoji={heldToyEmoji}
                  className="drop-shadow-2xl"
                />
              </button>

              {/* Derecha: 🤲 cositas (arriba) + 👄 eructo (abajo) */}
              <div className="flex flex-col items-center gap-2">

                {/* 🤲 Cositas */}
                <button
                  onClick={handleCositas}
                  className="flex flex-col items-center gap-0.5 transition-all duration-150 active:scale-90">
                  <div className={`w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center shadow-lg transition-all ${
                    cositasLeft === 0
                      ? "bg-white/10 border-white/15 opacity-30 pointer-events-none"
                      : "bg-white/20 border-white/35"
                  }`}>
                    <span className="text-2xl select-none">🤲</span>
                  </div>
                  <span className="text-white/75 text-[8px] font-extrabold tracking-wide drop-shadow">
                    {cositasLeft > 0 ? `COSITAS ×${cositasLeft}` : "MAÑANA"}
                  </span>
                </button>

                {/* 👄 Eructo */}
                <button
                  onClick={handleBurpButton}
                  className={`flex flex-col items-center gap-0.5 transition-all duration-150 active:scale-90 ${burpCooldown ? "opacity-25 pointer-events-none" : ""}`}>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/35 flex items-center justify-center shadow-lg">
                    <span className="text-2xl select-none">👄</span>
                  </div>
                  <span className="text-white/75 text-[8px] font-extrabold tracking-wide drop-shadow">ERUCTO</span>
                </button>

              </div>
            </div>

            {/* Speech bubble */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-lg border border-white/60 max-w-[210px]">
              <p className="text-center text-xs font-semibold text-slate-700 leading-snug">
                {tamaMessage || "..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats (outside the scene) ── */}
      {tamaStats && (
        <div className="shrink-0 px-4 py-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/60 shadow-sm">
            <StatsRow stats={tamaStats} evoPhase={evolutionPhase} nightAngrySecondsLeft={nightAngrySecondsLeft} onOpenMedicine={() => setShowMedicineModal(true)}/>
          </div>
        </div>
      )}

      {/* ── Acción (outside the scene) ── */}
      <div className="shrink-0 px-4 pb-1 flex gap-2">
        <button onClick={() => { unlockAudio(); setShowFeedPanel(true); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 rounded-2xl shadow-sm active:scale-95 transition-transform">
          <span className="text-base">🍎</span>
          <span className="text-xs font-bold text-white">Comer</span>
        </button>
        {(() => {
          const isNightAngryNow = !!(tamaStats?.nightAngryUntil && Date.now() < (tamaStats.nightAngryUntil ?? 0));
          if (isNightAngryNow) {
            const mm = String(Math.floor(nightAngrySecondsLeft / 60)).padStart(2,"0");
            const ss = String(nightAngrySecondsLeft % 60).padStart(2,"0");
            return (
              <div className="flex-1 flex flex-col items-center justify-center py-2 rounded-2xl bg-red-900/80 border border-red-400/40"
                style={{ animation: "badge-pulse 1s ease-in-out infinite" }}>
                <span className="text-base">😡</span>
                <span className="text-[11px] font-bold text-red-200 leading-tight">{mm}:{ss}</span>
                <span className="text-[8px] text-red-300/70">🔥 furiosa</span>
              </div>
            );
          }
          const isSleepingNow = !!(tamaStats?.sleepUntil && Date.now() < (tamaStats.sleepUntil ?? 0));
          if (isSleepingNow) {
            const mm = String(Math.floor(sleepSecondsLeft / 60)).padStart(2,"0");
            const ss = String(sleepSecondsLeft % 60).padStart(2,"0");
            return (
              <div className="flex-1 flex flex-col items-center justify-center py-2 rounded-2xl bg-indigo-900/80 border border-indigo-400/40">
                <span className="text-base">💤</span>
                <span className="text-[11px] font-bold text-indigo-200 leading-tight">{mm}:{ss}</span>
                <span className="text-[8px] text-indigo-300/70">🤫 no toques</span>
              </div>
            );
          }
          /* Durante el sueño nocturno (sin siesta), mostrar durmiendo */
          if (isNightTime() && !tamaStats?.sleepUntil) {
            return (
              <div className="flex-1 flex flex-col items-center justify-center py-2 rounded-2xl bg-indigo-900/60 border border-indigo-400/30">
                <span className="text-base">🌙</span>
                <span className="text-[11px] font-bold text-indigo-200 leading-tight">Durmiendo</span>
                <span className="text-[8px] text-indigo-300/60">no la despiertes</span>
              </div>
            );
          }
          const sleepCheck = tamaStats ? canSleepNow(tamaStats.energia, tamaStats.sleepUntil) : { ok: false };
          const canSleep   = sleepCheck.ok;
          const pulseAnim  = tamaStats?.badSleep && canSleep;
          return (
            <button onClick={handleSleep}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl shadow-sm transition-all ${
                canSleep
                  ? pulseAnim
                    ? "bg-indigo-600 ring-2 ring-indigo-300 ring-offset-1 active:scale-95"
                    : "bg-indigo-500 active:scale-95"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
              style={pulseAnim ? { animation: "badge-pulse 1.5s ease-in-out infinite" } : {}}>
              <span className="text-base">😴</span>
              <span className="text-xs font-bold text-white leading-tight">Dormir</span>
              {!canSleep && tamaStats && tamaStats.energia >= 50 && (
                <span className="text-[8px] text-white/70 leading-none">E≥50</span>
              )}
            </button>
          );
        })()}
        <button onClick={() => setShowPlayPanel(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 rounded-2xl shadow-sm active:scale-95 transition-transform">
          <span className="text-base">🎾</span>
          <span className="text-xs font-bold text-white">Jugar</span>
        </button>
      </div>

      {/* ── Botones ── */}
      <div className="shrink-0 px-4 pb-5 grid grid-cols-3 gap-2">
        <Link href="/registro" className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/80 border border-teal-200 text-teal-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-base">✏️</span> Registro
        </Link>
        <Link href="/formaciones" className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/80 border border-violet-200 text-violet-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-base">🎓</span> Ejercicios
        </Link>
        <Link href="/informacion" className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/80 border border-amber-200 text-amber-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-base">ℹ️</span> Info
        </Link>
      </div>

      {/* ── Modales ── */}
      {showModal && (
        <AvatarModal onClose={() => setShowModal(false)}
          avatarItems={avatarItems} ownedIds={ownedIds}
          ownedTitulos={ownedTitulos}
          equippedAvatar={equippedAvatar} equippedTituloId={equippedTituloId}
          onEquipAvatar={handleEquipAvatar} onEquipTitulo={handleEquipTitulo}/>
      )}
      {showMisiones && <MisionesModal onClose={() => setShowMisiones(false)}/>}
      {showFeedPanel && (
        <ActionPanel title="¿Qué le damos de comer?" items={foodItems}
          onSelect={handleFeed} onClose={() => setShowFeedPanel(false)}/>
      )}
      {showPlayPanel && (
        <ActionPanel
          title="¿Con qué jugamos?"
          items={toyItems}
          onSelect={handlePlay}
          onClose={() => setShowPlayPanel(false)}
          extraActions={[
            { label: "¡Atrapa bellotas!", emoji: "🌰", onClick: () => setShowMiniGame(true) },
            { label: "Memoria animal",    emoji: "🃏", onClick: () => setShowMemoryGame(true) },
            { label: "Sopa de letras",    emoji: "🔤", onClick: () => setShowSopaLetras(true) },
            { label: "Mayor o Menor",     emoji: "🎴", onClick: () => setShowMayorMenor(true) },
            { label: "Carrera del Bosque", emoji: "🏁", onClick: () => setShowAnimalRace(true) },
            { label: "Tres en Raya",      emoji: "🐿️", onClick: () => setShowTresEnRaya(true) },
            { label: "Conecta 4",         emoji: "🌰", onClick: () => setShowConecta4(true) },
          ]}
        />
      )}
      {showMiniGame && (
        <TamaMiniGame
          onFinish={handleMiniGameFinish}
          onClose={() => setShowMiniGame(false)}
        />
      )}
      {showMemoryGame && (
        <MemoryCardGame
          onFinish={handleMemoryGameFinish}
          onClose={() => setShowMemoryGame(false)}
        />
      )}
      {showSopaLetras && (
        <SopaDeLetras
          onFinish={handleSopaFinish}
          onClose={() => setShowSopaLetras(false)}
        />
      )}
      {showMayorMenor && (
        <MayorMenorGame
          onClose={() => setShowMayorMenor(false)}
        />
      )}
      {showAnimalRace && (
        <AnimalRaceGame
          onClose={() => setShowAnimalRace(false)}
        />
      )}
      {showTresEnRaya && (
        <TresEnRayaGame
          onClose={() => setShowTresEnRaya(false)}
        />
      )}
      {showConecta4 && (
        <Conecta4Game
          onClose={() => setShowConecta4(false)}
        />
      )}
      {showGameStats && (
        <GameStatsModal onClose={() => setShowGameStats(false)} />
      )}
      {showMedicineModal && tamaStats?.illness && (
        <MedicineModal
          illness={tamaStats.illness}
          onCure={handleMedicineCure}
          onClose={() => setShowMedicineModal(false)}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
        @keyframes snail-bounce {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-10px) rotate(4deg); }
        }
        @keyframes welcome-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes badge-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.65; }
        }
      `}</style>

      {/* Aviso: ítem de sueño roto */}
      {brokenSleepItems.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          style={{ background: "rgba(2,6,23,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setBrokenSleepItems([])}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl px-7 pt-8 pb-6 max-w-xs w-full text-center flex flex-col items-center gap-3"
            style={{ animation: "welcome-in 0.35s cubic-bezier(.34,1.56,.64,1) both" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl leading-none">💔</div>
            <div>
              <p className="text-sm font-extrabold text-slate-700 mb-1">
                {brokenSleepItems.length > 1 ? "¡Se han roto unos objetos!" : "¡Se ha roto un objeto!"}
              </p>
              <p className="text-xs text-slate-500 leading-snug">
                {brokenSleepItems.join(", ")} se {brokenSleepItems.length > 1 ? "han" : "ha"} desgastado tras 10 noches. Cómpra{brokenSleepItems.length > 1 ? "los" : "lo"} de nuevo en la tienda.
              </p>
            </div>
            <Link href="/tienda" onClick={() => setBrokenSleepItems([])}
              className="w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm active:scale-95 transition-transform shadow-md">
              Ir a la tienda 🛒
            </Link>
            <button onClick={() => setBrokenSleepItems([])} className="text-xs text-slate-400 font-semibold">
              Ahora no
            </button>
          </div>
        </div>
      )}

      {/* Modal bienvenida del caracol */}
      {welcomePhrase && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          style={{ background: "rgba(2,6,23,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setWelcomePhrase(null)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl px-7 pt-8 pb-7 max-w-xs w-full text-center flex flex-col items-center gap-4"
            style={{ animation: "welcome-in 0.35s cubic-bezier(.34,1.56,.64,1) both" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Caracol animado */}
            <div style={{ animation: "snail-bounce 1.4s ease-in-out infinite" }}
              className="text-[80px] leading-none drop-shadow-lg select-none">
              🐌
            </div>

            <div>
              <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-1">
                ¡Hola, Vicky!
              </p>
              <p className="text-sm font-semibold text-slate-700 leading-snug">
                {welcomePhrase}
              </p>
            </div>

            <button
              onClick={() => setWelcomePhrase(null)}
              className="mt-1 w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              ¡Gracias, caracol! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
