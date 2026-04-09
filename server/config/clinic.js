/**
 * Clinic data and Medflex mappings.
 */

export const CLINIC = {
  name: 'Мисс Стоматология',
  city: 'Майкоп',
  branches: [
    {
      id: 'adygeyskaya',
      name: 'Филиал на Адыгейской',
      address: 'г. Майкоп, ул. Адыгейская, 15',
      phone: '+7 (928) 291-94-55',
      medflex_lpu_id: 103758,
    },
    {
      id: 'chkalova',
      name: 'Филиал на Чкалова',
      address: 'г. Майкоп, ул. Чкалова, 74',
      phone: '+7 (928) 463-88-15',
      medflex_lpu_id: null,
    },
  ],
  hours: 'Пн–Пт: 9:00–19:00, Сб: 9:00–17:00',
  unavailable: ['седация', 'лаборатория', 'воскресенье'],
};

export const DOCTOR_CATALOG = [
  {
    id: 'prokopenko',
    name: 'Прокопенко Татьяна Маратовна',
    role: 'Терапевт-эндодонтист, реставратор',
    medflex_doctor_id: null,
    speciality_ids: [305],
  },
  {
    id: 'podoprigora',
    name: 'Подопригора Оксана Викторовна',
    role: 'Терапевт-эндодонтист',
    medflex_doctor_id: 981249,
    speciality_ids: [305],
  },
  {
    id: 'ovchinnikova',
    name: 'Овчинникова Наталья Игоревна',
    role: 'Детский стоматолог',
    medflex_doctor_id: null,
    speciality_ids: [305],
  },
  {
    id: 'shovgenov',
    name: 'Шовгенов Тембот Нальбиевич',
    role: 'Хирург-имплантолог',
    medflex_doctor_id: 1348226,
    speciality_ids: [49],
  },
  {
    id: 'alisultanov',
    name: 'Алисултанов Арсен Русланович',
    role: 'Стоматолог-ортопед',
    medflex_doctor_id: 1348227,
    speciality_ids: [47],
  },
  {
    id: 'markaryan',
    name: 'Маркарьян Гаянэ Альбертовна',
    role: 'Терапевт-эндодонтист',
    medflex_doctor_id: null,
    speciality_ids: [305],
  },
  {
    id: 'tuguz',
    name: 'Тугуз Зарема Байрамовна',
    role: 'Терапевт-эндодонтист',
    medflex_doctor_id: null,
    speciality_ids: [305],
  },
  {
    id: 'petkhishkhov',
    name: 'Петхишхов Адам Аскарбиевич',
    role: 'Врач-стоматолог',
    medflex_doctor_id: null,
    speciality_ids: [305],
  },
  {
    id: 'magomadov',
    name: 'Магомадов Зелимхан Тимур-Булатович',
    role: 'Стоматолог-терапевт',
    medflex_doctor_id: null,
    speciality_ids: [305],
  },
];

export const MEDFLEX_DEFAULTS = {
  lpu_id: 103758,
  doctor_id: 981249,
  speciality_id: 305,
  price: 500,
};

export const SERVICE_MEDFLEX_MAP = {
  implantation: { lpu_id: 103758, speciality_id: 49, doctor_id: 1348226, price: 1000 },
  veneers: { lpu_id: 103758, speciality_id: 47, doctor_id: 1348227, price: 1000 },
  braces: { lpu_id: 103758, speciality_id: 47, doctor_id: 1348227, price: 1000 },
  hygiene: { lpu_id: 103758, speciality_id: 305, doctor_id: 981249, price: 500 },
  treatment: { lpu_id: 103758, speciality_id: 305, doctor_id: 981249, price: 500 },
  whitening: { lpu_id: 103758, speciality_id: 305, doctor_id: 981249, price: 500 },
  pediatric: { lpu_id: 103758, speciality_id: 305, doctor_id: 981249, price: 500 },
  diagnostics: { lpu_id: 103758, speciality_id: 305, doctor_id: 981249, price: 500 },
  prosthetics: { lpu_id: 103758, speciality_id: 47, doctor_id: 1348227, price: 1000 },
};

export const SERVICES = [
  {
    slug: 'implantation',
    name: 'Имплантация',
    priceFrom: 45000,
    priceLabel: 'от 45 000 ₽',
    doctorSpecialty: 'хирург-имплантолог',
    details: 'Импланты Osstem и Dentis. Одномоментная имплантация, All-on-4, All-on-6.',
  },
  {
    slug: 'veneers',
    name: 'Виниры',
    priceFrom: 35000,
    priceLabel: 'от 35 000 ₽ за один винир',
    doctorSpecialty: 'врач-ортопед',
    details: 'Ультратонкие виниры E-max. Цифровое моделирование улыбки.',
  },
  {
    slug: 'braces',
    name: 'Брекеты и элайнеры',
    priceFrom: 120000,
    priceLabel: 'от 120 000 ₽ за курс',
    doctorSpecialty: 'ортодонт',
    details: 'Элайнеры Invisalign, брекеты Damon Clear и Damon Q.',
  },
  {
    slug: 'hygiene',
    name: 'Профгигиена',
    priceFrom: 6500,
    priceLabel: 'от 6 500 ₽',
    doctorSpecialty: 'врач-гигиенист',
    details: 'Air Flow + ультразвук. 60 минут — полная чистка.',
  },
  {
    slug: 'treatment',
    name: 'Лечение зубов',
    priceFrom: 5000,
    priceLabel: 'от 5 000 ₽',
    doctorSpecialty: 'терапевт',
    details: 'Лечение под микроскопом. Кариес, пульпит, периодонтит.',
  },
  {
    slug: 'whitening',
    name: 'Отбеливание',
    priceFrom: 18000,
    priceLabel: 'от 18 000 ₽',
    doctorSpecialty: 'врач-терапевт',
    details: 'Zoom 4. До 8 тонов за 1 визит. Безопасно для эмали.',
  },
  {
    slug: 'pediatric',
    name: 'Детская стоматология',
    priceFrom: 3500,
    priceLabel: 'от 3 500 ₽',
    doctorSpecialty: 'детский стоматолог',
    details: 'Принимаем с 1 года. Лечение без страха, с анестезией и играми.',
  },
  {
    slug: 'diagnostics',
    name: '3D-диагностика',
    priceFrom: 2500,
    priceLabel: 'от 2 500 ₽',
    doctorSpecialty: 'врач-рентгенолог',
    details: 'КТ-снимок за 15 секунд. Оборудование KaVo (Германия).',
  },
  {
    slug: 'prosthetics',
    name: 'Протезирование',
    priceFrom: 25000,
    priceLabel: 'от 25 000 ₽ за коронку',
    doctorSpecialty: 'врач-ортопед',
    details: 'Коронки из циркония E-max, мосты, съёмные протезы. Срок изготовления 3–7 дней.',
  },
];

export function formatServicesForPrompt() {
  return SERVICES.map(
    (s) => `• ${s.name}: ${s.priceLabel} (специалист: ${s.doctorSpecialty}). ${s.details}`
  ).join('\n');
}

export function formatContactsForPrompt() {
  return CLINIC.branches
    .map((b) => `• ${b.name}: ${b.address}, тел. ${b.phone}`)
    .join('\n');
}
