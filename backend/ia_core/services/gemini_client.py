import os
from functools import lru_cache
from typing import List

import google.generativeai as genai

from .exceptions import EmbeddingError, GeminiClientError

DEFAULT_CHAT_MODEL = "gemini-2.5-flash"
DEFAULT_EMBEDDING_MODEL = "models/gemini-embedding-001"


@lru_cache(maxsize=1)
def _configure_client(api_key: str) -> None:
    genai.configure(api_key=api_key)


def _get_api_key() -> str:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise GeminiClientError(
            "GOOGLE_API_KEY is not set in the environment.",
            code="MISSING_API_KEY",
        )
    return api_key


def get_gemini_model(model_name: str = DEFAULT_CHAT_MODEL) -> genai.GenerativeModel:
    """Return a configured Gemini GenerativeModel instance."""
    api_key = _get_api_key()
    try:
        _configure_client(api_key)
        return genai.GenerativeModel(model_name)
    except Exception as exc:  # pragma: no cover - external dependency
        raise GeminiClientError(
            "Failed to initialize Gemini model.",
            code="GEMINI_INIT_ERROR",
        ) from exc


def embed_text(
    text: str,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
    task_type: str = "retrieval_query",
) -> List[float]:
    """Generate an embedding vector for a given text."""
    if not text or not text.strip():
        raise EmbeddingError("Text is empty.", code="EMPTY_TEXT")

    api_key = _get_api_key()
    try:
        _configure_client(api_key)
        response = genai.embed_content(
            model=model_name,
            content=text,
            task_type=task_type,
        )
        embedding = _extract_embedding(response)
        if not embedding:
            raise EmbeddingError("Embedding response is empty.")
        return embedding
    except EmbeddingError:
        raise
    except Exception as exc:  # pragma: no cover - external dependency
        raise EmbeddingError(
            "Failed to generate embedding.",
            code="EMBEDDING_ERROR",
        ) from exc


def _extract_embedding(response: object) -> List[float]:
    if isinstance(response, dict):
        embedding = response.get("embedding")
    else:
        embedding = getattr(response, "embedding", None)

    if embedding is None:
        return []
    return [float(value) for value in embedding]
