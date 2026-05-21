"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/* ──────────────────────────────────────────
   DATOS DE LECCIONES (material psicoeducativo)
   ────────────────────────────────────────── */
interface Slide {
  snailSays: string;
  title: string;
  bullets?: string[];
  body?: string;
  tag?: string;
}
interface Module { id: number; icon: string; title: string; shortLabel: string; color: string; slides: Slide[]; }

const MODULES: Module[] = [
  {
    id: 0, icon: "🧠", title: "¿Qué son las emociones?", shortLabel: "Emociones", color: "#0d9488",
    slides: [
      {
        snailSays: "Las emociones no son problemas ni debilidades. ¡Son tus aliadas!",
        title: "¿Para qué sirven?",
        body: "Son respuestas del organismo que intentan ayudarte a detectar lo que importa, protegerte, acercarte a lo que necesitas y alejarte de lo que te hace daño.",
        tag: "Idea clave",
      },
      {
        snailSays: "Toda emoción tiene tres capas. Vamos a verlas juntas.",
        title: "Las 3 capas de una emoción",
        bullets: ["🫀 Señales corporales — presión, calor, nudo, tensión, temblor, vacío, pesadez.", "🏃 Impulso de acción — acercarte, poner un límite, retirarte, pedir ayuda, llorar.", "💭 Narrativa mental — pensamientos que explican rápido lo que pasa."],
      },
      {
        snailSays: "Que te cueste sentir las emociones no es un fallo. Es que tu sistema te protege.",
        title: "Cuando hay estrés crónico",
        body: "El cuerpo puede aprender a subir el volumen de la alarma y la mente puede intentar controlarlo todo. Por eso a veces cuesta identificar emociones.",
        tag: "Importante",
      },
    ],
  },
  {
    id: 1, icon: "💡", title: "La función de las emociones", shortLabel: "Funciones", color: "#7c3aed",
    slides: [
      { snailSays: "El miedo quiere protegerte. Tiene sentido, aunque a veces sea excesivo.", title: "😨 Miedo / Ansiedad", bullets: ["Función: protegerte de un peligro real, percibido o imaginado.", "Impulso: vigilar, evitar, controlar o buscar seguridad."] },
      { snailSays: "La rabia dice que algo importante para ti está siendo ignorado o invadido.", title: "😠 Rabia / Enfado", bullets: ["Función: señalar un límite vulnerado o una injusticia.", "Impulso: poner límites, defender, cortar o expresar un no."] },
      { snailSays: "La tristeza no es debilidad. Es que algo importaba de verdad.", title: "😢 Tristeza", bullets: ["Función: ayudarte a procesar una pérdida y pedir apoyo.", "Impulso: recogerte, llorar, buscar consuelo o descansar."] },
      { snailSays: "El asco protege tus límites, tanto físicos como relacionales.", title: "🤢 Asco / Repulsión", bullets: ["Función: alejarte de algo nocivo.", "Impulso: apartarte, decir no y protegerte."] },
      { snailSays: "La culpa real pide reparación. La culpa falsa pide compasión.", title: "😔 Culpa", bullets: ["Función: revisar si has dañado un vínculo o necesitas reparar algo.", "Impulso: reparar, pedir disculpas o ajustar la conducta."] },
      { snailSays: "La vergüenza quería proteger tu pertenencia. Ya no siempre es necesaria.", title: "😳 Vergüenza", bullets: ["Función: en origen, proteger tu pertenencia al grupo.", "Impulso: esconderte, agradar o evitar exposición."] },
      { snailSays: "¡La alegría es una brújula hacia lo que te nutre y te hace bien!", title: "😄 Alegría / Interés", bullets: ["Función: orientarte hacia lo que te nutre y te conecta.", "Impulso: explorar, crear, compartir y acercarte."] },
    ],
  },
  {
    id: 2, icon: "🫀", title: "Cómo se sienten en el cuerpo", shortLabel: "En el cuerpo", color: "#dc2626",
    slides: [
      { snailSays: "¿Reconoces alguna de estas sensaciones cuando tienes miedo?", title: "😨 Miedo / Ansiedad", bullets: ["Pecho apretado, respiración alta.", "Nudo en el estómago.", "Tensión en mandíbula o cuello.", "Inquietud o temblor."] },
      { snailSays: "La rabia tiene mucha energía. El cuerpo quiere moverse, actuar.", title: "😠 Rabia", bullets: ["Calor y presión en el pecho.", "Tensión en brazos o manos.", "Mandíbula fuerte.", "Energía que busca salir."] },
      { snailSays: "La tristeza te pide espacio, tiempo y amabilidad hacia ti misma.", title: "😢 Tristeza", bullets: ["Peso en el pecho.", "Garganta cerrada o nudo.", "Cuerpo lento y pesado.", "Ganas de recogerse."] },
      { snailSays: "A veces el cuerpo sabe antes que la mente lo que está pasando.", title: "😳 Vergüenza", bullets: ["Calor en la cara.", "Bajada de mirada.", "Encogimiento del cuerpo.", "Impulso de desaparecer."] },
      { snailSays: "Nota cómo el cuerpo se abre cuando hay algo bueno. ¡Eso también es información!", title: "😄 Alegría", bullets: ["Expansión en el pecho.", "Sensación de ligereza.", "Respiración más amplia.", "Sonrisa espontánea."] },
      { snailSays: "Si solo sientes bloqueo o 'nada': eso también es información. El cuerpo habla con el idioma que aprendió.", title: "⚠️ Nota importante", body: "En algunos cuerpos, sobre todo cuando ha habido mucha tensión o trauma, la emoción puede aparecer como bloqueo, vacío o síntomas físicos: problemas intestinales, dolor, tensión o cansancio.", tag: "Clave" },
    ],
  },
  {
    id: 3, icon: "🪜", title: "Acercarte sin desbordarte", shortLabel: "Paso a paso", color: "#d97706",
    slides: [
      { snailSays: "Primero, seguridad. Esto no es relajarte. Es decirle a tu sistema: 'estamos aquí ahora, estoy conmigo'.", title: "Paso 1 · Seguridad primero", bullets: ["Mira alrededor y nombra 3 cosas que ves.", "Nota tus pies en el suelo.", "Suelta un poco la mandíbula.", "30–60 segundos es suficiente."], tag: "Paso 1" },
      { snailSays: "Empieza por lo más sencillo: sensaciones físicas. No hace falta saber el nombre de la emoción todavía.", title: "Paso 2 · Busca sensaciones", bullets: ["¿Hay presión, calor, nudo, vibración, vacío?", "¿En qué zona?: pecho, garganta, mandíbula, manos, abdomen.", "No analices. Solo observa."], tag: "Paso 2" },
      { snailSays: "Poner número ayuda al cerebro a orientarse sin entrar en pánico. ¡Es una herramienta muy útil!", title: "Paso 3 · Ponle un número", body: "En vez de analizar, mide la intensidad de 0 a 10. Ejemplo: 'intensidad 3/10 en el pecho'. Esto ayuda al cerebro a orientarse sin entrar en pánico.", tag: "Paso 3" },
      { snailSays: "En vez de '¿por qué me pasa?', prueba a preguntar qué necesita esta sensación.", title: "Paso 4 · Pregunta la necesidad", bullets: ["¿Qué necesita esta sensación?", "¿Qué límite o cuidado está pidiendo?", "A veces la respuesta es simple: descanso, espacio, claridad o apoyo."], tag: "Paso 4" },
      { snailSays: "Observa 10-20 segundos y luego vuelve afuera. Esto enseña a tu sistema que puedes acercarte y volver.", title: "Paso 5 · Microdosis y vuelta", bullets: ["Observa la sensación 10–20 segundos.", "Luego vuelve: mira el entorno, siente los pies, nota un objeto.", "Esto entrena la seguridad poco a poco."], tag: "Paso 5" },
      { snailSays: "No hace falta acertar. Puedes decir 'esto se parece a…'. La precisión llega con la práctica.", title: "Paso 6 · Etiqueta suave", bullets: ["'Esto se parece a ansiedad.'", "'Esto se parece a enfado.'", "'Esto se parece a tristeza.'", "No necesitas exactitud. Necesitas orientación."], tag: "Paso 6" },
      { snailSays: "Señales de que vas demasiado rápido: para, vuelve afuera, respira sin forzar.", title: "⚠️ Si vas demasiado rápido", bullets: ["Urgencia intensa, mareo o pánico.", "Bloqueo o sensación de irrealidad.", "Mucha presión interna o desconexión.", "→ Ojos abiertos, orientación, pies al suelo, pausa."], tag: "Alerta" },
    ],
  },
];

