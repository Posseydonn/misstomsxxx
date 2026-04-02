import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { branches } from "@/data/contacts";

export const StickyCTA = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Phone */}
      <a
        href={`tel:${branches[0].phoneRaw}`}
        className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-elevated glow-teal transition-transform duration-200 hover:scale-105"
        aria-label="Позвонить"
        title="Позвонить"
      >
        <Phone className="w-6 h-6 text-accent-foreground" />
      </a>

      {/* WhatsApp */}
      <a
        href="https://wa.me/79282919455"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        title="Написать в WhatsApp"
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-elevated transition-transform duration-200 hover:scale-105"
        style={{ backgroundColor: "#25D366" }}
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.849L.057 23.535a.75.75 0 0 0 .916.938l5.85-1.53A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.371-.217-3.838 1.004 1.022-3.737-.235-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </a>

      {/* Max */}
      <a
        href="https://max.ru/u/f9LHodD0cOItWi4V7AVYrRUWYFpvPUYVAdh6wayXch_vz7HvWbLhCXA5zss"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Max"
        title="Написать в Max"
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-elevated transition-transform duration-200 hover:scale-105"
        style={{ backgroundColor: "#0077FF" }}
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 6.5h-2l-2.5 3-2.5-3h-2l3.5 4.5L7.5 17h2l2.5-3.2 2.5 3.2h2l-3.5-4.5L16.5 8.5z"/>
        </svg>
      </a>

      {/* Записаться */}
      <Link
        to="/contacts"
        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-elevated glow-red transition-transform duration-200 hover:scale-105"
        aria-label="Записаться"
        title="Записаться на приём"
      >
        <span className="text-primary-foreground text-lg font-bold">→</span>
      </Link>
    </div>
  );
};
