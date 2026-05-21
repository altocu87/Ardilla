"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/actividad/p1", label: "Registrar", icon: "📝" },
  { href: "/progreso", label: "Progreso", icon: "📊" },
  { href: "/recompensas", label: "Logros", icon: "🏆" },
];

export default function Navbar() {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname === "/formaciones" ||
    pathname === "/opciones" ||
    pathname === "/informacion" ||
    pathname === "/registro" ||
    pathname === "/registro/diario" ||
    pathname === "/historico/diario"
  ) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                active ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="text-xl">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
