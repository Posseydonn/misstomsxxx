import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { branches } from "@/data/contacts";

const navItems = [
  { label: "Услуги", href: "/services" },
  { label: "Врачи", href: "/doctors" },
  { label: "Отзывы", href: "/reviews" },
  { label: "О клинике", href: "/about" },
  { label: "Контакты", href: "/contacts" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300"
      style={{
        borderBottom: "1px solid hsl(215 20% 92%)",
        boxShadow: scrolled ? "0 2px 20px hsl(215 50% 12% / 0.06)" : "none",
        paddingTop: scrolled ? "10px" : "16px",
        paddingBottom: scrolled ? "10px" : "16px",
      }}
    >
      <div className="container mx-auto flex items-center justify-between px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Мисс Стоматология" className="h-8 w-auto" />
          <span className="font-bold text-base tracking-tight" style={{ color: "hsl(215 50% 12%)" }}>
            Мисс Стоматология
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{
                color: location.pathname === item.href
                  ? "hsl(0 65% 51%)"
                  : "hsl(215 30% 35%)",
              }}
              onMouseEnter={(e) => { if (location.pathname !== item.href) (e.target as HTMLElement).style.color = "hsl(215 50% 12%)"; }}
              onMouseLeave={(e) => { if (location.pathname !== item.href) (e.target as HTMLElement).style.color = "hsl(215 30% 35%)"; }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href={`tel:${branches[0].phoneRaw}`}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
            style={{ color: "hsl(215 30% 40%)" }}
          >
            <Phone className="w-3.5 h-3.5" />
            {branches[0].phone}
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/79282919455"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity duration-200 hover:opacity-80"
            style={{ backgroundColor: "#25D366" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.849L.057 23.535a.75.75 0 0 0 .916.938l5.85-1.53A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.371-.217-3.838 1.004 1.022-3.737-.235-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </a>

          {/* Max */}
          <a
            href="https://max.ru/u/f9LHodD0cOItWi4V7AVYrRUWYFpvPUYVAdh6wayXch_vz7HvWbLhCXA5zss"
            target="_blank"
            rel="noopener noreferrer"
            title="Max"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity duration-200 hover:opacity-80"
            style={{ backgroundColor: "#0077FF" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 6.5h-2l-2.5 3-2.5-3h-2l3.5 4.5L7.5 17h2l2.5-3.2 2.5 3.2h2l-3.5-4.5L16.5 8.5z"/>
            </svg>
          </a>

          <Link
            to="/contacts"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "hsl(0 65% 51%)" }}
          >
            Записаться
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: "hsl(215 50% 12%)" }}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="lg:hidden bg-white"
          style={{ borderTop: "1px solid hsl(215 20% 92%)" }}
        >
          <div className="container mx-auto px-6 py-6 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium py-2"
                style={{
                  color: location.pathname === item.href
                    ? "hsl(0 65% 51%)"
                    : "hsl(215 30% 35%)",
                }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${branches[0].phoneRaw}`}
              className="flex items-center gap-2 text-sm py-2"
              style={{ color: "hsl(215 30% 40%)" }}
            >
              <Phone className="w-4 h-4" />
              {branches[0].phone}
            </a>
            <div className="flex gap-3">
              <a
                href="https://wa.me/79282919455"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.849L.057 23.535a.75.75 0 0 0 .916.938l5.85-1.53A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.371-.217-3.838 1.004 1.022-3.737-.235-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                WhatsApp
              </a>
              <a
                href="https://max.ru/u/f9LHodD0cOItWi4V7AVYrRUWYFpvPUYVAdh6wayXch_vz7HvWbLhCXA5zss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: "#0077FF" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 6.5h-2l-2.5 3-2.5-3h-2l3.5 4.5L7.5 17h2l2.5-3.2 2.5 3.2h2l-3.5-4.5L16.5 8.5z"/>
                </svg>
                Max
              </a>
            </div>
            <Link
              to="/contacts"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-5 py-3 text-center text-sm font-semibold text-white mt-1"
              style={{ backgroundColor: "hsl(0 65% 51%)" }}
            >
              Записаться на консультацию
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
