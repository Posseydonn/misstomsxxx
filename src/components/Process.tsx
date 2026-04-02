import { ScrollReveal } from "./ScrollReveal";
import { MessageCircle, ScanLine, ClipboardList, Activity, Sparkles } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Консультация",
    desc: "Бесплатный осмотр и знакомство с врачом. Обсудим ваши пожелания и ожидания.",
    icon: MessageCircle,
    accent: "hsl(0 65% 51%)",
    accentLight: "hsl(0 65% 96%)",
  },
  {
    number: 2,
    title: "Диагностика",
    desc: "3D-снимок и полное обследование. Составим детальную карту здоровья полости рта.",
    icon: ScanLine,
    accent: "hsl(25 85% 55%)",
    accentLight: "hsl(25 85% 96%)",
  },
  {
    number: 3,
    title: "План лечения",
    desc: "Индивидуальный план с фиксированной стоимостью. Никаких сюрпризов по цене.",
    icon: ClipboardList,
    accent: "hsl(260 50% 55%)",
    accentLight: "hsl(260 50% 96%)",
  },
  {
    number: 4,
    title: "Лечение",
    desc: "Безболезненные процедуры с использованием современных технологий и анестезии.",
    icon: Activity,
    accent: "hsl(210 70% 50%)",
    accentLight: "hsl(210 70% 96%)",
  },
  {
    number: 5,
    title: "Результат",
    desc: "Идеальная улыбка и гарантия на все виды работ от 1 года. Поддержка после лечения.",
    icon: Sparkles,
    accent: "hsl(168 76% 36%)",
    accentLight: "hsl(168 76% 95%)",
  },
];

export const Process = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">
              Как мы работаем
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              5 шагов к идеальной улыбке
            </h2>
          </div>
        </ScrollReveal>

        {/* Desktop: 3-2 bento grid */}
        <div className="hidden md:block">
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            {steps.slice(0, 3).map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 120} animation="up">
                <div
                  className="group relative rounded-2xl p-8 h-full overflow-hidden transition-all duration-400 hover:-translate-y-1 hover:shadow-lg cursor-default"
                  style={{ backgroundColor: step.accentLight }}
                >
                  {/* Large background number */}
                  <span
                    className="absolute -right-2 -bottom-4 font-black pointer-events-none select-none leading-none"
                    style={{ fontSize: "140px", color: step.accent, opacity: 0.07 }}
                  >
                    {step.number}
                  </span>

                  <div className="relative z-10">
                    {/* Number + Icon row */}
                    <div className="flex items-center justify-between mb-6">
                      <span
                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-base font-black text-white"
                        style={{ backgroundColor: step.accent }}
                      >
                        {step.number}
                      </span>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                        style={{ backgroundColor: `${step.accent}15` }}
                      >
                        <step.icon className="w-6 h-6" style={{ color: step.accent }} />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Row 2: 2 wider cards */}
          <div className="grid grid-cols-2 gap-5">
            {steps.slice(3, 5).map((step, i) => (
              <ScrollReveal key={step.number} delay={(i + 3) * 120} animation="up">
                <div
                  className="group relative rounded-2xl p-8 md:p-10 overflow-hidden transition-all duration-400 hover:-translate-y-1 hover:shadow-lg cursor-default"
                  style={{ backgroundColor: step.accentLight }}
                >
                  {/* Large background number */}
                  <span
                    className="absolute -right-2 -bottom-6 font-black pointer-events-none select-none leading-none"
                    style={{ fontSize: "180px", color: step.accent, opacity: 0.07 }}
                  >
                    {step.number}
                  </span>

                  <div className="relative z-10 flex items-start gap-6">
                    <div className="shrink-0">
                      <span
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-black text-white mb-3"
                        style={{ backgroundColor: step.accent }}
                      >
                        {step.number}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                          style={{ backgroundColor: `${step.accent}15` }}
                        >
                          <step.icon className="w-5 h-5" style={{ color: step.accent }} />
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Mobile: full-width vertical stack */}
        <div className="md:hidden flex flex-col gap-3">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 100} animation="up">
              <div
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{ backgroundColor: step.accentLight }}
              >
                <span
                  className="absolute -right-1 -bottom-2 font-black pointer-events-none select-none leading-none"
                  style={{ fontSize: "90px", color: step.accent, opacity: 0.07 }}
                >
                  {step.number}
                </span>

                <div className="relative z-10 flex items-center gap-4">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-black text-white shrink-0"
                    style={{ backgroundColor: step.accent }}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground mb-0.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
