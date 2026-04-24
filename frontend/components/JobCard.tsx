import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { Job } from "@/lib/types";
import {
  EMPLOYMENT_LABEL,
  EXPERIENCE_LABEL,
  formatRelative,
  formatSalary,
} from "@/lib/format";

export function RiskBadge({ score }: { score: number }) {
  if (score >= 0.7)
    return (
      <span className="chip-red">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Высокий риск
      </span>
    );
  if (score >= 0.35)
    return (
      <span className="chip-yellow">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Проверьте
      </span>
    );
  return null;
}

export default function JobCard({
  job,
  reason,
  score,
}: {
  job: Job;
  reason?: string;
  score?: number;
}) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card group flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700">
            {job.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.employer_name ?? "Компания"}
              {job.employer_verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />
              )}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.city}
              {job.district ? `, ${job.district}` : ""}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">
            {formatSalary(job.salary_min, job.salary_max, job.currency)}
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            {formatRelative(job.created_at)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="chip-brand">{job.industry}</span>
        <span className="chip">{EMPLOYMENT_LABEL[job.employment_type]}</span>
        <span className="chip">{EXPERIENCE_LABEL[job.experience]}</span>
        <RiskBadge score={job.risk_score} />
      </div>

      {reason && typeof score === "number" && (
        <div className="mt-1 rounded-lg bg-brand-50/70 px-3 py-2 text-xs text-brand-800">
          <div className="mb-0.5 flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" />
            AI-подбор · совпадение {Math.round(score * 100)}%
          </div>
          <div className="text-[12px] leading-snug text-brand-900/80">
            {reason}
          </div>
        </div>
      )}
    </Link>
  );
}
