import { useEffect } from "react";
import { ScrollReveal } from "./ScrollReveal";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Ольга В.",
    date: "14 марта 2026",
    text: "Обратились в субботу с острой болью прямо к открытию. Оксана Викторовна Подопригора чётко и понятно объяснила ситуацию. Хирург Шовгенов Тембот Нальбиевич приехал буквально через 15 минут — удалил зуб совершенно безболезненно. Вечером позвонили, спросили о самочувствии. Все сотрудники внимательные и доброжелательные. Везде чистота и порядок!",
    rating: 5,
    service: "Удаление зуба",
  },
  {
    name: "Диана К.",
    date: "22 октября 2025",
    text: "Наша семья — постоянные пациенты клиники уже лет 12–13. Ходим к Наталье Игоревне Овчинниковой с детьми — всегда найдёт общий язык с ребёнком. Сама лечилась у Оксаны Викторовны, безумно довольна. Замечательный хирург Адам Байзетович — удалил зуб мудрости за считанные секунды. Очень хорошая клиника, зарекомендовавшая себя только с хорошей стороны!",
    rating: 5,
    service: "Семейная стоматология",
  },
  {
    name: "Мария",
    date: "9 марта 2026",
    text: "Много лет посещаю данную клинику. В клинике всегда чисто и светло, доброжелательная атмосфера. Обращалась с разными проблемами: кариес, реставрация, чистки — и всегда результат идеальный. Я нашла своего врача — Прокопенко Татьяна Маратовна! Всегда предлагает разные варианты лечения и объясняет плюсы и минусы каждого. Рекомендовать могу только эту клинику. Спасибо за мою улыбку!",
    rating: 5,
    service: "Реставрация",
  },
  {
    name: "Ксения Колосовская",
    date: "10 февраля 2026",
    text: "Лечила зубы, делала чистку, ставили пломбу — всё прошло абсолютно безболезненно, все манипуляции были с анестезией, я не чувствовала дискомфорта. Доктор Оксана Викторовна очень спокойная, располагала к себе. Для меня главное, чтобы не было больно, а здесь это полностью удалось.",
    rating: 5,
    service: "Лечение",
  },
];

export const Reviews = () => {
  useEffect(() => {
    const old = document.getElementById("pd-widget-big-script");
    if (old) old.remove();

    const script = document.createElement("script");
    script.id = "pd-widget-big-script";
    script.src = "https://prodoctorov.ru/static/js/widget_big.js?v7";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <section id="reviews" className="py-12 md:py-16">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Отзывы</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              Что говорят наши пациенты
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review, i) => (
            <ScrollReveal key={review.name} delay={i * 100}>
              <div className="bg-background rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed flex-1 mb-6">«{review.text}»</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">{review.name}</span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <span className="text-xs font-medium text-accent">{review.service}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* External widgets */}
        <ScrollReveal delay={400}>
          <div className="mt-14">
            <p
              className="text-center text-sm font-medium mb-8 uppercase tracking-widest"
              style={{ color: "hsl(215 20% 60%)" }}
            >
              Нас оценивают на независимых платформах
            </p>

            <div className="grid md:grid-cols-2 gap-8 items-start">

              {/* Yandex Maps reviews widget */}
              <div style={{ width: "100%", height: 800, overflow: "hidden", position: "relative" }}>
                <iframe
                  style={{ width: "100%", height: "100%", border: "1px solid #e6e6e6", borderRadius: 8, boxSizing: "border-box" }}
                  src="https://yandex.ru/maps-reviews-widget/180515477217?comments"
                  title="Отзывы на Яндекс Картах"
                />
                <a
                  href="https://yandex.ru/maps/org/miss_stomatologiya/180515477217/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ boxSizing: "border-box", textDecoration: "none", color: "#b3b3b3", fontSize: 10, fontFamily: "YS Text,sans-serif", padding: "0 16px", position: "absolute", bottom: 8, width: "100%", textAlign: "center", left: 0, overflow: "hidden", textOverflow: "ellipsis", display: "block", maxHeight: 14, whiteSpace: "nowrap" }}
                >
                  Мисс стоматология на карте Майкопа — Яндекс Карты
                </a>
              </div>

              {/* ProDoctors big widget */}
              <div style={{ height: 800, overflow: "hidden", position: "relative", border: "1px solid #e6e6e6", borderRadius: 8 }}>
              <div
                id="pd_widget_big"
                data-lpu="103758"
                style={{ height: "100%", overflowY: "auto" }}
              >
                <div className="pd_rate_header">
                  Отзывы о «Мисс Стоматология» на Адыгейской<br />
                  <a target="_blank" rel="noopener noreferrer" className="pd_rate_new" href="https://prodoctorov.ru/new/rate/lpu/103758/">
                    Оставить отзыв
                  </a>
                </div>
                <div id="pd_widget_big_content" />
                <a target="_blank" rel="noopener noreferrer" href="https://prodoctorov.ru/maykop/lpu/103758-miss-stomatologiya-na-adygyayskoy/#otzivi" className="pd_read_all">
                  Читать все отзывы
                </a>
                <span id="pd_powered_by">
                  <a target="_blank" rel="noopener noreferrer" href="https://prodoctorov.ru">
                    <img className="pd_logo" src="https://prodoctorov.ru/static/_v1/pd/logos/logo-pd-widget.png" alt="ПроДокторов" />
                  </a>
                </span>
              </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
