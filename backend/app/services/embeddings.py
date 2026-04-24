"""Text embeddings with graceful fallback.

Primary path: ``sentence-transformers`` (multilingual, ~120 MB model + torch).
Fallback: hash-based bag-of-words vector (zero extra deps, still works for demo).

The fallback is good enough to show AI-matching end-to-end. For production we
recommend installing ``sentence-transformers`` (see requirements.txt).
"""

from __future__ import annotations

import hashlib
import logging
import math
import re
from functools import lru_cache

import numpy as np

from app.config import get_settings

log = logging.getLogger(__name__)

_DIM_FALLBACK = 256  # hash-embedding dimensionality


@lru_cache(maxsize=1)
def _st_model():
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        log.info("sentence-transformers not installed, using hash-embedding fallback.")
        return None
    try:
        settings = get_settings()
        return SentenceTransformer(settings.embedding_model)
    except Exception as exc:  # noqa: BLE001
        log.warning("Failed to load sentence-transformers model: %s (using fallback).", exc)
        return None


_TOKEN_RE = re.compile(r"[\w\-]+", flags=re.UNICODE)


def _hash_embed(text: str, dim: int = _DIM_FALLBACK) -> list[float]:
    """Deterministic hashing-based bag-of-words vector, L2-normalised."""
    vec = np.zeros(dim, dtype=np.float32)
    for token in _TOKEN_RE.findall(text.lower()):
        h = hashlib.md5(token.encode("utf-8"), usedforsecurity=False).digest()
        idx = int.from_bytes(h[:4], "little") % dim
        sign = 1.0 if h[4] & 1 else -1.0
        vec[idx] += sign
    norm = float(np.linalg.norm(vec))
    if norm == 0:
        return []
    vec /= norm
    return vec.astype(np.float32).tolist()


def embed(text: str) -> list[float]:
    text = (text or "").strip()
    if not text:
        return []
    model = _st_model()
    if model is None:
        return _hash_embed(text)
    try:
        vec = model.encode(text, normalize_embeddings=True)
        return [float(x) for x in vec.tolist()]
    except Exception as exc:  # noqa: BLE001
        log.warning("Embedding failed, using hash fallback: %s", exc)
        return _hash_embed(text)


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    av = np.asarray(a, dtype=np.float32)
    bv = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(av) * np.linalg.norm(bv))
    if denom == 0 or math.isnan(denom):
        return 0.0
    return float(np.dot(av, bv) / denom)
