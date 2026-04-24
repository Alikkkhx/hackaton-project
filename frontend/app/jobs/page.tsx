"use client";

import { useEffect, useMemo, useState } from "react";
import Filters, { EMPTY_FILTERS, FilterState } from "@/components/Filters";
import JobCard from "@/components/JobCard";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function JobsPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      q: filters.q,
      district: filters.district,
      industry: filters.industry,
      employment_type: filters.employment_type,
      experience: filters.experience,
      salary_min: filters.salary_min ? Number(filters.salary_min) : undefined,
      limit: 50,
    }),
    [filters]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      api
        .listJobs(params)
        .then((data) => {
          if (!cancelled) setJobs(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Ошибка загрузки");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [params]);

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Вакансии Мангистау</h1>
        <p className="text-sm text-gray-500">
          Найдено: {jobs.length}. Данные обновляются в реальном времени из БД.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Filters value={filters} onChange={setFilters} />
        </aside>

        <section>
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="card text-center text-sm text-gray-500">
              По вашим фильтрам ничего не нашли. Попробуйте их сбросить.
            </div>
          ) : (
            <div className="grid gap-3">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
