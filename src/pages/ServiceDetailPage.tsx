import { useParams, Navigate, Link } from "react-router-dom";
import { PageLayout } from "@/layouts/PageLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getServiceBySlug, services } from "@/data/services";
import { branches } from "@/data/contacts";
import {
  Check, ChevronDown, Phone, ArrowLeft, ArrowRight,
  Star, Shield, Award, MessageCircle, MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import clinicChair from "@/assets/orig_customized (2).webp";
import clinicKavoCT from "@/assets/clinic-kavo-ct.webp";
import clinicLounge from "@/assets/clinic-lounge.webp";

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: open ? "1.5px solid hsl(0 65% 51% / 0.3)" : "1.5px solid hsl(215 20% 92%)",
        backgroundColor: open ? "hsl(0 65% 51% / 0.03)" : "white",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-300"
          style={{
            color: open ? "hsl(0 65% 51%)" : "hsl(215 20% 60%)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "400px" : "0", opacity: open ? 1 : 0 }}
      >
        <p className="px-6 pb-5 text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const ServiceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  const service = slug ? getServiceBySlug(slug) : undefined;
  if (!service) return <Navigate to="/services" replace />;

  const currentIndex = services.findIndex((s) => s.slug === slug);
  const prevService = currentIndex > 0 ? services[currentIndex - 1] : null;
  const nextService = currentIndex < services.length - 1 ? services[currentIndex + 1] : null;

  return (
    <PageLayout>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(215 50% 10%) 0%, hsl(215 50% 16%) 100%)",
          paddingTop: "clamp(48px, 8vw, 88px)",
          paddingBottom: "clamp(48px, 8vw, 88px)",
        }}
      >
        {/* dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />
        {/* gradient glows */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, hsl(0 65% 51%), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(circle, hsl(168 76% 42%), transparent 70%)" }}
        />

        <div className="container mx-auto px-6 relative z-10">
          {/* breadcrumb */}
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-80"
            style={{ color: "hsl(0 0% 100% / 0.5)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Все услуги
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <ScrollReveal animation="left">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-5"
                style={{ backgroundColor: "hsl(0 65% 51% / 0.15)", color: "hsl(0 65% 70%)" }}
              >
                <service.icon className="w-3.5 h-3.5" />
                {service.title}
              </div>

              <h1
                className="font-bold leading-[1.1] mb-4"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "white" }}
              >
                {service.heroTitle}
              </h1>

              <p className="text-lg leading-relaxed mb-8" style={{ color: "hsl(0 0% 100% / 0.65)" }}>
                {service.heroSubtitle}
              </p>

              {/* Trust mini-badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                {["Без боли", "Гарантия результата", "Бесплатная консультация"].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5"
                    style={{ backgroundColor: "hsl(168 76% 42% / 0.15)", color: "hsl(168 76% 65%)" }}
                  >
                    <Check className="w-3 h-3" />
                    {t}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-5">
                <Link
                  to="/contacts"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, hsl(0 65% 51%), hsl(0 65% 42%))" }}
                >
                  Записаться бесплатно
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://wa.me/79282919455"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366", color: "white" }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Написать в WhatsApp
                </a>
              </div>

              <a
                href={`tel:${branches[0].phoneRaw}`}
                className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: "hsl(0 0% 100% / 0.55)" }}
              >
                <Phone className="w-3.5 h-3.5" />
                {branches[0].phone}
                <span style={{ color: "hsl(0 0% 100% / 0.35)" }}>· Пн–Пт 9:00–19:00</span>
              </a>
            </ScrollReveal>

            {/* Right — photo + details card */}
            <ScrollReveal animation="right">
              <div
                className="rounded-3xl overflow-hidden"
                style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}
              >
                {/* Photo */}
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={clinicChair}
                    alt="Клиника Мисс Стоматология"
                    className="w-full h-full object-cover object-center"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, transparent 30%, hsl(215 50% 13% / 0.95))" }}
                  />
                  {/* Spotlight overlay */}
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="font-black text-white leading-none" style={{ fontSize: "2rem" }}>
                        {service.spotlight.value}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                        {service.spotlight.label}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold rounded-full px-3 py-1 shrink-0"
                      style={{ backgroundColor: "hsl(0 65% 51%)", color: "white" }}
                    >
                      {service.price}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div
                  className="px-7 py-5 space-y-3"
                  style={{ backgroundColor: "hsl(0 0% 100% / 0.06)", backdropFilter: "blur(12px)" }}
                >
                  {service.details.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "hsl(168 76% 42% / 0.2)" }}
                      >
                        <Check className="w-3 h-3" style={{ color: "hsl(168 76% 60%)" }} />
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.75)" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rating row */}
                <div
                  className="flex items-center gap-3 px-7 py-4"
                  style={{
                    borderTop: "1px solid hsl(0 0% 100% / 0.08)",
                    backgroundColor: "hsl(0 0% 100% / 0.04)",
                  }}
                >
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ fill: "hsl(43 74% 55%)", color: "hsl(43 74% 55%)" }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    5.0 · 100+ отзывов на Яндекс.Картах
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Stats strip inside hero */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8"
            style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            {[
              { icon: Award, value: "15+ лет", label: "на рынке" },
              { icon: Shield, value: "от 1 года", label: "гарантия на работы" },
              { icon: Star, value: "5.0", label: "рейтинг клиники" },
              { icon: MapPin, value: "2 филиала", label: "в Майкопе" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "hsl(0 0% 100% / 0.08)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.6)" }} />
                </div>
                <div>
                  <p className="font-bold leading-none text-white">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVANTAGES — Bento Grid ── */}
      <section className="py-16 md:py-20" style={{ backgroundColor: "hsl(215 30% 98%)" }}>
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(168 76% 42%)" }}>
                Наши преимущества
              </p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(215 50% 12%)" }}>
                Почему выбирают нас
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-5">
            {/* Featured card — full width */}
            {service.advantages[0] && (
              <ScrollReveal delay={0}>
                <div
                  className="relative rounded-3xl p-8 md:p-10 overflow-hidden flex flex-col md:flex-row md:items-center gap-6 hover:-translate-y-0.5 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(135deg, hsl(0 65% 51% / 0.07) 0%, hsl(0 65% 51% / 0.02) 100%)",
                    border: "1.5px solid hsl(0 65% 51% / 0.18)",
                  }}
                >
                  {/* Decorative big number */}
                  <span
                    className="absolute -left-3 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none hidden md:block"
                    style={{ fontSize: "8rem", color: "hsl(0 65% 51% / 0.055)" }}
                  >
                    01
                  </span>
                  <div className="relative z-10 md:pl-6">
                    <div
                      className="w-10 h-0.5 rounded-full mb-4"
                      style={{ background: "hsl(0 65% 51%)" }}
                    />
                    <p className="text-xl font-semibold leading-snug" style={{ color: "hsl(215 50% 15%)" }}>
                      {service.advantages[0]}
                    </p>
                  </div>
                  {/* Right accent */}
                  <div
                    className="hidden md:block ml-auto shrink-0 w-1 self-stretch rounded-full"
                    style={{ background: "linear-gradient(to bottom, hsl(0 65% 51% / 0.4), hsl(0 65% 51% / 0))" }}
                  />
                </div>
              </ScrollReveal>
            )}

            {/* Remaining cards — 2×2 grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {service.advantages.slice(1).map((item, i) => (
                <ScrollReveal key={item} delay={(i + 1) * 80}>
                  <div
                    className="relative rounded-2xl p-6 h-full overflow-hidden hover:-translate-y-1 transition-transform duration-200"
                    style={{
                      backgroundColor: "white",
                      boxShadow: "0 2px 16px hsl(215 50% 12% / 0.06)",
                    }}
                  >
                    {/* Decorative number */}
                    <span
                      className="absolute -right-1 -bottom-3 font-black leading-none select-none pointer-events-none"
                      style={{ fontSize: "5rem", color: "hsl(215 50% 12% / 0.04)" }}
                    >
                      {String(i + 2).padStart(2, "0")}
                    </span>
                    {/* Accent line */}
                    <div
                      className="w-8 h-0.5 rounded-full mb-4"
                      style={{ background: i % 2 === 0 ? "hsl(168 76% 42%)" : "hsl(0 65% 51%)" }}
                    />
                    <p className="text-sm leading-relaxed font-medium relative z-10" style={{ color: "hsl(215 50% 18%)" }}>
                      {item}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MID-PAGE CTA ── */}
      <section className="py-8 bg-white" style={{ borderBottom: "1px solid hsl(215 20% 92%)" }}>
        <div className="container mx-auto px-6">
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-8 py-5"
            style={{ backgroundColor: "hsl(0 65% 51% / 0.05)", border: "1.5px solid hsl(0 65% 51% / 0.15)" }}
          >
            <div>
              <p className="font-semibold text-foreground">Готовы начать? Консультация бесплатно</p>
              <p className="text-sm text-muted-foreground mt-0.5">Врач осмотрит, ответит на вопросы и составит план без обязательств</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                to="/contacts"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "hsl(0 65% 46%)" }}
              >
                Записаться
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/79282919455"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS — with sticky photo ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(0 65% 51%)" }}>
                Этапы
              </p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(215 50% 12%)" }}>
                Как проходит лечение
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">
            {/* Timeline */}
            <div className="flex flex-col gap-0">
              {service.process.map((step, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <div
                    className="relative flex items-start gap-6 py-6"
                    style={{ borderBottom: i < service.process.length - 1 ? "1px solid hsl(215 20% 93%)" : "none" }}
                  >
                    {/* Big gradient number */}
                    <div className="shrink-0 w-16 text-right">
                      <span
                        className="font-black leading-none"
                        style={{
                          fontSize: "3rem",
                          background: `linear-gradient(135deg, hsl(${i * 25} 65% 55%), hsl(${i * 25 + 140} 60% 45%))`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    {/* Connector line */}
                    {i < service.process.length - 1 && (
                      <div
                        className="absolute left-[3.75rem] top-14 w-px"
                        style={{ height: "calc(100% - 3.5rem)", backgroundColor: "hsl(215 20% 90%)" }}
                      />
                    )}
                    <div className="pt-3 flex-1">
                      <p className="text-base font-medium leading-relaxed" style={{ color: "hsl(215 30% 25%)" }}>{step}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Sticky photo panel — desktop only */}
            <div className="hidden lg:block sticky top-24">
              <ScrollReveal animation="right">
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 8px 40px hsl(215 50% 12% / 0.12)" }}
                >
                  <img
                    src={clinicKavoCT}
                    alt="Современное оборудование клиники"
                    className="w-full object-cover"
                    style={{ height: "300px" }}
                  />
                  <div className="px-6 py-5" style={{ backgroundColor: "hsl(215 30% 98%)" }}>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "hsl(168 76% 42%)" }}
                    >
                      Современное оборудование
                    </p>
                    <p className="font-bold" style={{ color: "hsl(215 50% 12%)" }}>KAVO 3D КТ-сканер</p>
                    <p className="text-sm mt-1" style={{ color: "hsl(215 20% 55%)" }}>
                      Точность до 0,1 мм — безопасная диагностика без хирургии
                    </p>
                  </div>
                </div>

                {/* Quick trust block below photo */}
                <div
                  className="mt-4 rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{ backgroundColor: "hsl(0 65% 51% / 0.05)", border: "1px solid hsl(0 65% 51% / 0.12)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "hsl(0 65% 51% / 0.1)" }}
                  >
                    <Shield className="w-4 h-4" style={{ color: "hsl(0 65% 51%)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(215 50% 12%)" }}>Гарантия от 1 года</p>
                    <p className="text-xs" style={{ color: "hsl(215 20% 55%)" }}>на все виды работ</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS — 3 cards + photo card ── */}
      <section className="py-14" style={{ backgroundColor: "hsl(215 30% 98%)" }}>
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-8 text-center"
              style={{ color: "hsl(215 20% 55%)" }}
            >
              Отзывы пациентов
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              {
                name: "Ольга В.",
                text: "Хирург Шовгенов Тембот Нальбиевич приехал буквально через 15 минут — удалил зуб совершенно безболезненно. Вечером позвонили, спросили о самочувствии.",
                date: "март 2026",
              },
              {
                name: "Мария",
                text: "Обращалась с разными проблемами: кариес, реставрация, чистки — и всегда результат идеальный. Я нашла своего врача — Прокопенко Татьяна Маратовна!",
                date: "март 2026",
              },
              {
                name: "Диана К.",
                text: "Поставила виниры в Мисс Стоматологии. Врач внимательно выслушала пожелания, сделала красивую улыбку. Теперь не стесняюсь улыбаться!",
                date: "октябрь 2025",
              },
            ].map((r, i) => (
              <ScrollReveal key={r.name} delay={i * 80}>
                <div
                  className="relative rounded-2xl p-6 h-full overflow-hidden flex flex-col"
                  style={{
                    backgroundColor: "white",
                    boxShadow: "0 2px 16px hsl(215 50% 12% / 0.06)",
                    border: "1px solid hsl(215 20% 93%)",
                  }}
                >
                  {/* Decorative quote */}
                  <span
                    className="absolute top-2 right-4 font-serif font-black leading-none select-none pointer-events-none"
                    style={{ fontSize: "5rem", color: "hsl(0 65% 51% / 0.07)", lineHeight: 1 }}
                  >
                    "
                  </span>
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5" style={{ fill: "hsl(43 74% 55%)", color: "hsl(43 74% 55%)" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 relative z-10 flex-1" style={{ color: "hsl(215 30% 30%)" }}>
                    {r.text}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: "hsl(0 65% 51%)" }}
                      >
                        {r.name[0]}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "hsl(215 50% 12%)" }}>{r.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: "hsl(215 20% 60%)" }}>{r.date}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Photo card */}
            <ScrollReveal delay={240}>
              <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "220px" }}>
                <img
                  src={clinicLounge}
                  alt="Атмосфера клиники Мисс Стоматология"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, hsl(215 50% 8% / 0.9) 0%, hsl(215 50% 8% / 0.3) 55%, transparent 100%)",
                  }}
                />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-sm font-bold text-white mb-0.5">Атмосфера клиники</p>
                  <p className="text-xs mb-3" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Мисс Стоматология, Майкоп</p>
                  <a
                    href="https://yandex.ru/maps/1093/maykop/?ll=40.094420%2C44.609761&mode=poi&poi%5Bpoint%5D=40.093231%2C44.610231&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D180515477217%26yclid%3D10731887832526225407&z=18"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:underline transition-opacity hover:opacity-80"
                    style={{ color: "hsl(0 0% 100% / 0.8)" }}
                  >
                    Все отзывы на Яндекс.Картах
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FAQ — with red gradient background ── */}
      <section
        className="py-16 md:py-20 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(0 65% 97%) 0%, hsl(0 0% 100%) 40%, hsl(0 60% 95%) 70%, hsl(10 70% 96%) 100%)",
        }}
      >
        {/* Radial glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 10% 20%, hsl(0 65% 51% / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, hsl(0 65% 51% / 0.06) 0%, transparent 40%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, hsl(0 65% 51%) 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(0 65% 51%)" }}>
                  FAQ
                </p>
                <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(215 50% 12%)" }}>
                  Частые вопросы
                </h2>
              </div>
            </ScrollReveal>
            <div className="space-y-3">
              {service.faq.map((item, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <FaqItem q={item.q} a={item.a} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="py-16 md:py-20 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(350 80% 20%) 0%, hsl(0 70% 38%) 45%, hsl(12 85% 50%) 100%)",
        }}
      >
        {/* Radial glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 15% 60%, hsl(340 90% 40% / 0.5) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, hsl(20 100% 60% / 0.35) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
        />
        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold"
                style={{ backgroundColor: "hsl(0 0% 100% / 0.12)", color: "hsl(0 0% 100% / 0.85)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                Запись открыта — ближайший приём уже завтра
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-[1.15] mb-4">
                Бесплатная консультация<br />и 3D-диагностика
              </h2>
              <p className="text-lg mb-10" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                Тысячи пациентов уже доверяют нам свои улыбки. Присоединяйтесь
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/contacts"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold transition-opacity hover:opacity-90"
                  style={{ color: "hsl(0 65% 46%)" }}
                >
                  Записаться бесплатно
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://wa.me/79282919455"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366", color: "white" }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Написать в WhatsApp
                </a>
                <a
                  href={`tel:${branches[0].phoneRaw}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "hsl(0 0% 100% / 0.12)", color: "white", border: "1px solid hsl(0 0% 100% / 0.25)" }}
                >
                  <Phone className="w-4 h-4" />
                  {branches[0].phone}
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── NAVIGATION ── */}
      <section className="py-8 bg-white" style={{ borderTop: "1px solid hsl(215 20% 92%)" }}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            {prevService ? (
              <Link
                to={`/services/${prevService.slug}`}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground"
                style={{ color: "hsl(215 20% 55%)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                {prevService.title}
              </Link>
            ) : <div />}
            {nextService ? (
              <Link
                to={`/services/${nextService.slug}`}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground"
                style={{ color: "hsl(215 20% 55%)" }}
              >
                {nextService.title}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : <div />}
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default ServiceDetailPage;
