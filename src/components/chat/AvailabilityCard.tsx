import { useEffect, useMemo, useState } from 'react';
import type { AvailabilityPayload } from '@/hooks/useChat';
import { getDoctorPhoto } from './doctorPhotos';

interface AvailabilityCardProps {
  availability: AvailabilityPayload;
  isTyping?: boolean;
  onSlotPick?: (slot: SlotPickPayload) => void;
  onAdminRequest?: () => void;
}

export interface SlotPickPayload {
  doctorName: string;
  date: string;
  time: string;
}

type Slot = {
  date: string;
  time: string;
};

type NormalizedDoctor = {
  doctorId: number;
  name: string;
  shortName: string;
  role: string;
  totalSlots: number;
  slotsParsed: Slot[];
  photo: string | null;
  initials: string;
};

type TimeGroup = {
  id: 'morning' | 'day' | 'evening';
  title: string;
  range: string;
  fromHour: number;
  toHour: number;
};

const TIME_GROUPS: TimeGroup[] = [
  { id: 'morning', title: 'Утро', range: '09:00–11:59', fromHour: 9, toHour: 11 },
  { id: 'day', title: 'День', range: '12:00–15:59', fromHour: 12, toHour: 15 },
  { id: 'evening', title: 'Вечер', range: '16:00–19:59', fromHour: 16, toHour: 19 },
];

