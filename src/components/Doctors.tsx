import { ScrollReveal } from "./ScrollReveal";

// Imports with Cyrillic/spaced filenames via Vite asset URL
import prokopenko from "@/assets/фото врачей без фона/Прокопенко Татьяна Маратовна.webp";
import shovgenov from "@/assets/фото врачей без фона/Шовгенов Тембот Нальбиевич.webp";
import podoprigora from "@/assets/фото врачей без фона/Подопригора Оксана Викторовна.webp";
import natalia from "@/assets/фото врачей без фона/наталья игоревна.webp";
import alisultanov from "@/assets/фото врачей без фона/Алисултанов Арсен Русланович.webp";
import gayane from "@/assets/фото врачей без фона/Гаяне альбертовна.webp";
import adam from "@/assets/фото врачей без фона/Адам Аскорбиевич.webp";
import tuguz from "@/assets/фото врачей без фона/Тугуз Зарема Байрамовна.webp";
import zelimkhan from "@/assets/фото врачей без фона/зелемхан.webp";

const doctors = [
  {
    name: "Прокопенко Татьяна Маратовна",
    role: "Терапевт-эндодонтист, реставратор",
    experience: "Стаж 25 лет",
    image: prokopenko,
  },
  {
    name: "Подопригора Оксана Викторовна",
    role: "Терапевт-эндодонтист",
    experience: "Стаж 15 лет",
    image: podoprigora,
  },
  {
    name: "Овчинникова Наталья Игоревна",
    role: "Детский стоматолог",
    experience: "Стаж 20 лет",
    image: natalia,
  },
  {
    name: "Шовгенов Тембот Нальбиевич",
    role: "Хирург-имплантолог",
    experience: "Стаж 5 лет",
    image: shovgenov,
  },
  {
    name: "Алисултанов Арсен Русланович",
    role: "Стоматолог-ортопед",
    experience: "Стаж 4 года",
    image: alisultanov,
  },
  {
    name: "Маркарьян Гаянэ Альбертовна",
    role: "Терапевт-эндодонтист",
    experience: "Стаж 10 лет",
    image: gayane,
  },
  {
    name: "Тугуз Зарема Байрамовна",
    role: "Терапевт-эндодонтист",
    experience: "Стаж 8 лет",
    image: tuguz,
  },
  {
    name: "Петхишхов Адам Аскарбиевич",
    role: "Врач-стоматолог",
    experience: "Стаж 2 года",
    image: adam,
  },
  {
    name: "Магомадов Зелимхан Тимур-Булатович",
    role: "Стоматолог-терапевт",
    experience: "Стаж 2 года",
    image: zelimkhan,
  },
];

export const Doctors = () => {
  return (
    <section id="doctors" className="py-12 md:py-16">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "hsl(168 76% 42%)" }}>
              Наша команда
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1]" style={{ color: "hsl(215 50% 12%)" }}>
              Врачи, которым доверяют
            </h2>
            <div className="w-16 h-1.5 rounded-full mt-5" style={{ background: "linear-gradient(90deg, hsl(0 65% 51%), hsl(168 76% 42%))" }} />
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {doctors.map((doc, i) => (
            <ScrollReveal key={doc.name} delay={i * 80}>
              <div className="group">
                {/* Photo card */}
                <div
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    background: "linear-gradient(160deg, hsl(168 40% 22%) 0%, hsl(168 50% 18%) 100%)",
                    aspectRatio: "2/3",
                  }}
                >
                  {/* Number badge */}
                  <span
                    className="absolute top-4 left-4 font-bold leading-none select-none z-10"
                    style={{ fontSize: "1.75rem", color: "hsl(0 0% 100% / 0.25)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Doctor photo */}
                  <img
                    src={doc.image}
                    alt={doc.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Info — outside card, below */}
                <div className="mt-3 px-1">
                  <p className="font-bold text-base leading-snug" style={{ color: "hsl(215 50% 12%)" }}>
                    {doc.name}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "hsl(215 20% 55%)" }}>
                    {doc.role}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(168 60% 38%)" }}>
                    {doc.experience}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
