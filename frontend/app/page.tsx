import Link from "next/link";
import {
  BadgeCheck,
  Filter,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent-500/5" />
        <div className="container-page py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-card ring-1 ring-brand-100">
              <Sparkles className="h-3 w-3" />
              AI-матчинг · проверка вакансий · Telegram-бот
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Работа в <span className="text-brand-600">Мангистау</span>,
              найденная под тебя
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Все вакансии Актау и области — в одном месте. Без беспорядка в
              WhatsApp-чатах. AI подбирает под твои навыки и район, а Telegram-бот
              пришлёт свежие предложения мгновенно.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/jobs" className="btn-primary px-6 py-3 text-base">
                <Search className="h-4 w-4" />
                Смотреть вакансии
              </Link>
              <Link
                href="/register?role=employer"
                className="btn-secondary px-6 py-3 text-base"
              >
                Я работодатель
              </Link>
              <a
                href="https://t.me/jumysaq_mangystau_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-[#2AABEE] text-white hover:bg-[#229ED9] px-6 py-3 text-base"
              >
                <MessageCircle className="h-4 w-4" />
                Telegram-бот
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: "700K+", l: "жителей области" },
              { n: "~30%", l: "молодёжь до 29" },
              { n: "12", l: "микрорайонов Актау" },
              { n: "1 клик", l: "отклик из Telegram" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-card"
              >
                <div className="text-2xl font-bold text-brand-700">{s.n}</div>
                <div className="mt-1 text-xs text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Как JumysAQ решает проблему
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Молодёжь не видит работу, которая реально есть в Актау. Работодатель не
          может быстро найти сотрудника. Мы сводим их вместе.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="AI-матчинг"
            desc="Резюме и навыки превращаются в векторное представление. Мы находим вакансии с самой высокой релевантностью и объясняем, почему."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="AI анти-скам"
            desc="Каждая новая вакансия проходит автоматическую проверку LLM. Подозрительные (предоплата, «лёгкие деньги») получают бейдж предупреждения."
          />
          <Feature
            icon={<MessageCircle className="h-5 w-5" />}
            title="Telegram-бот"
            desc="Push-уведомления о свежих вакансиях под твой фильтр. Отклик прямо из чата, без перехода в приложение."
          />
          <Feature
            icon={<Filter className="h-5 w-5" />}
            title="Фильтры под реальность"
            desc="Микрорайоны Актау, тип занятости, опыт, сфера. Подработка для студентов, вахта, полная занятость."
          />
          <Feature
            icon={<MapPin className="h-5 w-5" />}
            title="Районы и сёла"
            desc="Не только Актау: Жанаозен, Бейнеу, Курык. Работа рядом с домом — без полуторачасовых переездов."
          />
          <Feature
            icon={<BadgeCheck className="h-5 w-5" />}
            title="Верифицированные работодатели"
            desc="Подтверждение номера + галочка «verified». Соискатель видит, с кем имеет дело."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 p-8 text-center text-white shadow-cardHover sm:p-12">
          <h3 className="text-2xl font-bold sm:text-3xl">
            Готов найти работу рядом с домом?
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Создай профиль за минуту и получи персональную ленту вакансий.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="btn bg-white text-brand-700 hover:bg-gray-100"
            >
              Создать профиль
            </Link>
            <Link
              href="/jobs"
              className="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"
            >
              Смотреть вакансии
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
