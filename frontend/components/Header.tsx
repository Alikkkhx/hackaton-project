"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAuth, getStoredUser } from "@/lib/api";
import type { User } from "@/lib/types";
import { Briefcase, LogOut, Menu, Sparkles, X } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

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

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold" onClick={close}>
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/jobs" className="btn-ghost">
            Вакансии
          </Link>
          {user?.role === "seeker" && (
            <>
              <Link href="/match" className="btn-ghost">
                <Sparkles className="h-4 w-4" />
                AI-подбор
              </Link>
              <Link href="/profile" className="btn-ghost">
                Профиль
              </Link>
            </>
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white pb-4">
          <nav className="container-page flex flex-col gap-1 pt-2">
            <Link href="/jobs" className="btn-ghost justify-start" onClick={close}>
              Вакансии
            </Link>
            {user?.role === "seeker" && (
              <>
                <Link href="/match" className="btn-ghost justify-start" onClick={close}>
                  <Sparkles className="h-4 w-4" />
                  AI-подбор
                </Link>
                <Link href="/profile" className="btn-ghost justify-start" onClick={close}>
                  Профиль
                </Link>
              </>
            )}
            {user?.role === "employer" && (
              <Link href="/employer" className="btn-ghost justify-start" onClick={close}>
                Кабинет
              </Link>
            )}
            {!user ? (
              <>
                <Link href="/login" className="btn-ghost justify-start" onClick={close}>
                  Войти
                </Link>
                <Link href="/register" className="btn-primary justify-start" onClick={close}>
                  Регистрация
                </Link>
              </>
            ) : (
              <>
                <div className="px-4 py-2 text-sm text-gray-500">{user.full_name}</div>
                <button onClick={() => { logout(); close(); }} className="btn-ghost justify-start text-rose-600">
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
