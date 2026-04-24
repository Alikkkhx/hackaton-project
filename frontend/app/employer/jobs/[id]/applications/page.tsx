"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getStoredUser } from "@/lib/api";
import type { ApplicationWithSeeker } from "@/lib/types";
import { Loader2, Mail, Phone } from "lucide-react";
import { formatRelative } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pending: "Новый",
  viewed: "Просмотрен",
  accepted: "Принят",
  rejected: "Отклонён",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [apps, setApps] = useState<ApplicationWithSeeker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push(`/login?next=/employer/jobs/${id}/applications`);
      return;
    }
    api
      .applicationsForJob(id)
      .then(setApps)
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateStatus = async (appId: string, status: string) => {
    const updated = await api.updateApplicationStatus(appId, status);
    setApps((prev: ApplicationWithSeeker[]) =>
      prev.map((a: ApplicationWithSeeker) =>
        a.id === appId ? { ...a, status: updated.status } : a
      )
    );
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold">Отклики</h1>
      <p className="text-sm text-gray-500">
        Всего откликов: {apps.length}
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="card mt-6 text-center text-sm text-gray-500">
          Пока нет откликов.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {apps.map((a: ApplicationWithSeeker) => (
            <div key={a.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{a.seeker.full_name}</div>
                  {a.seeker_profile && (
                    <div className="text-sm text-gray-500">
                      {a.seeker_profile.headline || "—"} · {a.seeker_profile.district || "Район не указан"}
                    </div>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-gray-400">
                    {a.seeker.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {a.seeker.email}
                      </span>
                    )}
                    {a.seeker.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {a.seeker.phone}
                      </span>
                    )}
                    <span>· {formatRelative(a.created_at)}</span>
                  </div>
                </div>
                <span className="chip-brand">{STATUS_LABEL[a.status]}</span>
              </div>

              {a.cover_letter && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {a.cover_letter}
                </div>
              )}

              {a.seeker_profile?.skills?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {a.seeker_profile.skills.map((s: string) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(a.id, "accepted")}
                  className="btn-primary"
                >
                  Принять
                </button>
                <button
                  onClick={() => updateStatus(a.id, "viewed")}
                  className="btn-secondary"
                >
                  Отметить просмотренным
                </button>
                <button
                  onClick={() => updateStatus(a.id, "rejected")}
                  className="btn-ghost text-rose-600"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
