"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";
import type { Job } from "@/lib/types";
import JobCard from "@/components/JobCard";
import { Loader2, Plus } from "lucide-react";

export default function EmployerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login?next=/employer");
      return;
    }
    if (user.role !== "employer") {
      router.push("/");
      return;
    }
    api
      .myJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="container-page py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Кабинет работодателя</h1>
          <p className="text-sm text-gray-500">
            Ваши вакансии и входящие отклики.
          </p>
        </div>
        <Link href="/employer/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Новая вакансия
        </Link>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center text-sm text-gray-500">
          У вас пока нет вакансий.{" "}
          <Link href="/employer/new" className="text-brand-600">
            Создайте первую
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((j) => (
            <div key={j.id} className="space-y-1">
              <JobCard job={j} />
              <div className="flex justify-end">
                <Link
                  href={`/employer/jobs/${j.id}/applications`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Посмотреть отклики →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
