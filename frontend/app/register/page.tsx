"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setAuth } from "@/lib/api";
import { Loader2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"seeker" | "employer">("seeker");

  useEffect(() => {
    const r = params.get("role");
    if (r === "employer") setRole("employer");
  }, [params]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        password,
        role,
      });
      setAuth(res.access_token, res.user);
      window.dispatchEvent(new Event("auth-changed"));
      router.push(role === "employer" ? "/employer" : "/profile");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Регистрация</h1>
      <p className="mt-1 text-sm text-gray-500">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Войти
        </Link>
      </p>

      <div className="card mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setRole("seeker")}
            className={`rounded-md py-2 transition ${
              role === "seeker"
                ? "bg-white shadow-card text-gray-900"
                : "text-gray-500"
            }`}
          >
            Ищу работу
          </button>
          <button
            type="button"
            onClick={() => setRole("employer")}
            className={`rounded-md py-2 transition ${
              role === "employer"
                ? "bg-white shadow-card text-gray-900"
                : "text-gray-500"
            }`}
          >
            Нанимаю сотрудников
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {role === "employer" ? "Название компании" : "ФИО"}
            </label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email{" "}
              <span className="text-xs text-gray-400">(или телефон ниже)</span>
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Телефон{" "}
              <span className="text-xs text-gray-400">
                используется как подтверждение
              </span>
            </label>
            <input
              className="input"
              placeholder="+7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Пароль</label>
            <input
              type="password"
              className="input"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Создать аккаунт"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="container-page py-12">
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-md min-h-[24rem] items-center justify-center text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
