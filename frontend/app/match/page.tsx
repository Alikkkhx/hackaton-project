"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser } from "@/lib/api";
import type { MatchItem } from "@/lib/types";
import JobCard from "@/components/JobCard";
import { Loader2, Sparkles } from "lucide-react";

export default function MatchPage() {
  const router = useRouter();
  const [items, setItems] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login?next=/match");
      return;
    }
    if (user.role !== "seeker") {
      router.push("/");
      return;
    }
    api
      .matchForMe(10, true)
      .then((res) => setItems(res.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="container-page py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI-подбор вакансий</h1>
          <p className="text-sm text-gray-500">
            Мы сопоставляем твой профиль с вакансиями через embeddings и
            объясняем каждое совпадение.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="card text-rose-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="card text-center text-sm text-gray-500">
          Пока нечего показать. Заполни{" "}
          <a href="/profile" className="text-brand-600">
            профиль
          </a>
          , чтобы AI мог подобрать вакансии.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <JobCard
              key={m.job.id}
              job={m.job}
              score={m.score}
              reason={m.reason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
