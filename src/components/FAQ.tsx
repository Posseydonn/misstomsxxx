import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const faqs = [
  {
    q: "Больно ли лечить зубы?",
    a: "Нет. Все процедуры проводятся под современной анестезией — вы не почувствуете боли. Мы используем препараты последнего поколения, которые действуют мягко и предсказуемо. Если вы боитесь уколов — предупредите врача, и мы нанесём обезболивающий гель перед инъекцией.",
  },
  {
    q: "Сколько стоит первый визит?",
    a: "Первичная консультация и 3D-диагностика — бесплатно. На приёме врач осмотрит полость рта, сделает снимок (при необходимости) и составит план лечения с указанием точной стоимости каждого этапа. Никаких скрытых платежей.",
  },
  {
    q: "Как долго длится имплантация?",
    a: "Установка одного имплантата занимает 30–60 минут. Приживление длится от 2 до 4 месяцев — в это время вы живёте обычной жизнью. Временную коронку устанавливаем в день операции, чтобы эстетика не страдала.",
  },
  {
    q: "Есть ли гарантия на лечение?",
    a: "Да. На все виды протезирования и имплантацию мы даём гарантию от 1 года. На пломбы — от 1 года. Гарантия оформляется документально и распространяется на материалы и качество работы.",
  },
  {
    q: "Работаете ли вы по выходным?",
    a: "Да, работаем в субботу с 9:00 до 17:00. Воскресенье — выходной. В будние дни принимаем с 9:00 до 19:00. Записаться можно онлайн через ПроДокторов или позвонив по телефону.",
  },
  {
    q: "Можно ли оплатить лечение в рассрочку?",
    a: "Да, мы работаем с рассрочкой без переплат через банки-партнёры. Минимальная сумма для рассрочки — уточняйте у администратора. Также принимаем все виды банковских карт и наличные.",
  },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        border: open ? "1.5px solid hsl(0 65% 51% / 0.25)" : "1.5px solid hsl(215 20% 91%)",
        backgroundColor: open ? "hsl(0 65% 51% / 0.02)" : "white",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-300"
          style={{
            color: open ? "hsl(0 65% 51%)" : "hsl(215 20% 60%)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "300px" : "0", opacity: open ? 1 : 0 }}
      >
        <p className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm">{a}</p>
      </div>
    </div>
  );
};

export const FAQ = () => (
  <section className="py-16 md:py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 65% 97%) 0%, hsl(0 0% 100%) 40%, hsl(0 60% 95%) 70%, hsl(10 70% 96%) 100%)" }}>
      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 50%, hsl(0 75% 60% / 0.12) 0%, transparent 55%), radial-gradient(ellipse at 100% 20%, hsl(0 65% 55% / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 60% 100%, hsl(10 80% 65% / 0.07) 0%, transparent 45%)" }} />
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, hsl(0 65% 40%) 1px, transparent 0)", backgroundSize: "28px 28px" }} />

    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-12 items-start">
        <ScrollReveal animation="left">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-[1.1] mb-6">
            Часто задаваемые вопросы
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Отвечаем на самые популярные вопросы пациентов. Не нашли ответ — позвоните или напишите нам.
          </p>
          <a
            href="tel:+79282919455"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "hsl(0 65% 46%)" }}
          >
            Задать вопрос
          </a>
        </ScrollReveal>

        <ScrollReveal animation="right">
          <div className="flex flex-col gap-3">
            {faqs.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);
