---
name: project-progress
description: Полный прогресс разработки сайта Мисс Стоматология — все фазы, UX-фиксы, текущее состояние
type: project
---

Масштабная разработка сайта стоматологической клиники "Мисс Стоматология" (г. Майкоп).

**Why:** Сайт строился с нуля, затем проходил визуальную переработку и UX-аудит.
**How to apply:** При дальнейших изменениях учитывать весь проделанный путь и текущую архитектуру.

## Фаза 1–6: Визуальная переработка (завершено)

### Фундамент
- `src/hooks/useMouseParallax.ts` — 3D-параллакс по движению мыши с lerp-сглаживанием
- `src/index.css` — базовый font-size 17px, keyframes, section-divider-wave
- `tailwind.config.ts` — container max-width 1536px

### Hero
- Удалены 4 дублирующихся виджета, увеличен блок фото (680px), 3D-параллакс, увеличены CTA

### Services
- 9 услуг с hover-эффектами, градиентная линия, карточки-ссылки на `/services/:slug`

### Process ("5 шагов к идеальной улыбке")
- Bento-сетка 3+2, пастельные фоны, watermark-цифры (opacity 0.07), перемещён под Services

### Страницы услуг
- `src/data/services.ts` — данные 9 услуг (details, advantages, process, faq)
- `src/pages/ServiceDetailPage.tsx` — Hero, 2 колонки, этапы, FAQ, CTA, prev/next навигация
- Маршрут `/services/:slug` в App.tsx

## Фаза 7: LoadingScreen (завершено)

- `src/components/LoadingScreen.tsx` — переработан в стиле hollywoodsmile.ru:
  - Белый фон, точечная сетка, декоративные кольца
  - Логотип `/logo.png` (fade-in + scale), градиентная линия red→teal, надпись "Мисс Стоматология"
  - Шторка уезжает вверх (translateY), ~2.8s, state machine: enter→visible→shrink→slideUp→done
- `src/index.css` — keyframes: ls-line-grow, ls-logo-in, ls-text-in, ls-shrink, ls-slide-up, ls-line-pulse
- `public/logo.png` — логотип скопирован из корня в public

## Фаза 8: UX/UI аудит и фиксы (завершено)

### ScrollToTop
- `ServiceDetailPage.tsx` — добавлен `useEffect` по `slug` → `window.scrollTo({ top: 0 })`

### Централизация контактов
- **Создан** `src/data/contacts.ts` — реальные данные: Майкоп, 2 филиала (Адыгейская 15, Чкалова 74), телефоны, график
- Обновлены: Navbar, Footer, Contact, StickyCTA, ServiceDetailPage, Hero — все импортируют из contacts.ts

### Footer
- Ссылки на услуги теперь ведут на `/services/:slug`
- Оба филиала с адресами и телефонами
- Год динамический: `new Date().getFullYear()`

### BeforeAfter
- Убраны одинаковые фото (`smile-after.jpg` ×5)
- Заменены на цветные текстовые карточки-кейсы: иконка процедуры, имя, цитата, бейдж результата
- 5 уникальных пастельных фонов

### Contact форма
- Toast уведомления вместо `alert()`
- Маска телефона: автоформат `+7 (___) ___-__-__`
- Визуальная валидация: красная рамка на пустых полях
- Dropdown: все 9 услуг из `services.ts` + Консультация
- **EmailJS** (`@emailjs/browser`) настроен и работает — ключи в `src/components/Contact.tsx`
- Спиннер при отправке, обработка ошибок

## Фаза 9: Реальные фотографии клиники (завершено 2026-03-26)

### Hero — реальные фото
- Слайдер фасадов: `clinic-facade.webp` + `об-3370.webp`, auto-advance 4000ms, fade-переход, dot-индикаторы

### About — полная переработка компоновки
- Баннер-фасад на всю ширину с градиентом, заголовком поверх и бейджем "18+ лет"
- 3 колонки: фото ресепшена | текст + фичи-карточки + CTA | 2 фото стопкой
- Видео `clinic-video.mov` (в `public/`) с `controls playsInline preload="none"`, постер: `clinic-consultation.webp`

### Исправления контента
- Убрано "собственная зуботехническая лаборатория" везде
- Убрано "лечение под седацией" и "закись азота" везде
- "Игровая комната" → "Игровая зона"
- Гарантия "до 5 лет" / "пожизненная" → "от 1 года" везде
- KaVo (Германия) вместо Planmeca (Финляндия) в диагностике

## Фаза 10: Контент, виджеты, врачи (завершено 2026-03-27)

### TrustStrip
- Nobel Biocare → Osstem, Straumann → Dentis
- Рейтинг 4.9 → 5.0, "18+ лет" → "15+ лет"
- Лицензия → Л041-01168-01/01249070

### Reviews
- 4 реальных отзыва с Яндекс.Карт (с именами, датами, реальными услугами)
- **Яндекс.Карты виджет**: `iframe src="https://yandex.ru/maps-reviews-widget/180515477217?comments"` (height 800px)
- **ProDoctors big виджет**: `data-lpu="103758"`, скрипт `widget_big.js?v7` перезагружается при монтировании
- Оба виджета рядом в grid md:grid-cols-2, высота 800px

