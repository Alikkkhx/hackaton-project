"use client";

import { AKTAU_DISTRICTS, INDUSTRIES, MANGYSTAU_CITIES } from "@/lib/format";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

export interface FilterState {
  q: string;
  city: string;
  district: string;
  industry: string;
  employment_type: string;
  experience: string;
  salary_min: string;
}

export const EMPTY_FILTERS: FilterState = {
  q: "",
  city: "",
  district: "",
  industry: "",
  employment_type: "",
  experience: "",
  salary_min: "",
};

function FilterFields({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const set = (k: keyof FilterState, v: string) =>
    onChange({ ...value, [k]: v });

  const isAktau = !value.city || value.city === "Актау" || value.city === "Aktau";

  return (
    <div className="space-y-4">
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
            Город / населённый пункт
          </label>
          <select
            className="input"
            value={value.city}
            onChange={(e) => {
              set("city", e.target.value);
              if (e.target.value && e.target.value !== "Актау" && e.target.value !== "Aktau") {
                onChange({ ...value, city: e.target.value, district: "" });
              }
            }}
          >
            <option value="">Все города</option>
            {MANGYSTAU_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Район{isAktau ? " Актау" : ""}
          </label>
          <select
            className="input"
            value={value.district}
            onChange={(e) => set("district", e.target.value)}
            disabled={!isAktau}
          >
            <option value="">Любой</option>
            {isAktau &&
              AKTAU_DISTRICTS.map((d) => (
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

export default function Filters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = Object.values(value).filter((v) => v !== "").length;

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:block card">
        <FilterFields value={value} onChange={onChange} />
      </div>

      {/* Mobile: button + drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => setDrawerOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Фильтры{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        {drawerOpen && (
          <>
            <div className="filter-backdrop" onClick={() => setDrawerOpen(false)} />
            <div className="filter-drawer">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Фильтры</h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="btn-ghost p-2"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterFields
                value={value}
                onChange={(next) => {
                  onChange(next);
                }}
              />
              <button
                type="button"
                className="btn-primary w-full mt-4"
                onClick={() => setDrawerOpen(false)}
              >
                Показать результаты
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
