"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAuth, getStoredUser } from "@/lib/api";
import type { User } from "@/lib/types";
import { Briefcase, LogOut, Sparkles } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const handler = () => setUser(getStoredUser());
    window.addEventListener("storage", handler);
    window.addEventListener("auth-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("auth-changed", handler);
    };
  }, []);

  const logout = () => {
    clearAuth();
    window.dispatchEvent(new Event("auth-changed"));
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
            <Briefcase className="h-4 w-4" />
          </span>
          <span>
            Jumys<span className="text-brand-600">AQ</span>
          </span>
          <span className="hidden sm:inline text-xs text-gray-400">
            · Мангистау
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/jobs" className="btn-ghost">
            Вакансии
          </Link>
          {user?.role === "seeker" && (
            <Link href="/match" className="btn-ghost">
              <Sparkles className="h-4 w-4" />
              AI-подбор
            </Link>
          )}
          {user?.role === "employer" && (
            <Link href="/employer" className="btn-ghost">
              Кабинет
            </Link>
          )}
          {!user ? (
            <>
              <Link href="/login" className="btn-ghost">
                Войти
              </Link>
              <Link href="/register" className="btn-primary">
                Регистрация
              </Link>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-sm text-gray-500">
                {user.full_name}
              </span>
              <button onClick={logout} className="btn-ghost" aria-label="Выйти">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
