
const items = [
  { label: "Минздрав РФ", sub: "Лицензия № Л041-01168-01/01249070" },
  { label: "9 специалистов", sub: "опыт от 2 до 25 лет" },
  { label: "15+ лет", sub: "на рынке стоматологии" },
  { label: "Osstem", sub: "Официальный партнёр" },
  { label: "Dentis", sub: "Официальный партнёр" },
  { label: "3Shape", sub: "Цифровой партнёр" },
  { label: "5.0 / 5.0", sub: "средняя оценка клиники" },
];

export const TrustStrip = () => {
  return (
    <section
      className="relative py-5 overflow-hidden"
      style={{ borderTop: "1px solid hsl(215 20% 92%)", borderBottom: "1px solid hsl(215 20% 92%)" }}
    >
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, white 0%, transparent 100%)" }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(270deg, white 0%, transparent 100%)" }}
      />

      {/* Scrolling strip */}
      <div className="flex animate-trust-scroll gap-0" style={{ width: "max-content" }}>
        {[...items, ...items].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-8"
            style={{ borderRight: "1px solid hsl(215 20% 90%)" }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: i % 2 === 0 ? "hsl(0 65% 51%)" : "hsl(168 76% 42%)" }}
            />
            <div>
              <p className="text-sm font-bold leading-tight whitespace-nowrap" style={{ color: "hsl(215 50% 12%)" }}>
                {item.label}
              </p>
              <p className="text-xs whitespace-nowrap" style={{ color: "hsl(215 20% 55%)" }}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
