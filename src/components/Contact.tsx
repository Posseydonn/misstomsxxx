import { useState } from "react";
import { MapPin, Phone, Clock, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import { branches, HOURS } from "@/data/contacts";

const EMAILJS_SERVICE_ID = "service_z20ipmw";
const EMAILJS_TEMPLATE_ID = "template_yto4eg3";
const EMAILJS_PUBLIC_KEY = "7GbbQUoaXgWMBQGWv";

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const d = digits.startsWith("7") ? digits.slice(1) : digits.startsWith("8") ? digits.slice(1) : digits;
  let result = "+7";
  if (d.length > 0) result += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) result += `)`;
  if (d.length > 3) result += ` ${d.slice(3, 6)}`;
  if (d.length > 6) result += `-${d.slice(6, 8)}`;
  if (d.length > 8) result += `-${d.slice(8, 10)}`;
  return result;
};

const pdLinks = [
  {
    name: "Филиал на Адыгейской",
    address: "ул. Адыгейская, 15",
    url: "https://prodoctorov.ru/maykop/lpu/103758-miss-stomatologiya-na-adygyayskoy/",
  },
  {
    name: "Филиал на Чкалова",
    address: "ул. Чкалова, 74",
    url: "https://prodoctorov.ru/maykop/lpu/67868-miss-stomatologiya-na-chkalova/",
  },
];

export const Contact = () => {
  const [tab, setTab] = useState<"booking" | "callback">("booking");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, phone: formatPhone(e.target.value) });
    if (errors.phone) setErrors({ ...errors, phone: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (form.phone.replace(/\D/g, "").length < 11) newErrors.phone = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSending(true);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: form.name,
        phone: form.phone,
        service: "Обратный звонок",
        branch: "Не указан",
        to_email: "info@misstom.ru",
      }, EMAILJS_PUBLIC_KEY);
      toast.success("Спасибо! Перезвоним в ближайшее время.", { duration: 5000 });
      setForm({ name: "", phone: "" });
      setErrors({});
    } catch {
      toast.error("Не удалось отправить заявку. Позвоните нам напрямую.", { duration: 5000 });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contacts" className="py-10 md:py-20 bg-surface">
      <div className="container mx-auto px-6">
        <div className="overflow-hidden rounded-3xl shadow-elevated" style={{ minHeight: 480 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">

            {/* ── LEFT: Red panel ── */}
            <div
              className="relative flex flex-col justify-between p-6 md:p-12"
              style={{ background: "linear-gradient(160deg, hsl(0 65% 46%) 0%, hsl(0 72% 34%) 100%)" }}
            >
              {/* dot grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.07]"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 0)", backgroundSize: "20px 20px" }}
              />

              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                  Контакты
                </p>
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-6 md:mb-10">
                  Запишитесь на<br />бесплатную<br />консультацию
                </h2>

                <div className="flex flex-col gap-7">
                  {branches.map((b) => (
                    <div key={b.phoneRaw} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">{b.name}</span>
                      </div>
                      <a
                        href={b.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-medium text-sm hover:underline underline-offset-2"
                        style={{ textDecorationColor: "hsl(0 0% 100% / 0.5)" }}
                      >
                        {b.address}
                      </a>
                      <a
                        href={`tel:${b.phoneRaw}`}
                        className="flex items-center gap-1.5 text-white font-bold text-lg hover:opacity-80 transition-opacity"
                      >
                        <Phone className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.7)" }} />
                        {b.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2 mt-10" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-sm">{HOURS}</span>
              </div>
            </div>

            {/* ── RIGHT: Tabbed panel ── */}
            <div className="bg-background flex flex-col p-6 md:p-12">

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ backgroundColor: "hsl(215 20% 95%)" }}>
                {(["booking", "callback"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: tab === t ? "white" : "transparent",
                      color: tab === t ? "hsl(0 0% 15%)" : "hsl(215 20% 50%)",
                      boxShadow: tab === t ? "0 1px 4px hsl(215 20% 80% / 0.5)" : "none",
                    }}
                  >
                    {t === "booking" ? "Онлайн-запись" : "Обратный звонок"}
                  </button>
                ))}
              </div>

              {/* Tab: Booking */}
              {tab === "booking" && (
                <div className="flex flex-col gap-3 flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Выберите филиал — откроется форма записи на ПроДокторов
                  </p>
                  {pdLinks.map((b) => (
                    <a
                      key={b.url}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: "hsl(215 20% 90%)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "hsl(0 65% 51%)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(0 65% 51% / 0.03)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "hsl(215 20% 90%)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "";
                      }}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{b.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{b.address}</p>
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors duration-200"
                        style={{ backgroundColor: "hsl(0 65% 51% / 0.08)", color: "hsl(0 65% 46%)" }}
                      >
                        Записаться →
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Tab: Callback */}
              {tab === "callback" && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Оставьте номер — перезвоним в течение 15 минут
                  </p>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: false }); }}
                    className={`w-full rounded-xl border ${errors.name ? "border-red-400 ring-2 ring-red-400/20" : "border-border"} bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200`}
                    placeholder="Ваше имя"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handlePhone}
                    className={`w-full rounded-xl border ${errors.phone ? "border-red-400 ring-2 ring-red-400/20" : "border-border"} bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200`}
                    placeholder="+7 (___) ___-__-__"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 mt-auto"
                    style={{ backgroundColor: "hsl(0 65% 46%)" }}
                  >
                    {sending
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Отправка...</>
                      : <><Send className="w-4 h-4" />Перезвоните мне</>
                    }
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                  </p>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
