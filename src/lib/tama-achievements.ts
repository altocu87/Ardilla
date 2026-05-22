import { pushToCloud } from "./cloudsync";

// ── Categorías ────────────────────────────────────────────────────────────────
export type AchievementCategory =
  | "ardilla"
  | "registros"
  | "caca"
  | "emocional"
  | "racha"
  | "tienda"
  | "nivel"
  | "especial";

export const CATEGORY_INFO: Record<
  AchievementCategory,
  { label: string; emoji: string; bg: string; border: string; text: string }
> = {
  ardilla:   { label: "Ardilla",   emoji: "🐿️", bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700"  },
  registros: { label: "Registros", emoji: "📝",  bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
  caca:      { label: "Caca 💩",   emoji: "💩",  bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  emocional: { label: "Emocional", emoji: "💜",  bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  racha:     { label: "Rachas",    emoji: "🔥",  bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"    },
  tienda:    { label: "Tienda",    emoji: "🛍️",  bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
  nivel:     { label: "Nivel",     emoji: "⬆️",  bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700"    },
  especial:  { label: "Especial",  emoji: "✨",  bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-700"   },
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  category: AchievementCategory;
  rewardBellotas: number;
  rewardClothingId?: string;
  rewardTituloId?: string;
  rewardDesc?: string;
  secret?: boolean;
};

export type AchievementState = {
  unlocked: string[];
  timestamps?: Record<string, string>; // id → ISO datetime
};

// ── Los 105 logros ────────────────────────────────────────────────────────────
export const ALL_ACHIEVEMENTS: Achievement[] = [

  // ════════════════════════════════ ARDILLA (20) ════════════════════════════════
  {
    id: "first_tap", emoji: "🤝", title: "¡Hola!", category: "ardilla",
    desc: "Primera caricia a la ardilla", rewardBellotas: 5,
  },
  {
    id: "tap_50", emoji: "💖", title: "Muy cariñosa", category: "ardilla",
    desc: "50 caricias acumuladas", rewardBellotas: 15,
  },
  {
    id: "tap_200", emoji: "💝", title: "Amor sin límites", category: "ardilla",
    desc: "200 caricias acumuladas", rewardBellotas: 30,
  },
  {
    id: "tap_500", emoji: "🫶", title: "Manos llenas de amor", category: "ardilla",
    desc: "500 caricias acumuladas", rewardBellotas: 50,
    rewardClothingId: "cloth_gafas_r", rewardDesc: "🎁 Gafas rosas para la ardilla",
  },
  {
    id: "tap_1000", emoji: "💞", title: "Amor eterno", category: "ardilla",
    desc: "1000 caricias acumuladas", rewardBellotas: 75,
    rewardClothingId: "cloth_lazo", rewardDesc: "🎁 Lazo rosa para la ardilla",
  },
  {
    id: "week_care", emoji: "🎉", title: "Una semana juntas", category: "ardilla",
    desc: "7 días con estadísticas saludables", rewardBellotas: 25,
  },
  {
    id: "days_15", emoji: "🌿", title: "Quince días", category: "ardilla",
    desc: "15 días cuidando a la ardilla", rewardBellotas: 35,
  },
  {
    id: "month_care", emoji: "🏆", title: "Un mes increíble", category: "ardilla",
    desc: "30 días cuidando bien a la ardilla", rewardBellotas: 100,
    rewardClothingId: "cloth_corona", rewardDesc: "🎁 Corona dorada para la ardilla",
  },
  {
    id: "good_night_3", emoji: "🌙", title: "Buenas noches", category: "ardilla",
    desc: "3 noches sin despertar a la ardilla", rewardBellotas: 15,
  },
  {
    id: "good_night_7", emoji: "🌟", title: "Guardiana nocturna", category: "ardilla",
    desc: "7 noches sin despertar a la ardilla", rewardBellotas: 40,
    rewardClothingId: "cloth_bufanda", rewardDesc: "🎁 Bufanda roja para la ardilla",
  },
  {
    id: "tickle", emoji: "😂", title: "¡Cosquillas!", category: "ardilla",
    desc: "Le hiciste cosquillas a la ardilla", rewardBellotas: 5,
  },
  {
    id: "cured_sick", emoji: "💊", title: "¡Curada!", category: "ardilla",
    desc: "Curaste el dolor de barriga con probióticos", rewardBellotas: 10,
  },
  {
    id: "grew_up", emoji: "✨", title: "¡Ha crecido!", category: "ardilla",
    desc: "La ardilla llegó a la fase Joven", rewardBellotas: 20,
  },
  {
    id: "adult", emoji: "🌟", title: "Ardilla adulta", category: "ardilla",
    desc: "La ardilla llegó a la fase Adulta", rewardBellotas: 50,
    rewardClothingId: "cloth_jersey", rewardDesc: "🎁 Jersey verde para la ardilla",
  },
  {
    id: "wise", emoji: "🦉", title: "Anciana sabia", category: "ardilla",
    desc: "La ardilla llegó a la fase Anciana", rewardBellotas: 150,
    rewardClothingId: "cloth_sombrero", rewardTituloId: "dt15",
    rewardDesc: "🎁 Sombrero hongo + título 🧠 Sabia de la calma",
  },
  {
    id: "minigame_5", emoji: "🎯", title: "Buena puntería", category: "ardilla",
    desc: "10+ bellotas atrapadas en el mini-juego", rewardBellotas: 10,
  },
  {
    id: "minigame_pro", emoji: "🎖️", title: "Maestra bellotera", category: "ardilla",
    desc: "20+ bellotas atrapadas en el mini-juego", rewardBellotas: 25,
    rewardClothingId: "cloth_gafas", rewardDesc: "🎁 Gafas de sol para la ardilla",
  },
  {
    id: "never_hungry", emoji: "🌰", title: "Bien alimentada", category: "ardilla",
    desc: "3 días sin que el hambre llegue a 0", rewardBellotas: 35,
  },
  {
    id: "all_food", emoji: "🍽️", title: "Cocinera del bosque", category: "ardilla",
    desc: "Probó toda la comida de la tienda", rewardBellotas: 30,
  },
  {
    id: "all_toys", emoji: "🎮", title: "Juguetona empedernida", category: "ardilla",
    desc: "Jugó con todos los juguetes de la ardilla", rewardBellotas: 20,
  },

  // ════════════════════════════════ REGISTROS (15) ══════════════════════════════
  {
    id: "first_diario", emoji: "📝", title: "Primer paso", category: "registros",
    desc: "Tu primer registro diario", rewardBellotas: 5,
  },
  {
    id: "diario_5", emoji: "⭐", title: "Empezando bien", category: "registros",
    desc: "5 registros diarios completados", rewardBellotas: 10,
  },
  {
    id: "diario_10", emoji: "🌟", title: "10 registros", category: "registros",
    desc: "10 registros completados", rewardBellotas: 20,
  },
  {
    id: "diario_25", emoji: "🎯", title: "Constancia real", category: "registros",
    desc: "25 registros completados", rewardBellotas: 35,
  },
  {
    id: "diario_50", emoji: "🏅", title: "Medio centenar", category: "registros",
    desc: "50 registros completados", rewardBellotas: 60,
    rewardTituloId: "dt09", rewardDesc: "🎁 Título 🎯 Maestra del registro",
  },
  {
    id: "diario_100", emoji: "💯", title: "Centenaria", category: "registros",
    desc: "100 registros completados", rewardBellotas: 100,
    rewardClothingId: "cloth_bufanda_b", rewardDesc: "🎁 Bufanda azul para la ardilla",
  },
  {
    id: "diario_200", emoji: "🌈", title: "200 y contando", category: "registros",
    desc: "200 registros completados", rewardBellotas: 150,
  },
  {
    id: "diario_365", emoji: "📅", title: "Un año de bienestar", category: "registros",
    desc: "365 registros completados", rewardBellotas: 300,
    rewardTituloId: "dt20", rewardDesc: "🎁 Título 🏅 Leyenda de la Tranquilidad",
  },
  {
    id: "morning_reg", emoji: "☀️", title: "Madrugadora", category: "registros",
    desc: "Registro antes de las 9 de la mañana", rewardBellotas: 10,
  },
  {
    id: "night_reg", emoji: "🌙", title: "Búho nocturno", category: "registros",
    desc: "Registro después de las 22 horas", rewardBellotas: 10,
  },
  {
    id: "early_bird", emoji: "🌅", title: "Alba madrugadora", category: "registros",
    desc: "Registro antes de las 6 de la mañana", rewardBellotas: 25,
    secret: true,
  },
  {
    id: "diario_weekend", emoji: "🏖️", title: "Fin de semana activa", category: "registros",
    desc: "Registros el sábado Y el domingo del mismo fin de semana", rewardBellotas: 20,
  },
  {
    id: "diario_lunes", emoji: "😤", title: "Contra el lunes", category: "registros",
    desc: "5 registros en lunes", rewardBellotas: 15,
  },
  {
    id: "all_types_day", emoji: "🎪", title: "Día completo", category: "registros",
    desc: "Registros diario, caca y emocional el mismo día", rewardBellotas: 30,
  },
  {
    id: "wellbeing_30", emoji: "📆", title: "Mes dedicada", category: "registros",
    desc: "Al menos 20 registros en un mismo mes", rewardBellotas: 50,
  },

  // ════════════════════════════════ CACA (11) ═══════════════════════════════════
  {
    id: "first_caca", emoji: "💩", title: "Primera caca", category: "caca",
    desc: "Primer registro de caca", rewardBellotas: 5,
  },
  {
    id: "caca_5", emoji: "🚽", title: "Cinco cacas", category: "caca",
    desc: "5 registros de caca", rewardBellotas: 10,
  },
  {
    id: "caca_20", emoji: "🧻", title: "Veinte cacas", category: "caca",
    desc: "20 registros de caca", rewardBellotas: 20,
  },
  {
    id: "caca_50", emoji: "🎊", title: "Cincuenta cacas", category: "caca",
    desc: "50 registros de caca. ¡Impresionante!", rewardBellotas: 40,
  },
  {
    id: "caca_100", emoji: "🥇", title: "Centenaria de cacas", category: "caca",
    desc: "100 registros de caca. Leyenda.", rewardBellotas: 80,
    rewardTituloId: "dt07", rewardDesc: "🎁 Título 🌙 Soñadora consciente",
  },
  {
    id: "caca_streak_7", emoji: "📈", title: "Racha intestinal", category: "caca",
    desc: "7 días seguidos con registro de caca", rewardBellotas: 25,
  },
  {
    id: "caca_bristol_all", emoji: "🔬", title: "Experta Bristol", category: "caca",
    desc: "Registradas las 7 formas de la escala Bristol", rewardBellotas: 30,
  },
  {
    id: "caca_buena", emoji: "😌", title: "Sensación buena", category: "caca",
    desc: "Registraste una caca con sensación positiva", rewardBellotas: 10,
  },
  {
    id: "caca_perfecta", emoji: "✅", title: "Forma ideal", category: "caca",
    desc: "Registraste la forma 4 de Bristol (la perfecta)", rewardBellotas: 15,
  },
  {
    id: "caca_madrugada", emoji: "🦉", title: "Caca de madrugada", category: "caca",
    desc: "Caca registrada antes de las 7 de la mañana", rewardBellotas: 20,
    secret: true,
  },
  {
    id: "caca_variety", emoji: "🌈", title: "Gran variedad", category: "caca",
    desc: "Registradas las 3 sensaciones distintas", rewardBellotas: 20,
  },

  // ════════════════════════════════ EMOCIONAL (12) ═════════════════════════════
  {
    id: "first_emocional", emoji: "💜", title: "Primera emoción", category: "emocional",
    desc: "Tu primer registro emocional", rewardBellotas: 5,
  },
  {
    id: "emocional_5", emoji: "💫", title: "Cinco emociones", category: "emocional",
    desc: "5 registros emocionales", rewardBellotas: 10,
  },
  {
    id: "emocional_20", emoji: "🌸", title: "Veinte emociones", category: "emocional",
    desc: "20 registros emocionales", rewardBellotas: 25,
  },
  {
    id: "emocional_50", emoji: "🌺", title: "Cincuenta emociones", category: "emocional",
    desc: "50 registros emocionales", rewardBellotas: 50,
    rewardTituloId: "dt02", rewardDesc: "🎁 Título 🧘 Mente en calma",
  },
  {
    id: "emocional_100", emoji: "💎", title: "Cien emociones", category: "emocional",
    desc: "100 registros emocionales", rewardBellotas: 100,
    rewardTituloId: "dt10", rewardDesc: "🎁 Título 🌺 Jardín interior",
  },
  {
    id: "emocional_alegria", emoji: "😊", title: "¡Alegría!", category: "emocional",
    desc: "Registraste alegría 5 veces", rewardBellotas: 15,
  },
  {
    id: "emocional_resiliente", emoji: "💪", title: "Resiliente", category: "emocional",
    desc: "5 registros con intensidad alta (8 o más)", rewardBellotas: 30,
  },
  {
    id: "emocional_month", emoji: "📆", title: "Mes emocional", category: "emocional",
    desc: "20 registros emocionales en un mismo mes", rewardBellotas: 35,
  },
  {
    id: "emocional_intensa", emoji: "🌋", title: "Intensidad máxima", category: "emocional",
    desc: "Registraste intensidad 10 alguna vez", rewardBellotas: 20,
  },
  {
    id: "emocional_tranquila", emoji: "🕊️", title: "Calma total", category: "emocional",
    desc: "Registraste intensidad 1 alguna vez", rewardBellotas: 15,
  },
  {
    id: "emocional_necesidades", emoji: "🌱", title: "Conciencia plena", category: "emocional",
    desc: "Has registrado 5 necesidades diferentes", rewardBellotas: 25,
  },
  {
    id: "emocional_lugares", emoji: "🗺️", title: "Exploradora", category: "emocional",
    desc: "Has registrado 5 contextos/lugares diferentes", rewardBellotas: 20,
  },

  // ════════════════════════════════ RACHAS (12) ════════════════════════════════
  {
    id: "streak_3", emoji: "🔥", title: "3 días seguidos", category: "racha",
    desc: "3 días consecutivos de registros", rewardBellotas: 10,
  },
  {
    id: "streak_7", emoji: "🔥", title: "Racha de la semana", category: "racha",
    desc: "7 días consecutivos de registros", rewardBellotas: 20,
  },
  {
    id: "streak_14", emoji: "🔥", title: "Racha imparable", category: "racha",
    desc: "14 días consecutivos de registros", rewardBellotas: 50,
  },
  {
    id: "streak_21", emoji: "⚡", title: "21 días de fuego", category: "racha",
    desc: "21 días consecutivos de registros", rewardBellotas: 75,
    rewardClothingId: "cloth_bufanda_b", rewardDesc: "🎁 Bufanda azul para la ardilla",
  },
  {
    id: "streak_30", emoji: "🌟", title: "Un mes de racha", category: "racha",
    desc: "30 días consecutivos de registros", rewardBellotas: 100,
    rewardClothingId: "cloth_jersey_r", rewardDesc: "🎁 Jersey naranja para la ardilla",
  },
  {
    id: "streak_60", emoji: "🏆", title: "Dos meses de racha", category: "racha",
    desc: "60 días consecutivos de registros", rewardBellotas: 150,
    rewardTituloId: "dt17", rewardDesc: "🎁 Título 👑 Reina de la constancia",
  },
  {
    id: "streak_100", emoji: "💎", title: "100 días de leyenda", category: "racha",
    desc: "100 días consecutivos de registros", rewardBellotas: 250,
    rewardClothingId: "cloth_abrigo", rewardTituloId: "dt11",
    rewardDesc: "🎁 Abrigo morado + título 🏆 Campeona del bienestar",
  },
  {
    id: "perfecta_7", emoji: "📅", title: "Semana perfecta", category: "racha",
    desc: "7 días seguidos con al menos un registro de cualquier tipo", rewardBellotas: 40,
  },
  {
    id: "mes_completo", emoji: "📆", title: "Mes completo", category: "racha",
    desc: "30 días con al menos un registro de cualquier tipo", rewardBellotas: 80,
    rewardTituloId: "dt06", rewardDesc: "🎁 Título 💪 Guerrera del bienestar",
  },
  {
    id: "multi_type", emoji: "🎪", title: "Todo en uno", category: "racha",
    desc: "Registros de 3 tipos distintos el mismo día", rewardBellotas: 20,
  },
  {
    id: "streak_bonus", emoji: "💫", title: "Bonus de racha", category: "racha",
    desc: "Recibiste el multiplicador de racha ×1.5 o superior", rewardBellotas: 10,
  },
  {
    id: "consistente", emoji: "🎯", title: "Muy consistente", category: "racha",
    desc: "Al menos un registro en 4 semanas distintas del mismo mes", rewardBellotas: 50,
  },

  // ════════════════════════════════ TIENDA (13) ════════════════════════════════
  {
    id: "first_buy", emoji: "🛒", title: "Primera compra", category: "tienda",
    desc: "Tu primera compra en la tienda", rewardBellotas: 5,
  },
  {
    id: "bought_clothing", emoji: "👗", title: "A la moda", category: "tienda",
    desc: "Primera prenda para la ardilla", rewardBellotas: 15,
  },
  {
    id: "squirrel_dressed", emoji: "✨", title: "Ardilla estilosa", category: "tienda",
    desc: "Primera prenda equipada en la ardilla", rewardBellotas: 10,
  },
  {
    id: "fashion_complete", emoji: "👑", title: "Look completo", category: "tienda",
    desc: "Prenda equipada en los 4 slots (cabeza, cuello, cuerpo y ojos)", rewardBellotas: 50,
    rewardTituloId: "dt05", rewardDesc: "🎁 Título 🌸 Flor de la tranquilidad",
  },
  {
    id: "all_clothing", emoji: "🎀", title: "Coleccionista", category: "tienda",
    desc: "Tienes toda la ropa disponible en la tienda", rewardBellotas: 100,
    rewardTituloId: "dt12", rewardDesc: "🎁 Título 🦁 Corazón valiente",
  },
  {
    id: "all_toys_owned", emoji: "🎮", title: "Juguetería completa", category: "tienda",
    desc: "Tienes todos los juguetes de la tienda", rewardBellotas: 40,
    rewardTituloId: "dt03", rewardDesc: "🎁 Título 🌿 Naturaleza interior",
  },
  {
    id: "titulo_bought", emoji: "🏷️", title: "Identidad propia", category: "tienda",
    desc: "Compraste tu primer título de bienestar", rewardBellotas: 10,
  },
  {
    id: "titulo_equipped", emoji: "🎭", title: "Con título", category: "tienda",
    desc: "Tienes un título de bienestar equipado", rewardBellotas: 10,
  },
  {
    id: "avatar_uploaded", emoji: "📸", title: "Con cara propia", category: "tienda",
    desc: "Añadiste una foto de perfil personalizada", rewardBellotas: 15,
  },
  {
    id: "bellota_rich", emoji: "💰", title: "Rica en bellotas", category: "tienda",
    desc: "Tienes 500 bellotas al mismo tiempo", rewardBellotas: 25,
  },
  {
    id: "bellota_mega", emoji: "💎", title: "Archimillonaria", category: "tienda",
    desc: "Tienes 1000 bellotas al mismo tiempo", rewardBellotas: 50,
    rewardTituloId: "dt08", rewardDesc: "🎁 Título ⚡ Energía positiva",
  },
  {
    id: "squirrel_crown", emoji: "👑", title: "Reina ardilla", category: "tienda",
    desc: "La ardilla lleva la corona dorada equipada", rewardBellotas: 30,
  },
  {
    id: "tienda_5", emoji: "🛍️", title: "Clienta habitual", category: "tienda",
    desc: "5 o más artículos comprados en la tienda", rewardBellotas: 20,
  },

  // ════════════════════════════════ NIVEL (9) ══════════════════════════════════
  {
    id: "level_2", emoji: "2️⃣", title: "Nivel 2", category: "nivel",
    desc: "Alcanzaste el nivel 2", rewardBellotas: 5,
  },
  {
    id: "level_5", emoji: "5️⃣", title: "Nivel 5", category: "nivel",
    desc: "Alcanzaste el nivel 5", rewardBellotas: 15,
  },
  {
    id: "level_10", emoji: "🔟", title: "Nivel 10", category: "nivel",
    desc: "Alcanzaste el nivel 10", rewardBellotas: 30,
  },
  {
    id: "level_20", emoji: "🎯", title: "Nivel 20", category: "nivel",
    desc: "Alcanzaste el nivel 20", rewardBellotas: 60,
    rewardTituloId: "dt13", rewardDesc: "🎁 Título 🔮 Mente brillante",
  },
  {
    id: "level_30", emoji: "🌟", title: "Nivel 30", category: "nivel",
    desc: "Alcanzaste el nivel 30", rewardBellotas: 100,
  },
  {
    id: "level_50", emoji: "💎", title: "Nivel 50", category: "nivel",
    desc: "Alcanzaste el nivel 50. Eres una leyenda.", rewardBellotas: 200,
    rewardTituloId: "dt19", rewardDesc: "🎁 Título 💎 Joya del bienestar",
  },
  {
    id: "xp_500", emoji: "⚡", title: "500 de experiencia", category: "nivel",
    desc: "500 puntos de experiencia acumulados", rewardBellotas: 10,
  },
  {
    id: "xp_2000", emoji: "🔥", title: "2000 de experiencia", category: "nivel",
    desc: "2000 puntos de experiencia acumulados", rewardBellotas: 25,
  },
  {
    id: "xp_5000", emoji: "💫", title: "5000 de experiencia", category: "nivel",
    desc: "5000 puntos de experiencia acumulados", rewardBellotas: 50,
  },

  // ════════════════════════════════ ESPECIAL (13) ══════════════════════════════
  {
    id: "first_notif", emoji: "🔔", title: "Conectada", category: "especial",
    desc: "Activaste las notificaciones push", rewardBellotas: 20,
  },
  {
    id: "app_week", emoji: "🗓️", title: "Una semana con Ardilla", category: "especial",
    desc: "Llevas 7 días desde tu primer registro", rewardBellotas: 20,
  },
  {
    id: "app_month", emoji: "📅", title: "Un mes con Ardilla", category: "especial",
    desc: "Llevas 30 días desde tu primer registro", rewardBellotas: 50,
    rewardTituloId: "dt04", rewardDesc: "🎁 Título 🦋 En transformación",
  },
  {
    id: "app_year", emoji: "🎂", title: "¡Un año con Ardilla!", category: "especial",
    desc: "Llevas 365 días desde tu primer registro", rewardBellotas: 200,
    rewardTituloId: "dt14", rewardDesc: "🎁 Título 🌈 Arcoíris emocional",
  },
  {
    id: "logros_10", emoji: "🥉", title: "Coleccionista de logros", category: "especial",
    desc: "10 logros desbloqueados", rewardBellotas: 15,
  },
  {
    id: "logros_25", emoji: "🥈", title: "25 logros", category: "especial",
    desc: "25 logros desbloqueados", rewardBellotas: 30,
    rewardTituloId: "dt08", rewardDesc: "🎁 Título ⚡ Energía positiva",
  },
  {
    id: "logros_50", emoji: "🥇", title: "50 logros", category: "especial",
    desc: "50 logros desbloqueados", rewardBellotas: 60,
    rewardTituloId: "dt16", rewardDesc: "🎁 Título 🌟 Estrella del progreso",
  },
  {
    id: "logros_75", emoji: "🏆", title: "75 logros", category: "especial",
    desc: "75 logros desbloqueados", rewardBellotas: 100,
    rewardTituloId: "dt18", rewardDesc: "🎁 Título 🪄 Magia interior",
  },
  {
    id: "logros_100", emoji: "💎", title: "Todas las estrellas", category: "especial",
    desc: "100 logros desbloqueados. Leyenda absoluta.", rewardBellotas: 500,
    rewardTituloId: "dt20", rewardDesc: "🎁 Título 🏅 Leyenda de la Tranquilidad",
  },
  {
    id: "all_types_unlocked", emoji: "🎯", title: "Exploradora total", category: "especial",
    desc: "Al menos 1 registro de cada tipo: diario, caca y emocional", rewardBellotas: 25,
  },
  {
    id: "minigame_any", emoji: "🎮", title: "Jugadora", category: "especial",
    desc: "Jugaste al mini-juego de la ardilla", rewardBellotas: 5,
  },
  {
    id: "memory_any", emoji: "🃏", title: "Memoria de elefante", category: "especial",
    desc: "Jugaste al juego de memoria", rewardBellotas: 5,
  },
  {
    id: "secret_madrugada", emoji: "🌙", title: "???", category: "especial",
    desc: "Descubierto en la madrugada", rewardBellotas: 50,
    secret: true,
  },
];

// ── Estado ────────────────────────────────────────────────────────────────────
const LS_KEY = "tama_achievements_v1";

export function getAchievementState(): AchievementState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const state = raw ? (JSON.parse(raw) as AchievementState) : { unlocked: [] };
    if (!state.timestamps) state.timestamps = {};
    return state;
  } catch {
    return { unlocked: [], timestamps: {} };
  }
}

export function saveAchievementState(s: AchievementState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
    pushToCloud(LS_KEY, s);
  } catch { /* noop */ }
}

export function isUnlocked(id: string): boolean {
  return getAchievementState().unlocked.includes(id);
}

export function getUnlockTimestamp(id: string): string | null {
  const state = getAchievementState();
  return state.timestamps?.[id] ?? null;
}

/** Formatea el timestamp de desbloqueo en español (hora GMT+1). */
export function formatUnlockDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Intenta desbloquear un logro.
 * Devuelve el Achievement si se acaba de desbloquear, null si ya estaba desbloqueado.
 */
export function tryUnlock(id: string): Achievement | null {
  const state = getAchievementState();
  if (state.unlocked.includes(id)) return null;
  const ach = ALL_ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return null;
  state.unlocked.push(id);
  if (!state.timestamps) state.timestamps = {};
  state.timestamps[id] = new Date().toISOString();
  saveAchievementState(state);
  return ach;
}

export function getUnlockedAchievements(): Achievement[] {
  const state = getAchievementState();
  return ALL_ACHIEVEMENTS.filter(a => state.unlocked.includes(a.id));
}
