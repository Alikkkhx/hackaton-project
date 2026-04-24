"use client";

import { useEffect, useState } from "react";
import { api, getStoredUser } from "@/lib/api";
import type { SeekerProfile, User } from "@/lib/types";
import { AKTAU_DISTRICTS, MANGYSTAU_CITIES } from "@/lib/format";
import { BadgeCheck, Loader2, Phone, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState("");

  // Phone verification
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.push("/login?next=/profile");
      return;
    }
    if (u.role !== "seeker") {
      router.push("/employer");
      return;
    }
    setUser(u);
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

  const requestCode = async () => {
    if (!user?.phone) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await api.requestPhoneCode(user.phone);
      setCodeSent(true);
      setVerifyMsg(res.message);
    } catch (e: any) {
      setVerifyMsg(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const verifyCode = async () => {
    if (!user?.phone || !otpCode) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      await api.verifyPhone(user.phone, otpCode);
      setVerifyMsg("✅ Телефон подтверждён!");
      setUser({ ...user, phone_verified: true });
      // Update stored user
      const stored = getStoredUser();
      if (stored) {
        stored.phone_verified = true;
        localStorage.setItem("jumysaq_user", JSON.stringify(stored));
      }
    } catch (e: any) {
      setVerifyMsg(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const isAktau = !profile?.city || profile.city === "Актау" || profile.city === "Aktau";

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

      {/* Phone verification card */}
      {user && user.phone && !user.phone_verified && (
        <div className="card mt-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Phone className="h-4 w-4" />
            Подтвердите номер телефона
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Подтверждённый номер повышает доверие к вашему профилю.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            {!codeSent ? (
              <button
                onClick={requestCode}
                disabled={verifying}
                className="btn-primary text-sm"
              >
                {verifying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Отправить код"
                )}
              </button>
            ) : (
              <>
                <input
                  className="input w-32"
                  placeholder="Код"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
                <button
                  onClick={verifyCode}
                  disabled={verifying || otpCode.length < 4}
                  className="btn-primary text-sm"
                >
                  {verifying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Подтвердить"
                  )}
                </button>
              </>
            )}
          </div>
          {verifyMsg && (
            <p className="mt-2 text-xs text-amber-800">{verifyMsg}</p>
          )}
        </div>
      )}

      {user && user.phone_verified && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          <BadgeCheck className="h-4 w-4" />
          Телефон подтверждён
        </div>
      )}

      <div className="card mt-4 space-y-4">
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
            <label className="mb-1 block text-sm font-medium">Город</label>
            <select
              className="input"
              value={profile.city}
              onChange={(e) =>
                setProfile({ ...profile, city: e.target.value, district: null })
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
              value={profile.district ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  district: e.target.value || null,
                })
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

        <div className="flex flex-col gap-2 sm:flex-row">
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
