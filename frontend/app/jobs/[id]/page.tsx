"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Loader2,
  MapPin,
} from "lucide-react";
import { api, getStoredUser } from "@/lib/api";
import type { Job, User } from "@/lib/types";
import {
  EMPLOYMENT_LABEL,
  EXPERIENCE_LABEL,
  formatRelative,
  formatSalary,
} from "@/lib/format";
import { RiskBadge } from "@/components/JobCard";
import Link from "next/link";

export default function JobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cover, setCover] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    api
      .getJob(params.id)
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const apply = async () => {
    if (!user) {
      router.push(`/login?next=/jobs/${params.id}`);
      return;
    }
    if (user.role !== "seeker") {
      setError("Откликаться могут только соискатели");
      return;
    }
    setApplying(true);
    setError(null);
    try {
      await api.apply({ job_id: params.id, cover_letter: cover });
      setApplied(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );

  if (!job)
    return (
      <div className="container-page py-10 text-center text-gray-500">
        Вакансия не найдена.{" "}
        <Link href="/jobs" className="text-brand-600">
          Назад к списку
        </Link>
      </div>
    );

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
      <article className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {job.employer_name ?? "Компания"}
                {job.employer_verified && (
                  <BadgeCheck className="h-4 w-4 text-brand-600" />
                )}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.city}
                {job.district ? `, ${job.district}` : ""}
              </span>
              <span>· {formatRelative(job.created_at)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">
              {formatSalary(job.salary_min, job.salary_max, job.currency)}
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="chip-brand">{job.industry}</span>
          <span className="chip">{EMPLOYMENT_LABEL[job.employment_type]}</span>
          <span className="chip">{EXPERIENCE_LABEL[job.experience]}</span>
          <RiskBadge score={job.risk_score} />
        </div>

        {job.risk_score >= 0.35 && job.risk_reasons.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              AI-предупреждение: возможные признаки мошенничества
            </div>
            <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed">
              {job.risk_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="prose max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
          {job.description}
        </div>

        {job.skills.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Навыки
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      <aside className="space-y-4">
        <div className="card">
          <h3 className="font-semibold">Отклик</h3>
          {applied ? (
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              Отклик отправлен! Работодатель получит уведомление в Telegram.
            </div>
          ) : (
            <>
              <textarea
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="Коротко о себе и почему подходишь (необязательно)"
                className="input mt-3 h-28"
              />
              {error && (
                <div className="mt-2 text-xs text-rose-600">{error}</div>
              )}
              <button
                onClick={apply}
                disabled={applying}
                className="btn-primary mt-3 w-full"
              >
                {applying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Откликнуться"
                )}
              </button>
              {!user && (
                <p className="mt-2 text-xs text-gray-500">
                  Нужно{" "}
                  <Link href="/login" className="text-brand-600">
                    войти
                  </Link>{" "}
                  или{" "}
                  <Link href="/register" className="text-brand-600">
                    зарегистрироваться
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </div>

        {job.contact && (
          <div className="card">
            <h3 className="font-semibold">Контакты работодателя</h3>
            <p className="mt-2 break-words text-sm text-gray-700">
              {job.contact}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Совет: откликайтесь через платформу — работодатель увидит вас в
              системе и сможет вернуться позже.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
