"""LLM wrapper + AI-powered features: match explanations, scam detection,
job description polish.

Provider priority: Gemini (Google AI Studio) -> Groq -> empty (rule fallback).
The first provider with a configured API key is used; on HTTP error the next
one is tried, so the app keeps working if the primary LLM misbehaves.
"""

from __future__ import annotations

import json
import logging
import re

from app.config import get_settings

log = logging.getLogger(__name__)


def llm_available() -> bool:
    s = get_settings()
    return bool(s.gemini_api_key or s.groq_api_key)


def _complete_gemini(
    system: str, user: str, *, json_mode: bool, max_tokens: int
) -> str | None:
    settings = get_settings()
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        generation_config: dict = {
            "temperature": 0.2,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            generation_config["response_mime_type"] = "application/json"
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=system,
            generation_config=generation_config,
        )
        resp = model.generate_content(user)
        return (resp.text or "").strip()
    except Exception as exc:  # noqa: BLE001
        log.warning("Gemini call failed: %s", exc)
        return None


def _complete_groq(
    system: str, user: str, *, json_mode: bool, max_tokens: int
) -> str | None:
    settings = get_settings()
    if not settings.groq_api_key:
        return None
    try:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        kwargs: dict = dict(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=max_tokens,
        )
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        resp = client.chat.completions.create(**kwargs)
        return (resp.choices[0].message.content or "").strip()
    except Exception as exc:  # noqa: BLE001
        log.warning("Groq call failed: %s", exc)
        return None


def _complete(system: str, user: str, *, json_mode: bool = False, max_tokens: int = 600) -> str:
    for provider in (_complete_gemini, _complete_groq):
        out = provider(system, user, json_mode=json_mode, max_tokens=max_tokens)
        if out:
            return out
    return ""


# ---------- Job description polish (optional UX) ----------


def polish_job_description(title: str, raw: str) -> str:
    sys = (
        "Ты — редактор вакансий. Перепиши текст вакансии для платформы труда в "
        "Мангистау (Казахстан, русский язык). Сделай коротко, по делу, на ты. "
        "Структура: 1) чем заниматься (3-5 пунктов), 2) что важно (2-4 пункта), "
        "3) что предлагаем (2-4 пункта). Не добавляй ничего, чего не было в исходнике."
    )
    usr = f"Заголовок: {title}\n\nИсходный текст:\n{raw}"
    out = _complete(sys, usr, max_tokens=500)
    return out.strip() or raw


# ---------- Scam / risk detection ----------


_SCAM_HEURISTICS = [
    (r"быстр\w* деньги|лёгкие деньги|лёгкий заработок", "Обещание лёгкого заработка"),
    (r"без опыта.*(?:от\s*)?(\d{2,3})\s*000", "Высокая зарплата без опыта"),
    (r"оплата на карту|предоплата|взнос|депозит|страховочн\w*", "Просьба о предоплате"),
    (r"whatsapp|вотсап|вайбер|viber|телеграм(?!\s*бот)", "Только мессенджер, без данных компании"),
    (r"срочно\s+нужны|набираем\s+всех", "Массовый/срочный набор без требований"),
    (r"работа на дому.*инвестиц", "Работа на дому + инвестиции"),
    (r"\b18\+\b|эскорт", "Подозрительный контент"),
]


def heuristic_scam_score(text: str) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 0.0
    t = text.lower()
    for pattern, reason in _SCAM_HEURISTICS:
        if re.search(pattern, t):
            reasons.append(reason)
            score += 0.2
    return min(score, 1.0), reasons


def llm_scam_score(title: str, description: str, salary_max: int | None) -> tuple[float, list[str]]:
    """Ask Groq to classify job posting risk. Returns (score 0..1, reasons)."""
    sys = (
        "Ты — детектор мошеннических вакансий. Верни ТОЛЬКО JSON: "
        '{"score": <float 0..1>, "reasons": [<string>, ...]}. '
        "score = вероятность, что вакансия — мошенничество или сомнительная. "
        "reasons — короткие тезисы на русском, что именно настораживает. "
        "Оценивай: завышенные обещания, отсутствие компании, работа на дому с инвестициями, "
        "просьбы о предоплате, только мессенджер без деталей, 'без опыта и документов — высокая ЗП'."
    )
    usr = (
        f"Заголовок: {title}\n"
        f"Максимальная зарплата: {salary_max}\n"
        f"Описание:\n{description}\n"
    )
    raw = _complete(sys, usr, json_mode=True, max_tokens=300)
    try:
        data = json.loads(raw)
        score = float(data.get("score", 0.0))
        reasons = [str(r) for r in data.get("reasons", [])][:5]
        return max(0.0, min(1.0, score)), reasons
    except Exception:  # noqa: BLE001
        return 0.0, []


def evaluate_scam(title: str, description: str, salary_max: int | None = None) -> tuple[float, list[str]]:
    """Combine heuristic + LLM scores. Returns (risk_score 0..1, reasons)."""
    h_score, h_reasons = heuristic_scam_score(f"{title}\n{description}")

    if llm_available():
        try:
            l_score, l_reasons = llm_scam_score(title, description, salary_max)
        except Exception:  # noqa: BLE001
            l_score, l_reasons = 0.0, []
    else:
        l_score, l_reasons = 0.0, []

    score = max(h_score, l_score)
    reasons: list[str] = []
    for r in (*h_reasons, *l_reasons):
        if r not in reasons:
            reasons.append(r)
    return score, reasons[:6]


# ---------- Match explanation ----------


def explain_match(
    *,
    seeker_headline: str,
    seeker_skills: list[str],
    seeker_experience: str,
    seeker_district: str | None,
    job_title: str,
    job_skills: list[str],
    job_experience: str,
    job_district: str | None,
    score: float,
) -> str:
    """Generate one short sentence why this job matches the seeker."""
    sys = (
        "Ты — карьерный консультант в Мангистау. Объясни на русском в 1-2 предложениях, "
        "почему вакансия подходит соискателю. Пиши на ты, коротко, по делу, без воды. "
        "Если район совпадает — упомяни это. Не используй markdown, не ставь кавычки."
    )
    usr = (
        f"Соискатель: {seeker_headline or '—'}; навыки: {', '.join(seeker_skills) or '—'}; "
        f"опыт: {seeker_experience}; район: {seeker_district or '—'}.\n"
        f"Вакансия: {job_title}; требуемые навыки: {', '.join(job_skills) or '—'}; "
        f"опыт: {job_experience}; район: {job_district or '—'}.\n"
        f"Cosine similarity: {score:.2f}."
    )
    text = _complete(sys, usr, max_tokens=120).strip()
    if not text:
        text = fallback_reason(seeker_skills, job_skills, seeker_district, job_district)
    return text


def fallback_reason(
    s_skills: list[str], j_skills: list[str], s_district: str | None, j_district: str | None
) -> str:
    common = sorted(set(s.lower() for s in s_skills) & set(j.lower() for j in j_skills))
    parts = []
    if common:
        parts.append(f"совпадают навыки: {', '.join(list(common)[:3])}")
    if s_district and j_district and s_district.lower() == j_district.lower():
        parts.append(f"тот же район ({s_district})")
    if not parts:
        return "Похожая сфера и уровень опыта."
    return "Подходит: " + "; ".join(parts) + "."


_fallback_reason = fallback_reason  # backwards-compat alias
