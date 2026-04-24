"use client";

import { AKTAU_DISTRICTS, INDUSTRIES } from "@/lib/format";
import { Search } from "lucide-react";

export interface FilterState {
  q: string;
  district: string;
  industry: string;
  employment_type: string;
  experience: string;
  salary_min: string;
}

export const EMPTY_FILTERS: FilterState = {
  q: "",
  district: "",
  industry: "",
  employment_type: "",
  experience: "",
  salary_min: "",
};

export default function Filters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const set = (k: keyof FilterState, v: string) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="card space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Поиск: бариста, водитель, МКР 11…"
          value={value.q}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Район Актау
          </label>
          <select
            className="input"
            value={value.district}
            onChange={(e) => set("district", e.target.value)}
          >
            <option value="">Любой</option>
            {AKTAU_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Сфера
          </label>
          <select
            className="input"
            value={value.industry}
            onChange={(e) => set("industry", e.target.value)}
          >
            <option value="">Любая</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Тип занятости
          </label>
          <select
            className="input"
            value={value.employment_type}
            onChange={(e) => set("employment_type", e.target.value)}
          >
            <option value="">Любой</option>
            <option value="full_time">Полная</option>
            <option value="part_time">Частичная</option>
            <option value="gig">Подработка</option>
            <option value="internship">Стажировка</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Опыт
          </label>
          <select
            className="input"
            value={value.experience}
            onChange={(e) => set("experience", e.target.value)}
          >
            <option value="">Любой</option>
            <option value="student">Студент</option>
            <option value="no_exp">Без опыта</option>
            <option value="junior">До 3 лет</option>
            <option value="middle">3–6 лет</option>
            <option value="senior">6+ лет</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Зарплата от (₸)
        </label>
        <input
          type="number"
          inputMode="numeric"
          className="input"
          placeholder="например, 200000"
          value={value.salary_min}
          onChange={(e) => set("salary_min", e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => onChange(EMPTY_FILTERS)}
      >
        Сбросить фильтры
      </button>
    </div>
  );
}
