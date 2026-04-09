import { ScrollReveal } from "./ScrollReveal";
import { Link } from "react-router-dom";
import { services } from "@/data/services";

export const Services = () => {
  return (
    <section id="services" className="py-10 md:py-20 bg-surface">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-2xl mb-8 md:mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Наши услуги</p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              Здоровые зубы и красивая улыбка — без боли и стресса
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mt-3 leading-relaxed">
              Первичная консультация и 3D-диагностика — бесплатно
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {services.map((service, i) => (
            <ScrollReveal key={service.slug} delay={i * 100} animation="scale">
              <Link
                to={`/services/${service.slug}`}
                className="group bg-background rounded-2xl p-4 sm:p-6 lg:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden block"
              >
                {/* Gradient accent line top */}
                <div
                  className="absolute top-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-500"
                  style={{ background: "linear-gradient(90deg, hsl(0 65% 51%), hsl(168 76% 42%))" }}
                />
                <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-4 h-4 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h3 className="text-sm sm:text-2xl font-bold text-foreground mb-1.5 sm:mb-3 leading-snug">{service.title}</h3>
                <p className="hidden sm:block text-muted-foreground text-sm leading-relaxed flex-1 mb-6">{service.description}</p>
                <div className="flex sm:items-center sm:justify-between flex-col sm:flex-row gap-1 sm:gap-0 mt-auto">
                  <span className="text-xs sm:text-sm font-semibold text-accent">{service.price}</span>
                  <span className="hidden sm:inline text-sm font-semibold text-primary group-hover:text-clinic-red-dark transition-colors duration-200">
                    Узнать стоимость →
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-8 md:mt-12 rounded-2xl bg-clinic-gradient p-6 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-primary-foreground mb-1 md:mb-2">Бесплатная консультация</h3>
              <p className="text-primary-foreground/80 text-sm md:text-base">3D-диагностика и план лечения в подарок при первом визите</p>
            </div>
            <Link
              to="/contacts"
              className="shrink-0 rounded-lg bg-background px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-foreground transition-all duration-200 hover:shadow-elevated w-full md:w-auto text-center"
            >
              Записаться бесплатно
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