/* ──────────────────────────────────────────
   COMPONENTE SVG: PROFESOR CARACOL
   ────────────────────────────────────────── */
function ProfessorSnail({ talking, excited, imageUrl }: { talking: boolean; excited: boolean; imageUrl?: string | null }) {
  return (
    <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Pizarra detrás */}
      <polygon points="82,20 175,20 178,130 79,130" fill="#1e3a5f"/>
      <polygon points="84,24 173,24 176,126 81,126" fill="#1e4d7b"/>
      <text x="128" y="55" textAnchor="middle" fontSize="9" fontFamily="system-ui" fill="#7dd3fc" fontWeight="600">Emociones</text>
      <polygon points="100,62 128,58 156,64 128,68" fill="#f97316" opacity={0.8}/>
      <text x="128" y="78" textAnchor="middle" fontSize="7.5" fontFamily="system-ui" fill="#93c5fd">= información</text>
      <line x1="100" y1="84" x2="156" y2="84" stroke="#93c5fd" strokeWidth="0.8" opacity={0.6}/>
      <text x="128" y="95" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#bae6fd">🫀 cuerpo</text>
      <text x="128" y="107" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#bae6fd">🏃 acción</text>
      <text x="128" y="119" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#bae6fd">💭 mente</text>
      {/* Borde pizarra */}
      <polygon points="82,20 175,20 178,130 79,130" fill="none" stroke="#7c5d3a" strokeWidth="3"/>
      {/* Puntero */}
      <line x1="60" y1="135" x2="100" y2="85" stroke="#7c5d3a" strokeWidth="2.5" strokeLinecap="round"/>
      <polygon points="98,83 103,78 106,85" fill="#7c5d3a"/>

      {/* ── CUERPO CARACOL PROFESOR (SVG o imagen personalizada) ── */}
      <g>
        {excited && (
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,4;0,-2;0,0"
            dur="0.6s" repeatCount="indefinite"/>
        )}
        {imageUrl && (
          <>
            {/* Sombrero de profesor sobre la imagen */}
            <polygon points="2,148 32,148 30,138 4,138" fill="#1e3a5f"/>
            <polygon points="0,148 34,148 32,146 2,146" fill="#1e4d7b"/>
            <polygon points="10,138 24,138 22,124 12,124" fill="#1e3a5f"/>
            {/* Imagen personalizada del caracol */}
            <image href={imageUrl} x="0" y="108" width="76" height="76"
              preserveAspectRatio="xMidYMid meet"
              style={{transform: talking ? "translateY(-2px)" : "translateY(0)", transition: "transform 0.15s"}}/>
          </>
        )}
        {!imageUrl && (<>
        {/* Pie */}
        <polygon points="10,160 18,148 56,148 66,160 56,166 10,166" fill="#fef3c7"/>
        {/* Concha */}
        <polygon points="18,158 16,142 21,130 32,122 46,120 58,124 65,134 65,148 58,157" fill="#d97706"/>
        <polygon points="22,154 20,143 24,133 33,127 46,126 55,130 60,138 58,150" fill="#b45309"/>
        <polygon points="26,150 24,143 28,135 36,131 46,130 53,134 55,141 52,149" fill="#92400e"/>
        <polygon points="30,146 34,136 43,133 51,136 52,142 48,147" fill="#78350f"/>
        <polygon points="36,142 40,137 46,135 50,138 50,143" fill="#6b2d0a"/>
        {/* Cabeza */}
        <polygon points="8,158 8,148 12,138 20,135 24,142 22,156" fill="#fef3c7"/>
        {/* Sombrero de profesor */}
        <polygon points="4,138 26,138 24,130 6,130" fill="#1e3a5f"/>
        <polygon points="2,138 28,138 26,136 4,136" fill="#1e4d7b"/>
        <polygon points="10,130 20,130 18,118 12,118" fill="#1e3a5f"/>
        {/* Antena 1 */}
        <line x1="10" y1="142" x2="5" y2="128" stroke="#c4a46e" strokeWidth="2"/>
        <polygon points="3,127 5,123 8,125 6,129" fill="#1e293b"/>
        <polygon points="4,126 5,125 6,126 5,127" fill="white"/>
        {/* Antena 2 */}
        <line x1="14" y1="140" x2="13" y2="126" stroke="#c4a46e" strokeWidth="2"/>
        <polygon points="11,125 13,121 16,123 14,127" fill="#1e293b"/>
        <polygon points="12,124 13,123 14,124 13,125" fill="white"/>
        {/* Ojos */}
        <polygon points="10,146 13,142 16,146 13,150" fill="#1e293b"/>
        <polygon points="11,145 13,143 15,145 13,147" fill="#065f46"/>
        <polygon points="11,144 12,143 13,144 12,145" fill="white"/>
        {/* Boca (cambia si habla) */}
        {talking
          ? <polygon points="10,153 14,150 18,153 14,157" fill="#92400e"/>
          : <polyline points="10,153 14,156 18,153" stroke="#92400e" strokeWidth="1.5" fill="none"/>
        }
        {/* Bigotito profe */}
        <line x1="6" y1="150" x2="10" y2="151" stroke="#b45309" strokeWidth="1.2"/>
        <line x1="6" y1="152" x2="10" y2="152" stroke="#b45309" strokeWidth="1.2"/>
        </>)}
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────
   TYPEWRITER HOOK
   ────────────────────────────────────────── */
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

/* ──────────────────────────────────────────
   PÁGINA PRINCIPAL
   ────────────────────────────────────────── */
export default function Formaciones() {
  const [modIdx, setModIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [excited, setExcited] = useState(false);
  const [snailImage, setSnailImage] = useState<string | null>(null);

  useEffect(() => {
    const img = localStorage.getItem("snail_image");
    if (img) setSnailImage(img);
  }, []);

  const mod = MODULES[modIdx];
  const slide = mod.slides[slideIdx];
  const totalSlides = mod.slides.length;
  const { displayed, done } = useTypewriter(slide.snailSays);
  const talking = !done;

  // Saltar al primer slide al cambiar módulo
  useEffect(() => { setSlideIdx(0); }, [modIdx]);

  // Excitar al cambiar slide
  useEffect(() => {
    setExcited(true);
    const t = setTimeout(() => setExcited(false), 800);
    return () => clearTimeout(t);
  }, [slideIdx, modIdx]);

  function next() {
    if (slideIdx < totalSlides - 1) setSlideIdx(s => s + 1);
    else if (modIdx < MODULES.length - 1) { setModIdx(m => m + 1); }
  }
  function prev() {
    if (slideIdx > 0) setSlideIdx(s => s - 1);
    else if (modIdx > 0) { setModIdx(m => m - 1); setSlideIdx(MODULES[modIdx - 1].slides.length - 1); }
  }

  const isFirst = modIdx === 0 && slideIdx === 0;
  const isLast = modIdx === MODULES.length - 1 && slideIdx === totalSlides - 1;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden">

      {/* ── HEADER ── */}
      <header className="shrink-0 flex items-center gap-3 px-4 bg-white border-b border-slate-200 z-10" style={{ height: 56 }}>
        <Link href="/" className="text-slate-400 hover:text-slate-600 text-xl leading-none">←</Link>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium">Formaciones</p>
          <h1 className="text-sm font-bold text-slate-800 truncate">{mod.title}</h1>
        </div>
        <span className="text-lg">{mod.icon}</span>
      </header>

      {/* ── SELECTOR DE MÓDULOS ── */}
      <div className="shrink-0 flex gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {MODULES.map((m, i) => (
          <button key={m.id} onClick={() => setModIdx(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${modIdx === i ? "text-white border-transparent shadow-sm" : "bg-white text-slate-500 border-slate-200"}`}
            style={modIdx === i ? { background: m.color } : {}}>
            <span>{m.icon}</span>
            <span className="whitespace-nowrap">{m.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* ── ESCENA PROFESOR CARACOL ── */}
      <div className="shrink-0 relative flex items-end"
        style={{ height: 200, background: `linear-gradient(135deg, ${mod.color}18 0%, ${mod.color}08 100%)` }}>
        {/* Suelo */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-100 opacity-60"/>

        {/* Caracol + pizarra */}
        <div className="absolute left-0 bottom-0 w-52 h-44">
          <ProfessorSnail talking={talking} excited={excited} imageUrl={snailImage}/>
        </div>

        {/* Bocadillo */}
        <div className="absolute right-3 top-4 left-48 bg-white rounded-2xl rounded-bl-sm p-3 shadow-md border border-slate-200">
          <p className="text-xs text-slate-700 leading-relaxed min-h-[3rem]">
            {displayed}
            {!done && <span className="inline-block w-0.5 h-3 bg-teal-500 ml-0.5 animate-pulse align-middle"/>}
          </p>
          {done && (
            <p className="text-[10px] text-slate-400 mt-1">
              Diapositiva {slideIdx + 1} de {totalSlides} · {mod.title}
            </p>
          )}
        </div>
      </div>

      {/* ── PROGRESO ── */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2">
        <div className="flex gap-1 flex-1">
          {mod.slides.map((_, i) => (
            <button key={i} onClick={() => setSlideIdx(i)}
              className="h-1.5 rounded-full flex-1 transition-all"
              style={{ background: i <= slideIdx ? mod.color : "#e2e8f0" }}/>
          ))}
        </div>
        <span className="text-xs text-slate-400 shrink-0">{slideIdx + 1}/{totalSlides}</span>
      </div>

      {/* ── CONTENIDO DE LA DIAPOSITIVA ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          {slide.tag && (
            <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 text-white"
              style={{ background: mod.color }}>
              {slide.tag}
            </span>
          )}
          <h2 className="text-base font-bold text-slate-800 mb-2">{slide.title}</h2>
          {slide.body && <p className="text-sm text-slate-600 leading-relaxed mb-2">{slide.body}</p>}
          {slide.bullets && (
            <ul className="flex flex-col gap-2">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="shrink-0 mt-0.5">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Frase de regulación al final de cada módulo */}
        {isLast && (
          <div className="mt-3 p-4 rounded-2xl text-center" style={{ background: `${mod.color}18`, borderColor: `${mod.color}40`, borderWidth: 1 }}>
            <p className="text-sm font-medium" style={{ color: mod.color }}>
              &ldquo;Sentir no es peligroso. Tu cuerpo puede aprender a hacerlo con más seguridad.&rdquo; 🌿
            </p>
          </div>
        )}
      </div>

      {/* ── NAVEGACIÓN ── */}
      <div className="shrink-0 flex gap-3 px-4 pb-6 pt-2 bg-white border-t border-slate-100">
        <button onClick={prev} disabled={isFirst}
          className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-30 active:scale-95 transition-transform">
          ← Anterior
        </button>
        {isLast
          ? <Link href="/" className="flex-1 py-3 rounded-2xl text-white font-bold text-sm text-center active:scale-95 transition-transform" style={{ background: mod.color }}>
              ¡Terminado! 🎉
            </Link>
          : <button onClick={next}
              className="flex-1 py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ background: mod.color }}>
              Siguiente →
            </button>
        }
      </div>

    </div>
  );
}
