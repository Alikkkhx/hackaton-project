"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AKTAU_DISTRICTS, INDUSTRIES } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    industry: INDUSTRIES[0],
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const job = await api.createJob({
        title: form.title,
        description: form.description,
        industry: form.industry,
        city: "Aktau",
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
          <label className="mb-1 block text-sm font-medium">Описание</label>
          <textarea
            className="input h-40"
            required
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Что делать, что важно, что предлагаем"
          />
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
            <label className="mb-1 block text-sm font-medium">Район</label>
            <select
              className="input"
              value={form.district}
              onChange={(e) =>
                setForm({ ...form, district: e.target.value })
              }
            >
              <option value="">—</option>
              {AKTAU_DISTRICTS.map((d) => (
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
