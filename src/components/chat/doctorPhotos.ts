import adamPhoto from '@/assets/фото врачей без фона/Адам Аскорбиевич.webp';
import alisultanovPhoto from '@/assets/фото врачей без фона/Алисултанов Арсен Русланович.webp';
import gayanePhoto from '@/assets/фото врачей без фона/Гаяне альбертовна.webp';
import zelimkhanPhoto from '@/assets/фото врачей без фона/зелемхан.webp';
import nataliaPhoto from '@/assets/фото врачей без фона/наталья игоревна.webp';
import podoprigoraPhoto from '@/assets/фото врачей без фона/Подопригора Оксана Викторовна.webp';
import prokopenkoPhoto from '@/assets/фото врачей без фона/Прокопенко Татьяна Маратовна.webp';
import tuguzPhoto from '@/assets/фото врачей без фона/Тугуз Зарема Байрамовна.webp';
import shovgenovPhoto from '@/assets/фото врачей без фона/Шовгенов Тембот Нальбиевич.webp';

type PhotoEntry = {
  photo: string;
  names: string[];
};

const PHOTO_ENTRIES: PhotoEntry[] = [
  {
    photo: prokopenkoPhoto,
    names: ['Прокопенко Татьяна Маратовна'],
  },
  {
    photo: podoprigoraPhoto,
    names: ['Подопригора Оксана Викторовна'],
  },
  {
    photo: nataliaPhoto,
    names: ['Овчинникова Наталья Игоревна', 'Наталья Игоревна'],
  },
  {
    photo: shovgenovPhoto,
    names: ['Шовгенов Тембот Нальбиевич'],
  },
  {
    photo: alisultanovPhoto,
    names: ['Алисултанов Арсен Русланович'],
  },
  {
    photo: gayanePhoto,
    names: ['Маркарьян Гаянэ Альбертовна', 'Гаяне Альбертовна'],
  },
  {
    photo: tuguzPhoto,
    names: ['Тугуз Зарема Байрамовна'],
  },
  {
    photo: adamPhoto,
    names: ['Петхишхов Адам Аскарбиевич', 'Адам Аскарбиевич'],
  },
  {
    photo: zelimkhanPhoto,
    names: ['Магомадов Зелимхан Тимур-Булатович', 'Зелимхан'],
  },
];

const doctorPhotoMap = new Map<string, string>();

for (const entry of PHOTO_ENTRIES) {
  for (const name of entry.names) {
    doctorPhotoMap.set(normalizeName(name), entry.photo);
  }
}

export function getDoctorPhoto(doctorName = ''): string | null {
  const normalized = normalizeName(doctorName);
  if (!normalized) return null;
  return doctorPhotoMap.get(normalized) ?? null;
}

function normalizeName(value = ''): string {
  return String(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
