"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setAuth } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ login, password });
      setAuth(res.access_token, res.user);
      window.dispatchEvent(new Event("auth-changed"));
      router.push(next);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold">Вход в JumysAQ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ещё нет аккаунта?{" "}
          <Link href="/register" className="text-brand-600 hover:underline">
            Зарегистрироваться
          </Link>
        </p>

        <form onSubmit={submit} className="card mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email или телефон
            </label>
            <input
              className="input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Пароль</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Войти"}
          </button>
          <p className="text-xs text-gray-400">
            Демо-аккаунты: <code>aigerim@example.kz</code> /{" "}
            <code>nurlan@example.kz</code> / <code>hr@caspiancoffee.kz</code> —
            пароль <code>demo1234</code>.
          </p>
        </form>
      </div>
    </div>
  );
}
