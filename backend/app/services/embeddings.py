"""Local sentence-transformer embeddings (free, multilingual, small)."""

from __future__ import annotations

import math
from functools import lru_cache

import numpy as np

from app.config import get_settings


@lru_cache(maxsize=1)
def _model():
    # Lazy import: heavy dependency, load once.
    from sentence_transformers import SentenceTransformer

    settings = get_settings()
    return SentenceTransformer(settings.embedding_model)


def embed(text: str) -> list[float]:
    text = (text or "").strip()
    if not text:
        return []
    vec = _model().encode(text, normalize_embeddings=True)
    return [float(x) for x in vec.tolist()]


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    av = np.asarray(a, dtype=np.float32)
    bv = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(av) * np.linalg.norm(bv))
    if denom == 0 or math.isnan(denom):
        return 0.0
    return float(np.dot(av, bv) / denom)
