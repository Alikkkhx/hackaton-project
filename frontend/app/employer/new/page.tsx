"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AKTAU_DISTRICTS, INDUSTRIES, MANGYSTAU_CITIES } from "@/lib/format";
import { Loader2, Sparkles, Undo2 } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    industry: INDUSTRIES[0],
    city: "Актау",
    district: "",
    employment_type: "full_time",
    experience: "no_exp",
    salary_min: "",
    salary_max: "",
    skills: "",
    contact: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI improve state
  const [improving, setImproving] = useState(false);
  const [originalDesc, setOriginalDesc] = useState<string | null>(null);

  const isAktau = form.city === "Актау" || form.city === "Aktau";

  const handleImprove = async () => {
    if (!form.title && !form.description) {
      setError("Заполните заголовок и описание перед улучшением");
      return;
    }
    setImproving(true);
    setError(null);
    try {
      const result = await api.improveDescription({
        title: form.title,
        description: form.description,
        industry: form.industry,
      });
      setOriginalDesc(form.description);
      setForm({ ...form, description: result.improved_description });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImproving(false);
    }
  };

  const handleUndo = () => {
    if (originalDesc !== null) {
      setForm({ ...form, description: originalDesc });
      setOriginalDesc(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const job = await api.createJob({
        title: form.title,
        description: form.description,
        industry: form.industry,
        city: form.city || "Aktau",
        district: form.district || null,
        employment_type: form.employment_type as any,
        experience: form.experience as any,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        contact: form.contact,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold">Новая вакансия</h1>
      <p className="text-sm text-gray-500">
        AI автоматически проверит описание на признаки мошенничества и построит
        embedding для матчинга.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Название вакансии
          </label>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Бариста (МКР 11)"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium">Описание</label>
            <div className="flex gap-2">
              {originalDesc !== null && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  <Undo2 className="h-3 w-3" />
                  Откатить
                </button>
              )}
              <button
                type="button"
                onClick={handleImprove}
                disabled={improving}
                className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 transition disabled:opacity-60"
              >
                {improving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Улучшить текст (AI)
              </button>
            </div>
          </div>
          <textarea
            className="input h-40"
            required
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Что делать, что важно, что предлагаем"
          />
          {originalDesc !== null && (
            <p className="mt-1 text-xs text-brand-600">
              ✨ Текст улучшен AI. Нажмите «Откатить» для возврата.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Сфера</label>
            <select
              className="input"
              value={form.industry}
              onChange={(e) =>
                setForm({ ...form, industry: e.target.value })
              }
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Город</label>
            <select
              className="input"
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value, district: "" })
              }
            >
              {MANGYSTAU_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Район</label>
            <select
              className="input"
              value={form.district}
              onChange={(e) =>
                setForm({ ...form, district: e.target.value })
              }
              disabled={!isAktau}
            >
              <option value="">—</option>
              {isAktau &&
                AKTAU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Тип</label>
            <select
              className="input"
              value={form.employment_type}
              onChange={(e) =>
                setForm({ ...form, employment_type: e.target.value })
              }
            >
              <option value="full_time">Полная</option>
              <option value="part_time">Частичная</option>
              <option value="gig">Подработка</option>
              <option value="internship">Стажировка</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Опыт</label>
            <select
              className="input"
              value={form.experience}
              onChange={(e) =>
                setForm({ ...form, experience: e.target.value })
              }
            >
              <option value="student">Студент</option>
              <option value="no_exp">Без опыта</option>
              <option value="junior">До 3 лет</option>
              <option value="middle">3–6 лет</option>
              <option value="senior">6+ лет</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Зарплата от (₸)
            </label>
            <input
              type="number"
              className="input"
              value={form.salary_min}
              onChange={(e) =>
                setForm({ ...form, salary_min: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Зарплата до (₸)
            </label>
            <input
              type="number"
              className="input"
              value={form.salary_max}
              onChange={(e) =>
                setForm({ ...form, salary_max: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Навыки (через запятую)
          </label>
          <input
            className="input"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="касса, клиентский сервис, коммуникация"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Контакты</label>
          <input
            className="input"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="WhatsApp/Telegram/Email"
          />
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Опубликовать"
          )}
        </button>
      </form>
    </div>
  );
}