export function AvailabilityCard({
  availability,
  isTyping = false,
  onSlotPick,
  onAdminRequest,
}: AvailabilityCardProps) {
  const doctors = useMemo<NormalizedDoctor[]>(
    () =>
      availability.onlineDoctors
        .map((doctor) => {
          const normalizedName = normalizeDoctorName(doctor.name);
          if (!isRenderableLabel(normalizedName)) return null;

          const slotsParsed = doctor.slots
            .map(parseSlot)
            .filter((slot): slot is Slot => Boolean(slot))
            .filter((slot) => isRenderableLabel(slot.date) && isRenderableLabel(slot.time));

          if (slotsParsed.length === 0) return null;

          const normalizedRole = normalizeRole(doctor.role);
          return {
            doctorId: doctor.doctorId,
            name: normalizedName,
            shortName: shortName(normalizedName),
            role: normalizedRole || 'Специалист клиники',
            totalSlots:
              Number.isFinite(doctor.totalSlots) && doctor.totalSlots > 0
                ? doctor.totalSlots
                : slotsParsed.length,
            slotsParsed,
            photo: getDoctorPhoto(normalizedName),
            initials: buildInitials(normalizedName),
          };
        })
        .filter((doctor): doctor is NormalizedDoctor => Boolean(doctor)),
    [availability.onlineDoctors]
  );

  const offlineDoctors = useMemo(
    () =>
      availability.offlineDoctors
        .map((doctor) => {
          const normalizedName = normalizeDoctorName(doctor.name);
          if (!isRenderableLabel(normalizedName)) return null;
          return {
            name: normalizedName,
            shortName: shortName(normalizedName),
            role: normalizeRole(doctor.role) || 'Специалист клиники',
          };
        })
        .filter((doctor): doctor is { name: string; shortName: string; role: string } =>
          Boolean(doctor)
        ),
    [availability.offlineDoctors]
  );

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [localSlotLock, setLocalSlotLock] = useState(false);

  useEffect(() => {
    if (!isTyping) setLocalSlotLock(false);
  }, [isTyping]);

  useEffect(() => {
    if (!doctors.length) {
      setDoctorId(null);
      return;
    }
    if (!doctors.some((doctor) => doctor.doctorId === doctorId)) {
      setDoctorId(doctors[0].doctorId);
    }
  }, [doctors, doctorId]);

  const activeDoctor = useMemo(
    () => doctors.find((doctor) => doctor.doctorId === doctorId) ?? doctors[0] ?? null,
    [doctors, doctorId]
  );

  const dates = useMemo(() => {
    if (!activeDoctor) return [];
    const unique = new Set(activeDoctor.slotsParsed.map((slot) => slot.date).filter(isRenderableLabel));
    return Array.from(unique).sort((a, b) => sortable(a) - sortable(b));
  }, [activeDoctor]);

  useEffect(() => {
    if (!dates.length) {
      setSelectedDate('');
      return;
    }
    if (!selectedDate || !dates.includes(selectedDate)) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  const timesOnDate = useMemo(() => {
    if (!activeDoctor || !selectedDate) return [];
    const unique = new Set(
      activeDoctor.slotsParsed
        .filter((slot) => slot.date === selectedDate)
        .map((slot) => slot.time)
        .filter(isRenderableLabel)
    );
    return Array.from(unique).sort();
  }, [activeDoctor, selectedDate]);

  const groupedTimes = useMemo(
    () =>
      TIME_GROUPS.map((group) => ({
        ...group,
        times: timesOnDate.filter((time) => {
          const hour = hourFromTime(time);
          return hour >= group.fromHour && hour <= group.toHour;
        }),
      })),
    [timesOnDate]
  );

  const slotButtonsDisabled = isTyping || localSlotLock || !onSlotPick;

  const handleSlotPick = (time: string) => {
    if (!activeDoctor || !selectedDate || slotButtonsDisabled) return;
    setLocalSlotLock(true);
    onSlotPick?.({
      doctorName: activeDoctor.name,
      date: selectedDate,
      time,
    });
  };

  if (!activeDoctor) {
    return (
      <div className="mt-2 rounded-2xl border border-[hsl(39_79%_75%)] bg-[hsl(44_90%_95%)] p-3 shadow-card">
        <p className="text-xs leading-relaxed text-[hsl(35_72%_28%)]">
          Сейчас нет онлайн-окон в расписании. Могу передать вашу заявку администратору.
        </p>
        <button
          type="button"
          onClick={() => onAdminRequest?.()}
          disabled={isTyping || !onAdminRequest}
          className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-[hsl(39_79%_60%)] bg-white px-3 text-xs font-semibold text-[hsl(35_72%_30%)] transition-colors duration-150 hover:bg-[hsl(44_100%_97%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(39_79%_60%)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Передать заявку администратору
        </button>
        <OfflineDoctorsDetails doctors={offlineDoctors} />
      </div>
    );
  }

  const slotsCountLabel = `${timesOnDate.length} на дату`;

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[hsl(0_0%_90%)] bg-white shadow-card">
      <div className="bg-clinic-gradient px-3 py-2 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold">Свободные окна</p>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
            {slotsCountLabel}
          </span>
        </div>
      </div>

      <div className="space-y-3 bg-[hsl(var(--clinic-surface))] p-3">
        <section>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-1.5">
              {doctors.map((doctor) => {
                if (!isRenderableLabel(doctor.shortName)) return null;
                const isActive = doctor.doctorId === activeDoctor.doctorId;
                return (
                  <button
                    key={doctor.doctorId}
                    type="button"
                    onClick={() => setDoctorId(doctor.doctorId)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-full border pl-1.5 pr-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--clinic-red))] ${
                      isActive
                        ? 'border-[hsl(var(--clinic-red))] bg-[hsl(var(--clinic-red))] text-white'
                        : 'border-[hsl(214_18%_81%)] bg-white text-[hsl(var(--clinic-navy-mid))] hover:border-[hsl(var(--clinic-red))]'
                    }`}
                  >
                    <DoctorAvatar
                      name={doctor.name}
                      photo={doctor.photo}
                      initials={doctor.initials}
                      isActive={isActive}
                    />
                    <span className="text-xs font-semibold leading-tight">{doctor.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[hsl(0_0%_90%)] bg-white p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-tight text-[hsl(var(--clinic-navy))]">
                {activeDoctor.name}
              </p>
              <p className="mt-0.5 text-xs text-[hsl(215_20%_45%)]">{activeDoctor.role}</p>
            </div>
            <span className="rounded-full bg-[hsl(var(--clinic-teal-light))] px-2 py-0.5 text-[11px] font-semibold text-[hsl(168_74%_28%)]">
              {`${activeDoctor.totalSlots} всего`}
            </span>
          </div>

          {dates.length > 0 ? (
            <div className="mt-2.5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[hsl(215_30%_42%)]">
                Дата
              </p>
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-max gap-1.5">
                  {dates.map((dateValue) => {
                    const label = dateValue.slice(0, 5);
                    if (!isRenderableLabel(label)) return null;
                    const isActive = dateValue === selectedDate;
                    const weekday = weekdayShort(dateValue);

                    return (
                      <button
                        key={dateValue}
                        type="button"
                        onClick={() => setSelectedDate(dateValue)}
                        className={`inline-flex min-h-9 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--clinic-teal))] ${
                          isActive
                            ? 'border-[hsl(var(--clinic-teal))] bg-[hsl(var(--clinic-teal))] text-white'
                            : 'border-[hsl(168_24%_78%)] bg-[hsl(168_76%_96%)] text-[hsl(168_64%_26%)] hover:border-[hsl(var(--clinic-teal))]'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="text-[11px] opacity-90">{weekday || 'день'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-[hsl(0_0%_88%)] bg-[hsl(0_0%_98%)] px-2.5 py-2 text-xs text-[hsl(215_20%_45%)]">
              Не удалось распознать валидные даты в расписании. Покажу ближайшие окна в чате.
            </p>
          )}

          <div className="mt-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[hsl(215_30%_42%)]">
              Время
            </p>

            {timesOnDate.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[hsl(0_0%_88%)] bg-[hsl(0_0%_98%)] px-2.5 py-2 text-xs text-[hsl(215_20%_45%)]">
                На выбранную дату свободных онлайн-окон нет.
              </p>
            ) : (
              <div className="space-y-2">
                {groupedTimes.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-lg border border-[hsl(210_16%_90%)] bg-[hsl(210_33%_98%)] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(215_30%_35%)]">
                        {group.title}
                      </p>
                      <span className="text-[11px] text-[hsl(215_16%_52%)]">{group.range}</span>
                    </div>

                    {group.times.length > 0 ? (
                      <div className="mt-1.5 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                        {group.times.map((time) => (
                          <button
                            key={`${selectedDate}-${group.id}-${time}`}
                            type="button"
                            onClick={() => handleSlotPick(time)}
                            disabled={slotButtonsDisabled}
                            className={`min-h-9 rounded-lg border px-1 text-center text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--clinic-red))] ${
                              slotButtonsDisabled
                                ? 'cursor-not-allowed border-[hsl(0_0%_85%)] bg-[hsl(0_0%_96%)] text-[hsl(215_12%_55%)] opacity-50'
                                : 'border-[hsl(0_0%_86%)] bg-white text-[hsl(var(--clinic-navy-mid))] hover:border-[hsl(var(--clinic-red))] hover:text-[hsl(var(--clinic-red-dark))]'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-[hsl(215_16%_52%)]">Нет окон</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <OfflineDoctorsDetails doctors={offlineDoctors} />
      </div>
    </div>
  );
}

function OfflineDoctorsDetails({
  doctors,
}: {
  doctors: Array<{ name: string; shortName: string; role: string }>;
}) {
  if (!doctors.length) return null;

  return (
    <details className="rounded-xl border border-[hsl(43_55%_82%)] bg-[hsl(43_74%_95%)] p-2.5">
      <summary className="cursor-pointer text-xs font-semibold text-[hsl(43_74%_30%)]">
        Без онлайн-окон ({doctors.length})
      </summary>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {doctors.map((doctor) => (
          <span
            key={`${doctor.name}-${doctor.role}`}
            className="rounded-full border border-[hsl(43_48%_78%)] bg-white px-2 py-0.5 text-[11px] text-[hsl(43_70%_28%)]"
            title={`${doctor.name} - ${doctor.role}`}
          >
            {doctor.shortName}
          </span>
        ))}
      </div>
    </details>
  );
}

function DoctorAvatar({
  name,
  photo,
  initials,
  isActive,
}: {
  name: string;
  photo: string | null;
  initials: string;
  isActive: boolean;
}) {
  if (photo) {
    return (
      <span className="block h-8 w-8 overflow-hidden rounded-full border border-white/40 bg-white/30">
        <img src={photo} alt={name} className="h-full w-full object-cover object-top" loading="lazy" />
      </span>
    );
  }

  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
        isActive ? 'bg-white/25 text-white' : 'bg-[hsl(0_0%_96%)] text-[hsl(var(--clinic-navy-mid))]'
      }`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function parseSlot(raw: string): Slot | null {
  const match = String(raw).trim().match(/^(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})$/);
  if (!match) return null;
  return {
    date: match[1],
    time: match[2],
  };
}

function normalizeDoctorName(value = ''): string {
  const normalized = String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  if (/^(врач|doctor)\s*#?\d+$/i.test(normalized)) return '';
  if (/^(undefined|null|nan)$/i.test(normalized)) return '';
  return normalized;
}

function normalizeRole(value = ''): string {
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortName(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0] ?? '';
}

function buildInitials(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean).slice(0, 2);
  const value = parts.map((part) => part[0]?.toUpperCase()).join('');
  return value || 'ВР';
}

function weekdayShort(dmy: string): string {
  const [dd, mm, yyyy] = dmy.split('.');
  const dt = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return '';
  const map = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  return map[dt.getDay()] ?? '';
}

function sortable(dmy: string): number {
  const [dd, mm, yyyy] = dmy.split('.');
  if (!(dd && mm && yyyy)) return Number.MAX_SAFE_INTEGER;
  return Number(`${yyyy}${mm}${dd}`);
}

function hourFromTime(time: string): number {
  const hour = Number.parseInt(time.slice(0, 2), 10);
  return Number.isFinite(hour) ? hour : -1;
}

function isRenderableLabel(value = ''): boolean {
  const normalized = String(value).trim();
  if (!normalized) return false;
  return !/^[-–—._\s]+$/.test(normalized);
}
