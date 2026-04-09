import { useCallback, useEffect, useState } from "react";
import { ScrollReveal } from "./ScrollReveal";
import { ChevronLeft, ChevronRight, Smile, Sparkles, AlignLeft, Crown, Zap, Quote } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const cases = [
  {
    name: "Анна, 34 года",
    procedure: "Виниры",
    icon: Smile,
    accent: "hsl(0 65% 51%)",
    accentBg: "hsl(0 65% 96%)",
    quote: "Всю жизнь стеснялась улыбаться. Теперь не могу перестать! Врачи подобрали идеальный оттенок.",
    result: "8 виниров за 2 визита",
    duration: "2 недели",
  },
  {
    name: "Сергей, 45 лет",
    procedure: "Имплантация",
    icon: Sparkles,
    accent: "hsl(168 76% 36%)",
    accentBg: "hsl(168 76% 95%)",
    quote: "Потерял два зуба 5 лет назад. Импланты поставили за 1 час, через 3 месяца — как родные.",
    result: "2 импланта Straumann",
    duration: "3 месяца",
  },
  {
    name: "Елена, 28 лет",
    procedure: "Элайнеры",
    icon: AlignLeft,
    accent: "hsl(260 50% 55%)",
    accentBg: "hsl(260 50% 96%)",
    quote: "Носила элайнеры 10 месяцев. Никто не замечал! Результат — ровные зубы без брекетов.",
    result: "Идеально ровные зубы",
    duration: "10 месяцев",
  },
  {
    name: "Михаил, 52 года",
    procedure: "Протезирование",
    icon: Crown,
    accent: "hsl(210 70% 50%)",
    accentBg: "hsl(210 70% 96%)",
    quote: "Полное восстановление зубного ряда. Жую, улыбаюсь — всё как 20 лет назад.",
    result: "All-on-4 за 1 день",
    duration: "1 день",
  },
  {
    name: "Ирина, 39 лет",
    procedure: "Отбеливание",
    icon: Zap,
    accent: "hsl(25 85% 55%)",
    accentBg: "hsl(25 85% 96%)",
    quote: "Зубы стали на 8 тонов светлее за 1 час. Безболезненно и эффект держится уже год!",
    result: "ZOOM-отбеливание",
    duration: "1 час",
  },
];

export const BeforeAfter = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section id="results" className="py-10 md:py-20 bg-surface">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-7 md:mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Результаты</p>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.1]">
                Реальные результаты наших пациентов
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {cases.map((item) => (
              <div
                key={item.name}
                className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_32%] min-w-0"
              >
                <div
                  className="rounded-2xl overflow-hidden h-full flex flex-col p-7 relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ backgroundColor: item.accentBg }}
                >
                  {/* Background watermark icon */}
                  <item.icon
                    className="absolute -right-3 -bottom-3 w-28 h-28 pointer-events-none select-none"
                    style={{ color: item.accent, opacity: 0.06 }}
                  />

                  <div className="relative z-10 flex flex-col flex-1">
                    {/* Header: icon + procedure */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `color-mix(in srgb, ${item.accent} 12%, transparent)` }}
                      >
                        <item.icon className="w-5 h-5" style={{ color: item.accent }} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: item.accent }}>
                          {item.procedure}
                        </span>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="flex-1 mb-5">
                      <Quote className="w-4 h-4 mb-2" style={{ color: item.accent, opacity: 0.4 }} />
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        {item.quote}
                      </p>
                    </div>

                    {/* Result badges */}
                    <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid color-mix(in srgb, ${item.accent} 15%, transparent)` }}>
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: item.accent }}
                      >
                        {item.result}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile nav dots */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-6">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};
