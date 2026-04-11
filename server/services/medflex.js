import { DOCTOR_CATALOG } from '../config/clinic.js';

const BASE_URL = process.env.MEDFLEX_API_URL || 'https://api.medflex.ru';

function headers() {
  return {
    Authorization: `Token ${process.env.MEDFLEX_CLINIC_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers: headers() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Medflex ${options.method || 'GET'} ${path} -> ${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getSchedule({ lpuIds, specialityIds, dateStart, days = 14, timesOfDay } = {}) {
  const q = new URLSearchParams();
  if (lpuIds) q.set('lpu_ids', lpuIds);
  if (specialityIds) q.set('speciality_ids', specialityIds);
  if (dateStart) q.set('date_start', dateStart);
  q.set('days', String(days));
  if (timesOfDay?.length) {
    timesOfDay.forEach((value) => q.append('times_of_day', value));
  }
  if (process.env.MEDFLEX_TOWN_ID) {
    q.set('town_id', process.env.MEDFLEX_TOWN_ID);
  }

  const data = await apiFetch(`/schedule/?${q}`);
  return data?.data ?? [];
}

export async function createAppointment({
  fullName,
  phone,
  preferredTime = '',
  service = '',
  doctorId,
  doctorName = '',
  lpuId,
  specialityId,
  price = 0,
  selectedSlot = null,
}) {
  const timesOfDay = inferTimesOfDay(preferredTime || selectedSlot?.time || '');
  const scheduleRows = await getSchedule({
    lpuIds: String(lpuId),
    specialityIds: String(specialityId),
    days: 14,
    timesOfDay,
  });

  const slot = pickBestSlot(scheduleRows, doctorId, lpuId, preferredTime, selectedSlot);
  if (!slot) {
    throw new Error('Нет доступных слотов в расписании Medflex');
  }

  const { firstName, secondName, lastName } = parseName(fullName);
  const cleanPhone = normalizePhone(phone);

  const body = {
    doctor: {
      id: slot.doctor_id,
      lpu_id: slot.lpu_id,
      speciality_id: specialityId,
    },
    appointment: {
      dt_start: slot.dt_start,
      dt_end: slot.dt_end,
      price,
      comment: service ? `Услуга: ${service}. Записан через чат сайта.` : 'Записан через чат сайта.',
    },
    client: {
      first_name: firstName,
      last_name: lastName,
      mobile_phone: cleanPhone,
      ...(secondName && { second_name: secondName }),
    },
  };

  const result = await apiFetch('/direct_appointment/doctor/execute/', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const claimId = result?.claim_id;
  const [datePart, timePart] = slot.dt_start.split(' ');
  const resolvedDoctorName =
    doctorName ||
    DOCTOR_CATALOG.find((doctor) => doctor.medflex_doctor_id === slot.doctor_id)?.name ||
    String(slot.doctor_id);

  return {
    date: datePart,
    time: timePart?.slice(0, 5) ?? '',
    doctor: resolvedDoctorName,
    confirmationCode: claimId ?? '',
  };
}

export async function cancelAppointment(claimId) {
  return apiFetch('/direct_appointment/doctor/cancel/', {
    method: 'POST',
    body: JSON.stringify({ uuid: claimId }),
  });
}

export async function getAvailabilityDigest({
  lpuId,
  days = 7,
  maxSlotsPerDoctor = 8,
  doctorIds = [],
  dateIso = '',
} = {}) {
  const scheduleRows = await getSchedule({ lpuIds: String(lpuId), days });

  const doctorByMedflexId = new Map(
    DOCTOR_CATALOG.filter((doctor) => Number.isInteger(doctor.medflex_doctor_id)).map((doctor) => [
      doctor.medflex_doctor_id,
      doctor,
    ])
  );

  const onlineDoctors = scheduleRows
    .filter((row) => row.lpu_id === lpuId && Array.isArray(row.cells) && row.cells.length > 0)
    .filter((row) => doctorIds.length === 0 || doctorIds.includes(row.doctor_id))
    .map((row) => {
      const knownDoctor = doctorByMedflexId.get(row.doctor_id);
      if (!knownDoctor) return null;

      const filteredCells = dateIso
        ? row.cells.filter((cell) => String(cell.dt_start).startsWith(`${dateIso} `))
        : row.cells;

      return {
        doctorId: row.doctor_id,
        name: knownDoctor.name,
        role: knownDoctor.role,
        specialityIds: row.specialities || [],
        totalSlots: filteredCells.length,
        slots: filteredCells.slice(0, maxSlotsPerDoctor).map((cell) => formatSlot(cell.dt_start)),
      };
    })
    .filter(Boolean)
    .filter((row) => row.totalSlots > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  const onlineIds = new Set(onlineDoctors.map((doctor) => doctor.doctorId));
  const offlineDoctors = DOCTOR_CATALOG.filter((doctor) => {
    if (doctorIds.length && Number.isInteger(doctor.medflex_doctor_id)) {
      return doctorIds.includes(doctor.medflex_doctor_id) && !onlineIds.has(doctor.medflex_doctor_id);
    }
    return !Number.isInteger(doctor.medflex_doctor_id) || !onlineIds.has(doctor.medflex_doctor_id);
  }).map((doctor) => ({ name: doctor.name, role: doctor.role }));

  return {
    onlineDoctors,
    offlineDoctors,
    filters: { doctorIds, dateIso },
  };
}

function inferTimesOfDay(preferredTime = '') {
  const lower = preferredTime.toLowerCase();
  if (lower.includes('утр')) return ['morning'];
  if (lower.includes('вечер')) return ['evening'];
  if (lower.includes('день') || lower.includes('дн')) return ['afternoon'];
  return [];
}

function pickBestSlot(scheduleRows, doctorId, lpuId, preferredTime = '', selectedSlot = null) {
  let rows = scheduleRows.filter(
    (row) => row.doctor_id === doctorId && row.lpu_id === lpuId && row.cells?.length
  );
  if (!rows.length) {
    rows = scheduleRows.filter((row) => row.lpu_id === lpuId && row.cells?.length);
  }
  if (!rows.length) return null;

  if (selectedSlot?.dateIso && selectedSlot?.time) {
    const target = `${selectedSlot.dateIso} ${selectedSlot.time}`;
    for (const row of rows) {
      const exactCell = row.cells.find((cell) => String(cell.dt_start).startsWith(target));
      if (exactCell) {
        return { ...exactCell, doctor_id: row.doctor_id, lpu_id: row.lpu_id };
      }
    }
  }

  const lower = preferredTime.toLowerCase();
  for (const row of rows) {
    for (const cell of row.cells) {
      const hour = parseInt(cell.dt_start.split(' ')[1]?.split(':')[0] ?? '0', 10);
      if (lower.includes('утр') && (hour < 9 || hour >= 12)) continue;
      if (lower.includes('вечер') && (hour < 16 || hour >= 20)) continue;
      if ((lower.includes('день') || lower.includes('дн')) && (hour < 12 || hour >= 16)) continue;
      return { ...cell, doctor_id: row.doctor_id, lpu_id: row.lpu_id };
    }
  }

  return { ...rows[0].cells[0], doctor_id: rows[0].doctor_id, lpu_id: rows[0].lpu_id };
}

function parseName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) {
    return { lastName: parts[0], firstName: parts[1], secondName: parts.slice(2).join(' ') };
  }
  if (parts.length === 2) {
    return { lastName: parts[0], firstName: parts[1], secondName: '' };
  }
  return { firstName: parts[0] || 'Пациент', lastName: '', secondName: '' };
}

function normalizePhone(phone = '') {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) return `7${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 11) return digits;
  if (digits.length === 10) return `7${digits}`;
  return digits.slice(0, 13);
}

function formatSlot(dtStart) {
  const [datePart, timePart] = String(dtStart).split(' ');
  if (!(datePart && timePart)) return String(dtStart);
  const [yyyy, mm, dd] = datePart.split('-');
  return `${dd}.${mm}.${yyyy} ${timePart.slice(0, 5)}`;
}

export { normalizePhone };
