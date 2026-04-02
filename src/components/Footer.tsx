import { Link } from "react-router-dom";
import { branches, HOURS } from "@/data/contacts";

const serviceLinks = [
  { label: "Имплантация", slug: "implantation" },
  { label: "Виниры", slug: "veneers" },
  { label: "Ортодонтия", slug: "braces" },
  { label: "Профгигиена", slug: "hygiene" },
  { label: "Лечение", slug: "treatment" },
];

const infoLinks = [
  { label: "О клинике", to: "/about" },
  { label: "Врачи", to: "/doctors" },
  { label: "Отзывы", to: "/reviews" },
  { label: "Результаты", to: "/results" },
  { label: "Контакты", to: "/contacts" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Мисс Стоматология" className="h-8 w-auto" />
              <span className="font-bold text-lg text-background">Мисс Стоматология</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Путь к сияющей улыбке начался уже сейчас.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Услуги</h4>
            <div className="space-y-2">
              {serviceLinks.map((s) => (
                <Link
                  key={s.slug}
                  to={`/services/${s.slug}`}
                  className="block text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: "hsl(0 0% 100% / 0.5)" }}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Информация</h4>
            <div className="space-y-2">
              {infoLinks.map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  className="block text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: "hsl(0 0% 100% / 0.5)" }}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Контакты</h4>
            <div className="space-y-4 text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              {branches.map((b) => (
                <div key={b.phoneRaw}>
                  <p className="text-white/70 font-medium mb-1">{b.name}</p>
                  <a
                    href={b.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors block"
                  >
                    {b.address}
                  </a>
                  <a href={`tel:${b.phoneRaw}`} className="hover:text-white transition-colors">
                    {b.phone}
                  </a>
                </div>
              ))}
              <p>{HOURS}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.1)" }}>
          <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            © {new Date().getFullYear()} Мисс Стоматология. Все права защищены.
          </p>
          <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            Политика конфиденциальности
          </p>
        </div>
      </div>
    </footer>
  );
};