### Navbar
- Кнопка "Результаты" убрана из навигации
- Логотип: `<img src="/logo.png">` вместо буквы "М"
- WhatsApp: `https://wa.me/79282919455`
- Max: ссылка на профиль

### Doctors — полная переработка
- 9 реальных врачей с фото без фона (конвертированы в WebP)
- Дизайн: тёмно-зелёный фон карточки, номер 01–09 полупрозрачно, info снаружи под карточкой
- Сетка 3 колонки на десктопе, `loading="lazy" decoding="async"`

### ServiceDetailPage — редизайн
- Hero: фото `orig_customized (2).webp` (object-cover object-center, h-72)
- Stats strip внизу hero-секции
- Advantages: bento grid (первая карточка sm:col-span-2)
- Process: `lg:grid-cols-[1fr_360px]` — таймлайн слева, sticky-фото `clinic-kavo-ct.webp` справа
- Reviews: 3 карточки + 1 фото `clinic-lounge.webp`
- FAQ: красный градиентный фон с radial-glows и dot-grid

## Фаза 11: Оптимизация производительности (завершено 2026-04-06)

### Изображения → WebP
Все PNG и тяжёлые JPG конвертированы через `sharp`:
- Адам Аскорбиевич.png: **15.8 MB → 39 KB** (−99%)
- Все PNG врачей: суммарно ~36 MB → ~1.5 MB
- clinic-facade.jpg: 2 MB → 156 KB
- clinic-consultation.jpg → WebP
- об-3370.jpg, об-3464.jpg, об-3533.jpg → WebP
- orig_customized (2).jpg → WebP (124 KB)
- Все импорты в Doctors.tsx, Hero.tsx, About.tsx, ServiceDetailPage.tsx обновлены

### Видео
- `IMG_5126.MOV` убран из бандла Vite
- Скопирован в `public/clinic-video.mov`, src="/clinic-video.mov", `preload="none"`

### JS бандл
- Удалён `@tanstack/react-query` (не использовался, ~30 KB)
- Все страницы (`Index`, `ServiceDetailPage`, `DoctorsPage` и др.) переведены на `React.lazy` + `Suspense`
- Бандл: 444 KB (один чанк) → 285 KB вендор + мелкие чанки по страницам

## Текущая архитектура

### Порядок секций на главной
Hero → TrustStrip → Services → Process → Doctors → BeforeAfter → Reviews → About → Contact

### Маршруты (App.tsx) — все lazy
- `/` — Index
- `/services` — ServicesPage
- `/services/:slug` — ServiceDetailPage (9 услуг)
- `/doctors`, `/reviews`, `/about`, `/contacts` — отдельные страницы
- `*` — NotFound

### Ключевые данные
- `src/data/services.ts` — 9 услуг с полными описаниями
- `src/data/contacts.ts` — 2 филиала с телефонами и mapsUrl
- `src/assets/фото врачей без фона/` — WebP врачей (9 файлов)
- `src/assets/clinic-*.webp` — фото интерьера/фасада (все WebP)
- `public/clinic-video.mov` — видео клиники (не бандлится)

## Фаза 12: Адаптация под мобильные устройства (завершено 2026-04-06)

### Hero — двойной макет (mobile + desktop)
- **Проблема**: на мобильном текст шёл первым, фото — далеко внизу
- **Решение**: полностью разделены два JSX-дерева: `lg:hidden` (мобильный) и `hidden lg:flex` (десктоп)
- Мобильный порядок: бейдж → h1 (`clamp(2.4rem, 12vw, 3rem)`) → фото 16:9 → описание → 2 CTA кнопки full-width → 3-колоночная статистика без иконок
- Фото-контейнер: `aspectRatio: "16/9"`, слайды `position: absolute, inset: 0, object-cover`
- `pt-[72px]` (navbar height), нет `min-h-screen` на мобильном
- Десктоп: без изменений (параллакс, ScrollReveal, side-by-side)

### Services — компактные карточки на мобильном
- Grid: `grid-cols-2` на мобильном (было 1 колонка)
- Padding: `p-4 sm:p-6 lg:p-10`
- Описание: `hidden sm:block` (скрыто на мобильном)
- Ссылка "Узнать стоимость →": `hidden sm:inline`
- Иконка: `w-9 h-9 sm:w-14 sm:h-14`
- Заголовок: `text-sm sm:text-2xl`

### Все секции — уменьшены вертикальные отступы на мобильном
- `py-16` → `py-10 md:py-20` во всех секциях (Process, BeforeAfter, Reviews, FAQ, About, Contact)
- h2 заголовки: адаптивные классы `text-2xl md:text-4xl lg:text-5xl`
- Карточки Reviews: `p-5 md:p-8`
- Contact панели: `p-6 md:p-12`

### Билд
- `npm run build` — `✓ built in 2.25s`, без ошибок

