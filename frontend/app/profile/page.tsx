"use client";

import { useEffect, useState } from "react";
import { api, getStoredUser } from "@/lib/api";
import type { SeekerProfile } from "@/lib/types";
import { AKTAU_DISTRICTS } from "@/lib/format";
import { Loader2, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login?next=/profile");
      return;
    }
    if (user.role !== "seeker") {
      router.push("/employer");
      return;
    }
    api
      .getSeekerProfile()
      .then((p) => {
        setProfile(p);
        setSkillsInput((p.skills || []).join(", "));
      })
      .finally(() => setLoading(false));
  }, [router]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const next = await api.saveSeekerProfile({ ...profile, skills });
      setProfile(next);
      setMsg("Сохранено. AI пересчитал твой вектор навыков.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile)
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold">Мой профиль</h1>
      <p className="text-sm text-gray-500">
        Чем точнее профиль, тем лучше AI подбирает вакансии.
      </p>

      <div className="card mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Краткое описание (кто ты, что умеешь)
          </label>
          <input
            className="input"
            value={profile.headline}
            onChange={(e) =>
              setProfile({ ...profile, headline: e.target.value })
            }
            placeholder="Студент 3 курса, ищу подработку в HoReCa"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">О себе</label>
          <textarea
            className="input h-28"
            value={profile.about}
            onChange={(e) =>
              setProfile({ ...profile, about: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Район</label>
            <select
              className="input"
              value={profile.district ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  district: e.target.value || null,
                })
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
            <label className="mb-1 block text-sm font-medium">Опыт</label>
            <select
              className="input"
              value={profile.experience}
              onChange={(e) =>
                setProfile({ ...profile, experience: e.target.value as any })
              }
            >
              <option value="student">Студент</option>
              <option value="no_exp">Без опыта</option>
              <option value="junior">До 3 лет</option>
              <option value="middle">3–6 лет</option>
              <option value="senior">6+ лет</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Навыки (через запятую)
          </label>
          <input
            className="input"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="английский B2, Yclients, Instagram, Excel"
          />
        </div>

        {msg && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {msg}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Сохранить
          </button>
          <a href="/match" className="btn-secondary">
            <Sparkles className="h-4 w-4" />
            Посмотреть AI-подбор
          </a>
        </div>
      </div>
    </div>
  );
}
