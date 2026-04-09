import { ScrollReveal } from "./ScrollReveal";
import clinicConsultation from "@/assets/clinic-consultation.webp";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "3D-диагностика и цифровое планирование",
  "Безболезненное лечение под современной анестезией",
  "Индивидуальный план лечения для каждого пациента",
  "Фиксированная стоимость до начала лечения",
  "Гарантия на все виды работ от 1 года",
];

export const About = () => {
  return (
    <section id="about" className="py-10 md:py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 60% 97%) 0%, hsl(0 0% 100%) 50%, hsl(168 50% 96%) 100%)" }}>
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Левая колонка: текст ── */}
          <div>
            <ScrollReveal delay={100}>
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "hsl(168 76% 42%)" }}>О клинике</p>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 md:mb-6" style={{ color: "hsl(215 50% 12%)" }}>
                Мы делаем стоматологию<br />
                <span style={{ color: "hsl(0 65% 51%)" }}>комфортной</span> и предсказуемой
              </h2>
              <div className="w-16 h-1.5 rounded-full mb-6" style={{ background: "linear-gradient(90deg, hsl(0 65% 51%), hsl(168 76% 42%))" }} />
              <p className="text-lg leading-relaxed mb-8" style={{ color: "hsl(215 30% 40%)" }}>
                Мисс Стоматология — современный центр с фокусом на результат и комфорт. Сертифицированные материалы, оборудование мировых производителей, врачи с многолетним опытом.
              </p>
            </ScrollReveal>

            {/* Список фич */}
            <ScrollReveal delay={200}>
              <div className="space-y-2 mb-10">
                {features.map((item) => (
                  <div key={item} className="flex items-center gap-3 py-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "hsl(168 76% 42% / 0.12)" }}>
                      <Check className="w-3 h-3" style={{ color: "hsl(168 76% 42%)" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "hsl(215 40% 30%)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <Link
                to="/contacts"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-10 py-5 text-lg font-semibold text-white transition-all duration-200 hover:opacity-90 group w-full sm:w-auto"
                style={{ backgroundColor: "hsl(0 65% 51%)" }}
              >
                Записаться на консультацию
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </ScrollReveal>
          </div>

          {/* ── Правая колонка: видео ── */}
          <ScrollReveal animation="right" delay={150}>
            <div className="relative flex justify-center">

              {/* Декоративные кольца — только от sm */}
              <div
                className="hidden sm:block absolute -top-6 -right-6 w-56 h-56 rounded-full pointer-events-none"
                style={{ border: "1.5px solid hsl(168 76% 42% / 0.18)" }}
              />
              <div
                className="hidden sm:block absolute -bottom-4 -left-4 w-36 h-36 rounded-full pointer-events-none"
                style={{ border: "1px dashed hsl(0 65% 51% / 0.15)" }}
              />

              {/* Видео */}
              <div
                className="relative overflow-hidden rounded-3xl w-full max-w-sm"
                style={{ boxShadow: "0 24px 64px hsl(215 50% 12% / 0.18)" }}
              >
                <video
                  src="/clinic-video.mov"
                  preload="none"
                  poster={clinicConsultation}
                  controls
                  playsInline
                  className="w-full h-auto block"
                />
                {/* Градиент снизу */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, transparent 70%, hsl(215 50% 12% / 0.12) 100%)" }}
                />
                {/* Бейдж "Live" */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: "hsl(215 50% 12% / 0.55)", backdropFilter: "blur(6px)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-white text-xs font-semibold tracking-wide">Наша клиника</span>
                </div>
              </div>

            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
};