## Что ещё не сделано
- BeforeAfter: заменить текстовые кейсы на реальные фото до/после
- `/privacy` — страница политики конфиденциальности (нужна для формы)
- Уникальный контент для `/doctors`, `/reviews`, `/about` страниц
- Яндекс.Карты iframe с переключателем филиалов в Contact
- SEO meta tags per-page

## Фаза 13: Чат-бот записи + Medflex/GigaChat + редизайн карточки слотов (завершено 2026-04-08)

### Backend: детерминированная выдача расписания
- Для запросов расписания в `server/routes/chat.js` используется отдельная детерминированная ветка вместо свободной генерации ответа.
- Добавлен разбор запроса по врачу и дате (`parseAvailabilityQuery`), включая форматы `dd.mm`, `dd/mm`, `dd-mm`, а также `сегодня` и `завтра`.
- В `onlineDoctors` остаются только врачи, подтверждённые каталогом клиники (`DOCTOR_CATALOG`), исключён fallback формата `Врач #ID`.
- Для сценария "врач есть в каталоге, но без online-id" выдаётся офлайн-врач без ложного онлайн-расписания.
- Для фильтра `врач + дата` снят лимит превью и возвращается полный набор слотов за день.
- Исправлена нормализация русских токенов в парсере (`normalizeRu`).

### Frontend: чат и логика выбора слота
- Цепочка выбора слота внедрена полностью: `ChatWidget -> ChatMessage -> AvailabilityCard`.
- При клике по времени автоматически отправляется сообщение формата `Запиши меня к {врач} на {дата} в {время}`.
- При `isTyping=true` кнопки времени блокируются, чтобы убрать повторные отправки.
- Добавлен сценарий CTA для отсутствия онлайн-окон с передачей заявки администратору.

### UX/UI карточки свободных окон
- Карточка приведена к единой стилистике сайта: `rounded-2xl`, светлый surface, `shadow-card`, контрастная шапка `bg-clinic-gradient`.
- Внутри карточки появились фильтры врача и даты, сгруппированные периоды дня и явные пустые состояния.
- Добавлен блок врачей без онлайн-окон через `details/summary`, свернутый по умолчанию.
- Создан маппинг `doctorName -> photo` в `src/components/chat/doctorPhotos.ts`.

### Проверка результата
- `npm run build` — успешно.
- `npm run test` — успешно.
- Локальный UI готов к ручной QA-проверке сценариев записи.

### Ключевые изменённые файлы
- `server/routes/chat.js`
- `src/components/chat/AvailabilityCard.tsx`
- `src/components/chat/ChatMessage.tsx`
- `src/components/chat/ChatWidget.tsx`
- `src/components/chat/BookingCard.tsx`
- `src/components/chat/TypingIndicator.tsx`
- `src/components/chat/doctorPhotos.ts`
- `src/hooks/useChat.ts`

## Фаза 14: Стабилизация чата записи + первый слой conversation state (в процессе, 2026-04-09)

### Надёжность backend
- `server/services/gigachat.js` усилен таймаутами, повторными попытками, сбросом токена на `401` и circuit breaker логикой на нестабильных ответах, чтобы чат не отваливался целиком при временных проблемах модели.
- `server/services/redis.js` переведён в тихий `in-memory fallback`, а `server/services/postgres.js` — в `degraded mode`, чтобы локальная разработка не ломала сценарии записи при отсутствии Redis и PostgreSQL.
- `server/index.js` ослабляет локальные ограничения разработки, чтобы QA-сценарии не упирались в rate limit на `localhost`.

### UX записи и тон общения
- После выбора слота чат больше не просит писать имя и телефон одним сообщением, а показывает отдельную форму с именем и номером в формате `+7`.
- Детерминированные ответы переписаны в более человеческом, спокойном тоне, чтобы чат звучал как единый администратор клиники, а не набор шаблонов.
- Отмена записи и подтверждение контактов вынесены в более предсказуемые и безопасные ветки без лишней зависимости от модели.

### Первый слой conversation state
- В `server/routes/chat.js` начат переход от phrase-based routing к state-based логике.
- Для сценария зубной боли добавлено состояние диалога с базовыми полями: `topic`, `stage`, `recommendedSpecialist`, `nextAction`.
- Благодаря этому сценарии вида `болит зуб -> когда сплю -> да, давайте` и `болит зуб -> когда жую -> да, давайте` больше не сбрасываются в общий fallback-вопрос.
- Старые триггерные ветки пока сохранены как страховка, но основной вектор переведён на управление через состояние разговора.

### Что дальше по чату
- Расширить `conversationState` на сценарии имплантации, ортопедии, отсутствующего зуба, отмены и вопросов по ценам.
- Дать GigaChat структурированное действие поверх текста, чтобы backend мог безопасно исполнять `ask_followup`, `show_availability`, `show_booking_form`, `confirm_booking`.
- Добавить интеграционные тесты на ключевые ветки: симптомный triage, выбор слота, форма контактов, подтверждение и отмена.
