export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-page flex flex-col items-start justify-between gap-2 py-8 text-sm text-gray-500 md:flex-row md:items-center">
        <div>
          <strong className="text-gray-700">JumysAQ</strong> · Mangystau
          Hackathon 2026. Работа рядом с домом.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://t.me/"
            className="hover:text-brand-600"
            target="_blank"
            rel="noreferrer"
          >
            Telegram-бот
          </a>
          <a
            href="https://github.com/Alikkkhx/hackaton-project"
            className="hover:text-brand-600"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
