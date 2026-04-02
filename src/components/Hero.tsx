import { ScrollReveal } from "./ScrollReveal";
import { MapPin, Award, Star, ArrowRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { useState, useEffect } from "react";
import facadeImage1 from "@/assets/clinic-facade.jpg";
import facadeImage2 from "@/assets/об-3370.jpg";
import interiorImage from "@/assets/clinic-reception.jpg";
import smileImage from "@/assets/clinic-lounge.jpg";

const facadeSlides = [
  { src: facadeImage1, alt: "Фасад клиники Мисс Стоматология — филиал 1" },
  { src: facadeImage2, alt: "Фасад клиники Мисс Стоматология — филиал 2" },
];

const stats = [
  { icon: MapPin, value: "2 филиала", label: "в Майкопе" },
  { icon: Award, value: "15 лет", label: "на рынке" },
  { icon: Star, value: "5.0", label: "рейтинг на Яндекс.Картах" },
];

const serviceTags = ["Имплантация", "Виниры", "Брекеты", "Отбеливание"];

export const Hero = () => {
  const { x, y } = useMouseParallax(1);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % facadeSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(0 60% 97%) 0%, hsl(0 0% 100%) 40%, hsl(168 50% 96%) 100%)",
      }}
    >
      {/* Red-to-teal top line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: "linear-gradient(90deg, transparent 0%, hsl(0 65% 51%) 35%, hsl(168 76% 42%) 65%, transparent 100%)" }}
      />

      {/* Subtle dot grid — parallax layer */}
      <div
        className="absolute inset-0 opacity-[0.03] will-change-transform"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(215 50% 12%) 1px, transparent 0)",
          backgroundSize: "36px 36px",
          transform: `translate(${x * 5}px, ${y * 5}px)`,
        }}
      />

      {/* Red blob — top left — parallax layer */}
      <div
        className="absolute -top-10 -left-10 w-[500px] h-[500px] rounded-full pointer-events-none will-change-transform"
        style={{
          background: "radial-gradient(circle, hsl(0 75% 60% / 0.18) 0%, transparent 65%)",
          filter: "blur(60px)",
          transform: `translate(${x * -20}px, ${y * -20}px)`,
        }}
      />

      {/* Teal blob — bottom right — parallax layer */}
      <div
        className="absolute -bottom-20 -right-10 w-[600px] h-[600px] rounded-full pointer-events-none will-change-transform"
        style={{
          background: "radial-gradient(circle, hsl(168 76% 42% / 0.15) 0%, transparent 65%)",
          filter: "blur(70px)",
          transform: `translate(${x * -20}px, ${y * -20}px)`,
        }}
      />

      {/* Soft red wash — left strip */}
      <div
        className="absolute top-0 left-0 w-[40%] h-full pointer-events-none"
        style={{
          background: "linear-gradient(90deg, hsl(0 70% 95% / 0.6) 0%, transparent 100%)",
        }}
      />

      {/* Teal accent — bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(168 76% 42% / 0.08) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Large decorative arcs — top right — parallax layer */}
      <div
        className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full pointer-events-none hidden lg:block will-change-transform"
        style={{
          border: "1px solid hsl(168 76% 42% / 0.12)",
          transform: `translate(${x * 10}px, ${y * 10}px)`,
        }}
      />
      <div
        className="absolute -top-12 -right-12 w-[360px] h-[360px] rounded-full pointer-events-none hidden lg:block will-change-transform"
        style={{
          border: "1px solid hsl(0 65% 51% / 0.07)",
          transform: `translate(${x * 10}px, ${y * 10}px)`,
        }}
      />

      {/* Decorative cross — top center */}
      <div className="absolute top-[22%] left-[47%] pointer-events-none hidden lg:block" style={{ opacity: 0.2 }}>
        <div className="relative w-4 h-4">
          <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: "hsl(168 76% 42%)", transform: "translateY(-50%)" }} />
          <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: "hsl(168 76% 42%)", transform: "translateX(-50%)" }} />
        </div>
      </div>

      {/* Decorative cross — bottom left */}
      <div className="absolute bottom-[28%] left-[7%] pointer-events-none hidden lg:block" style={{ opacity: 0.18 }}>
        <div className="relative w-5 h-5">
          <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: "hsl(0 65% 51%)", transform: "translateY(-50%)" }} />
          <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: "hsl(0 65% 51%)", transform: "translateX(-50%)" }} />
        </div>
      </div>

      {/* Decorative cross — right edge */}
      <div className="absolute top-[62%] right-[3%] pointer-events-none hidden lg:block" style={{ opacity: 0.12 }}>
        <div className="relative w-6 h-6">
          <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: "hsl(215 50% 12%)", transform: "translateY(-50%)" }} />
          <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: "hsl(215 50% 12%)", transform: "translateX(-50%)" }} />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-36 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Left: content ── */}
          <div>
            <ScrollReveal delay={150}>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 border"
                style={{
                  borderColor: "hsl(168 76% 42% / 0.35)",
                  backgroundColor: "hsl(168 76% 42% / 0.07)",
                }}
              >
                <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(168 76% 42%)" }} fill="hsl(168 76% 42%)" />
                <span className="text-sm font-medium" style={{ color: "hsl(215 50% 12%)" }}>
                  Стоматологическая клиника в Майкопе
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <h1
                className="text-6xl md:text-7xl lg:text-[6.5rem] leading-[1.03] mb-4"
                style={{ color: "hsl(215 50% 12%)" }}
              >
                <span className="font-light block">Мисс</span>
                <span className="font-extrabold block">Стоматология</span>
              </h1>
              {/* Red-to-teal accent line */}
              <div
                className="w-20 h-1.5 rounded-full mb-8"
                style={{ background: "linear-gradient(90deg, hsl(0 65% 51%), hsl(168 76% 42%))" }}
              />
            </ScrollReveal>

            <ScrollReveal delay={450}>
              <p
                className="text-xl md:text-2xl leading-relaxed mb-7 font-light max-w-lg"
                style={{ color: "hsl(215 30% 40%)" }}
              >
                Цифровые технологии, опытные врачи, гарантированный результат.
                Бесплатная 3D-диагностика при первом визите.
              </p>

              {/* Service tags */}
              <div className="flex flex-wrap gap-2 mb-10">
                {serviceTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: "hsl(215 50% 12% / 0.04)",
                      color: "hsl(215 40% 30%)",
                      border: "1px solid hsl(215 20% 85%)",
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "hsl(168 76% 42%)" }} />
                    {tag}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={600}>
              <div className="flex flex-wrap gap-4 mb-16">
                <Link
                  to="/contacts"
                  className="inline-flex items-center gap-2 rounded-xl px-10 py-5 text-lg font-semibold text-white transition-all duration-200 hover:opacity-90 group"
                  style={{ backgroundColor: "hsl(0 65% 51%)" }}
                >
                  Записаться на консультацию
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center rounded-xl px-10 py-5 text-lg font-semibold transition-all duration-200 border-2 hover:bg-gray-50"
                  style={{
                    color: "hsl(215 50% 12%)",
                    borderColor: "hsl(215 50% 12% / 0.18)",
                  }}
                >
                  Наши услуги
                </Link>
              </div>
            </ScrollReveal>

            {/* Stats */}
            <ScrollReveal delay={750}>
              <div
                className="flex flex-wrap gap-8 pt-8"
                style={{ borderTop: "1px solid hsl(215 20% 88%)" }}
              >
                {stats.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "hsl(168 76% 42% / 0.1)" }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: "hsl(168 76% 42%)" }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-tight" style={{ color: "hsl(215 50% 12%)" }}>
                        {item.value}
                      </p>
                      <p className="text-sm" style={{ color: "hsl(215 20% 55%)" }}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* ── Right: photo composition with 3D parallax ── */}
          <ScrollReveal animation="right" delay={200}>
            <div
              className="hidden lg:flex flex-col gap-3 will-change-transform"
              style={{
                transform: `perspective(1000px) rotateY(${x * 2}deg) rotateX(${-y * 2}deg)`,
                transition: "transform 0.1s ease-out",
              }}
            >

              {/* Main photo — facade slider */}
              <div
                className="relative overflow-hidden rounded-3xl w-full"
                style={{ boxShadow: "0 20px 60px hsl(215 50% 12% / 0.14)" }}
              >
                {facadeSlides.map((slide, i) => (
                  <img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-auto block transition-opacity duration-700"
                    style={{
                      position: i === 0 ? "relative" : "absolute",
                      inset: 0,
                      opacity: slideIndex === i ? 1 : 0,
                    }}
                  />
                ))}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, transparent 60%, hsl(215 50% 12% / 0.15) 100%)" }}
                />
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {facadeSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: slideIndex === i ? "20px" : "6px",
                        height: "6px",
                        backgroundColor: slideIndex === i ? "white" : "rgba(255,255,255,0.5)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Two interior photos side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="overflow-hidden rounded-2xl aspect-[4/3]"
                  style={{
                    boxShadow: "0 12px 40px hsl(215 50% 12% / 0.12)",
                    border: "3px solid white",
                  }}
                >
                  <img
                    src={interiorImage}
                    alt="Ресепшен клиники"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="overflow-hidden rounded-2xl aspect-[4/3]"
                  style={{
                    boxShadow: "0 12px 40px hsl(215 50% 12% / 0.12)",
                    border: "3px solid white",
                  }}
                >
                  <img
                    src={smileImage}
                    alt="Зона ожидания клиники"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

            </div>
          </ScrollReveal>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
        <span
          className="text-[10px] tracking-[0.2em] uppercase font-medium"
          style={{ color: "hsl(215 20% 68%)" }}
        >
          листайте
        </span>
        <ChevronDown
          className="w-4 h-4 animate-bounce"
          style={{ color: "hsl(215 20% 68%)" }}
        />
      </div>
    </section>
  );
};
