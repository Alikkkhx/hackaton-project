import type { EmploymentType, ExperienceLevel } from "./types";

export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "KZT"
): string {
  const c = currency === "KZT" ? "₸" : currency;
  const fmt = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
  if (min && max) return `${fmt(min)}–${fmt(max)} ${c}`;
  if (min) return `от ${fmt(min)} ${c}`;
  if (max) return `до ${fmt(max)} ${c}`;
  return "По договорённости";
}

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  full_time: "Полная занятость",
  part_time: "Частичная",
  gig: "Подработка",
  internship: "Стажировка",
};

export const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  student: "Студент",
  no_exp: "Без опыта",
  junior: "До 3 лет",
  middle: "3–6 лет",
  senior: "6+ лет",
};

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`;
  return d.toLocaleDateString("ru-RU");
}

// --- Mangystau locations ---

export const MANGYSTAU_CITIES = [
  "Актау",
  "Жанаозен",
  "Бейнеу",
  "Курык",
  "Шетпе",
  "Форт-Шевченко",
  "Жетыбай",
  "Мунайлы",
];

export const AKTAU_DISTRICTS = [
  "Микрорайон 1",
  "Микрорайон 2",
  "Микрорайон 3",
  "Микрорайон 3А",
  "Микрорайон 3Б",
  "Микрорайон 4",
  "Микрорайон 5",
  "Микрорайон 6",
  "Микрорайон 6А",
  "Микрорайон 7",
  "Микрорайон 8",
  "Микрорайон 9",
  "Микрорайон 10",
  "Микрорайон 11",
  "Микрорайон 12",
  "Микрорайон 14",
  "Микрорайон 15",
  "Микрорайон 17",
  "Микрорайон 19",
  "Микрорайон 27",
  "Микрорайон 28",
  "Микрорайон 29",
  "Микрорайон 30",
  "Микрорайон 31",
  "Микрорайон 32",
  "Koktem",
  "Eleven",
  "Shygys",
  "Samal",
];

export const INDUSTRIES = [
  "HoReCa",
  "Ритейл",
  "Строительство",
  "Услуги / Красота",
  "Логистика",
  "Образование",
  "Авто",
  "IT",
  "Нефтегаз",
  "Здравоохранение",
  "Другое",
];
