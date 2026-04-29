import logging
import math
import os
import re
import time
import heapq

from django.db.models import Q, QuerySet
from ia_core.models import PGVECTOR_AVAILABLE, ThesisEmbedding
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Sequence
import chromadb
from django.conf import settings
import google.generativeai as genai
from google.api_core import exceptions as google_api_exceptions
from .exceptions import IAServiceError, EmbeddingError, RAGServiceError, SearchServiceError
from .gemini_client import DEFAULT_CHAT_MODEL, embed_text, get_gemini_model
logger = logging.getLogger(__name__)
CHROMA_COLLECTION_NAME = "tesis_collection"
CHROMA_PATH = Path(settings.BASE_DIR) / "chroma_db"
_chroma_client = None
try:
    import fitz
except ImportError:  # pragma: no cover - optional dependency
    fitz = None

logger = logging.getLogger(__name__)

DEFAULT_MAX_PDF_SIZE_MB = 200
DEFAULT_GEMINI_FILE_MAX_PDF_SIZE_MB = 45
DEFAULT_PDF_PROCESSING_TIMEOUT_SECONDS = 300
DEFAULT_PDF_CONTEXT_CHUNK_SIZE = 2200
DEFAULT_PDF_CONTEXT_CHUNKS = 8


def search_similar_thesis(
    query_text: str,
    limit: int = 5,
    metadata_filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve the most relevant thesis chunks from ChromaDB."""
    cleaned_query = (query_text or "").strip()
    if len(cleaned_query) < 3:
        raise SearchServiceError(
            "Query text is too short.",
            code="QUERY_TOO_SHORT",
        )
    try:
        query_embedding = embed_text(cleaned_query, task_type="retrieval_query")
        collection = _get_chroma_collection()
        where = _build_chroma_where(metadata_filters)
        query_kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": 3,
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            query_kwargs["where"] = where
        results = collection.query(**query_kwargs)
        return _serialize_chroma_results(results)
    except EmbeddingError as exc:
        raise SearchServiceError(str(exc), code=exc.code) from exc
    except SearchServiceError:
        raise
    except Exception as exc:  # pragma: no cover - external dependency
        raise SearchServiceError(
            f"Failed to query ChromaDB. Details: {exc}",
            code="CHROMA_QUERY_ERROR",
        ) from exc

def _get_chroma_collection():
    global _chroma_client
    # Solo inicializa el cliente si no existe en memoria
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    
    return _chroma_client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

def _build_chroma_where(
    metadata_filters: Optional[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    if not metadata_filters:
        return None
    clauses = []
    tipo = metadata_filters.get("tipo")
    if tipo:
        clauses.append({"tipo_material": str(tipo)})
    anio = metadata_filters.get("anio")
    if anio:
        try:
            clauses.append({"anio_publicacion": int(anio)})
        except (TypeError, ValueError):
            logger.warning("Ignoring invalid anio filter: %s", anio)
    if not clauses:
        unsupported = {
            key: value
            for key, value in (metadata_filters or {}).items()
            if value and key not in {"tipo", "anio"}
        }
        if unsupported:
            logger.warning("Ignoring unsupported Chroma filters: %s", unsupported)
        return None
    if len(clauses) == 1:
        return clauses[0]
    return {"$and": clauses}

def _serialize_chroma_results(results: Dict[str, Any]) -> List[Dict[str, Any]]:
    ids = (results.get("ids") or [[]])[0]
    documents = (results.get("documents") or [[]])[0]
    metadatas = (results.get("metadatas") or [[]])[0]
    distances = (results.get("distances") or [[]])[0]
    payload = []
    for chunk_id, fragmento, metadata, distancia in zip(
        ids,
        documents,
        metadatas,
        distances,
    ):
        metadata = metadata or {}
        payload.append(
            {
                "id": metadata.get("trabajo_id"),
                "chunk_id": chunk_id,
                "titulo": metadata.get("titulo") or "Documento",
                "fragmento": fragmento,
                "score": 1 - float(distancia),
                "distancia": float(distancia),
                "metadata": metadata,
            }
        )
    return payload

def generate_rag_response(
    query: str,
    context_documents: Sequence[Mapping[str, Any]],
) -> Dict[str, Any]:
    """Generate a natural language response using retrieved context."""
    cleaned_query = (query or "").strip()
    if len(cleaned_query) < 3:
        raise RAGServiceError("Query text is too short.", code="QUERY_TOO_SHORT")

    if not context_documents:
        raise RAGServiceError("Context documents are required.", code="NO_CONTEXT")

    prompt, sources = _build_rag_prompt(cleaned_query, context_documents)

    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)
        answer = getattr(response, "text", None) or ""
        return {
            "answer": answer.strip(),
            "sources": sources,
        }
    except IAServiceError:
        raise
    except Exception as exc:  # pragma: no cover - external dependency
        raise RAGServiceError(
            "Failed to generate RAG response.",
            code="RAG_GENERATION_ERROR",
        ) from exc


def answer_pdf_question(pdf_path: str, question: str) -> str:
    """Answer a question using a PDF file with Gemini."""
    if not pdf_path or not os.path.exists(pdf_path):
        raise RAGServiceError("PDF file not found.", code="PDF_NOT_FOUND")

    cleaned_question = (question or "").strip()
    if not cleaned_question:
        raise RAGServiceError("Question is required.", code="NO_QUESTION")

    max_pdf_bytes = _get_max_pdf_size_bytes()
    file_size_bytes = os.path.getsize(pdf_path)
    if file_size_bytes > max_pdf_bytes:
        file_size_mb = file_size_bytes / (1024 * 1024)
        max_size_mb = max_pdf_bytes / (1024 * 1024)
        raise RAGServiceError(
            (
                f"PDF file is too large ({file_size_mb:.2f} MB). "
                f"Maximum allowed size is {max_size_mb:.0f} MB."
            ),
            code="PDF_TOO_LARGE",
        )

    model = get_gemini_model(os.environ.get("IA_PDF_MODEL", DEFAULT_CHAT_MODEL))
    gemini_file_max_bytes = _get_gemini_file_max_pdf_size_bytes()

    if file_size_bytes <= gemini_file_max_bytes:
        try:
            return _answer_pdf_with_file_upload(model, pdf_path, cleaned_question)
        except google_api_exceptions.InvalidArgument as exc:
            logger.warning(
                "Gemini rejected file upload, falling back to text chunks: %s",
                exc,
            )
        except google_api_exceptions.DeadlineExceeded as exc:
            logger.warning(
                "Gemini file upload timeout, falling back to text chunks: %s",
                exc,
            )
        except google_api_exceptions.ResourceExhausted as exc:
            raise RAGServiceError(
                "Gemini quota exceeded. Try again later or verify your API quota/billing.",
                code="GEMINI_QUOTA_EXCEEDED",
            ) from exc
        except google_api_exceptions.PermissionDenied as exc:
            raise RAGServiceError(
                "Gemini permission denied. Verify GOOGLE_API_KEY and project access.",
                code="GEMINI_PERMISSION_DENIED",
            ) from exc
        except RAGServiceError:
            raise
        except Exception as exc:  # pragma: no cover - external dependency
            logger.warning(
                "Unexpected Gemini PDF upload error, trying text fallback: %s",
                exc,
            )
    else:
        logger.info(
            "PDF size %.2f MB exceeds Gemini upload threshold %.2f MB. "
            "Using text-chunk fallback.",
            file_size_bytes / (1024 * 1024),
            gemini_file_max_bytes / (1024 * 1024),
        )

    return _answer_pdf_with_text_chunks(model, pdf_path, cleaned_question)


def _answer_pdf_with_file_upload(model: Any, pdf_path: str, question: str) -> str:
    try:
        file_ref = genai.upload_file(pdf_path, mime_type="application/pdf")
        file_ref = _wait_for_file_processing(
            file_ref,
            max_wait_seconds=_get_pdf_processing_timeout_seconds(),
        )

        if getattr(file_ref, "state", None) and file_ref.state.name == "FAILED":
            raise RAGServiceError(
                "Gemini failed to process the PDF.",
                code="PDF_PROCESSING_FAILED",
            )

        prompt = _build_pdf_prompt(question)
        response = model.generate_content([file_ref, prompt])
        answer = getattr(response, "text", None) or ""
        return answer.strip()
    except Exception:
        raise


def _answer_pdf_with_text_chunks(model: Any, pdf_path: str, question: str) -> str:
    if fitz is None:
        raise RAGServiceError(
            "PyMuPDF no esta disponible para procesar el PDF localmente.",
            code="PDF_LOCAL_PROCESSOR_MISSING",
        )

    context_fragments = _extract_relevant_pdf_fragments(pdf_path, question)
    if not context_fragments:
        raise RAGServiceError(
            "No se pudo extraer texto util del PDF para responder.",
            code="PDF_TEXT_EXTRACTION_FAILED",
        )

    try:
        prompt = _build_pdf_text_context_prompt(question, context_fragments)
        response = model.generate_content(prompt)
        answer = getattr(response, "text", None) or ""
        return answer.strip()
    except google_api_exceptions.ResourceExhausted as exc:
        raise RAGServiceError(
            "Gemini quota exceeded. Try again later or verify your API quota/billing.",
            code="GEMINI_QUOTA_EXCEEDED",
        ) from exc
    except google_api_exceptions.PermissionDenied as exc:
        raise RAGServiceError(
            "Gemini permission denied. Verify GOOGLE_API_KEY and project access.",
            code="GEMINI_PERMISSION_DENIED",
        ) from exc
    except Exception as exc:  # pragma: no cover - external dependency
        raise RAGServiceError(
            f"Failed to answer question using PDF. Details: {exc}",
            code="PDF_RAG_ERROR",
        ) from exc


def _apply_metadata_filters(
    queryset: QuerySet,
    metadata_filters: Optional[Dict[str, Any]],
) -> QuerySet:
    if not metadata_filters:
        return queryset

    filters = Q()
    tipo = metadata_filters.get("tipo")
    if tipo:
        filters &= Q(trabajo__tipo_material=tipo)

    autor = metadata_filters.get("autor")
    if autor:
        filters &= Q(trabajo__autores_texto__icontains=autor)

    palabra_clave = metadata_filters.get("palabra_clave")
    if palabra_clave:
        filters &= Q(trabajo__palabras_clave__termino__icontains=palabra_clave)

    anio = metadata_filters.get("anio")
    if anio:
        filters &= Q(trabajo__anio_publicacion=anio)

    return queryset.filter(filters).distinct()


def _build_rag_prompt(
    query: str,
    context_documents: Sequence[Mapping[str, Any]],
) -> tuple[str, List[Dict[str, Any]]]:
    context_lines: List[str] = []
    sources: List[Dict[str, Any]] = []

    for idx, doc in enumerate(context_documents, start=1):
        title = doc.get("titulo") or doc.get("title") or "Document"
        snippet = (
            doc.get("fragmento")
            or doc.get("resumen")
            or doc.get("content")
            or ""
        )
        source_id = doc.get("id") or doc.get("source_id")

        context_lines.append(f"[{idx}] {title}\n{snippet}")
        sources.append({"index": idx, "id": source_id, "title": title})

    prompt = (
        "You are an academic librarian assistant.\n"
        "Answer in Spanish and only use the provided context.\n"
        "If the answer is not in the context, say: "
        "No encontre esa informacion en el texto.\n"
        "Provide citations like [1], [2].\n\n"
        f"Context:\n{chr(10).join(context_lines)}\n\n"
        f"Question: {query}\n"
    )

    return prompt, sources


def _build_pdf_prompt(question: str) -> str:
    return (
        "You are an academic librarian assistant. "
        "Answer in Spanish, be concise, and use bullet points for lists. "
        "If the answer is not in the document, say: "
        "No encontre esa informacion en el texto. "
        f"Question: {question}"
    )


def _build_pdf_text_context_prompt(
    question: str,
    context_fragments: Sequence[Mapping[str, Any]],
) -> str:
    formatted_fragments = []
    for index, fragment in enumerate(context_fragments, start=1):
        page = fragment.get("page")
        text = fragment.get("text", "")
        formatted_fragments.append(f"[{index}] Pagina {page}: {text}")

    return (
        "You are an academic librarian assistant. "
        "Answer in Spanish and only with information from the provided fragments. "
        "If information is missing, say: No encontre esa informacion en el texto. "
        "Use references like [1], [2].\n\n"
        f"Context fragments:\n{chr(10).join(formatted_fragments)}\n\n"
        f"Question: {question}"
    )


def _extract_relevant_pdf_fragments(
    pdf_path: str,
    question: str,
) -> List[Dict[str, Any]]:
    if fitz is None:
        return []

    question_terms = _tokenize_terms(question)
    chunk_size = _get_pdf_context_chunk_size()
    keep_chunks = _get_pdf_context_chunks()
    pool_size = max(keep_chunks * 3, keep_chunks)
    best_chunks: List[tuple[float, int, str]] = []
    fallback_chunks: List[Dict[str, Any]] = []

    try:
        with fitz.open(pdf_path) as document:
            for page_index in range(document.page_count):
                text = (document.load_page(page_index).get_text("text") or "").strip()
                if not text:
                    continue

                for chunk in _split_text_into_chunks(text, chunk_size):
                    if len(fallback_chunks) < keep_chunks:
                        fallback_chunks.append({"page": page_index + 1, "text": chunk})

                    score = _score_chunk(chunk, question_terms, question)
                    if score <= 0:
                        continue

                    item = (score, page_index + 1, chunk)
                    if len(best_chunks) < pool_size:
                        heapq.heappush(best_chunks, item)
                    elif score > best_chunks[0][0]:
                        heapq.heapreplace(best_chunks, item)
    except Exception as exc:
        logger.warning("Failed to extract PDF text chunks from %s: %s", pdf_path, exc)
        return []

    if not best_chunks:
        return fallback_chunks

    ordered_chunks = sorted(best_chunks, key=lambda item: item[0], reverse=True)[:keep_chunks]
    return [
        {"page": page, "text": chunk}
        for _, page, chunk in ordered_chunks
    ]


def _split_text_into_chunks(text: str, chunk_size: int) -> List[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []

    chunks = []
    for start in range(0, len(normalized), max(chunk_size, 500)):
        chunk = normalized[start:start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def _score_chunk(chunk: str, question_terms: set[str], question: str) -> float:
    if not chunk:
        return 0.0

    chunk_lower = chunk.lower()
    overlap_score = float(sum(1 for term in question_terms if term in chunk_lower))

    normalized_question = " ".join(question.lower().split())
    phrase_bonus = 3.0 if normalized_question and normalized_question in chunk_lower else 0.0

    return overlap_score + phrase_bonus


def _tokenize_terms(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]{3,}", (text or "").lower())
    }


def _wait_for_file_processing(file_ref: Any, max_wait_seconds: int = 120) -> Any:
    waited = 0
    while getattr(file_ref, "state", None) and file_ref.state.name == "PROCESSING":
        time.sleep(2)
        waited += 2
        file_ref = genai.get_file(file_ref.name)
        if waited >= max_wait_seconds:
            raise RAGServiceError("PDF processing timed out.", code="PDF_TIMEOUT")
    return file_ref


def _get_max_pdf_size_bytes() -> int:
    raw_size_mb = os.environ.get("IA_MAX_PDF_SIZE_MB", str(DEFAULT_MAX_PDF_SIZE_MB))
    try:
        size_mb = float(raw_size_mb)
        if size_mb <= 0:
            raise ValueError
    except ValueError:
        size_mb = float(DEFAULT_MAX_PDF_SIZE_MB)
    return int(size_mb * 1024 * 1024)


def _get_gemini_file_max_pdf_size_bytes() -> int:
    raw_size_mb = os.environ.get(
        "IA_GEMINI_FILE_MAX_PDF_SIZE_MB",
        str(DEFAULT_GEMINI_FILE_MAX_PDF_SIZE_MB),
    )
    try:
        size_mb = float(raw_size_mb)
        if size_mb <= 0:
            raise ValueError
    except ValueError:
        size_mb = float(DEFAULT_GEMINI_FILE_MAX_PDF_SIZE_MB)
    return int(size_mb * 1024 * 1024)


def _get_pdf_processing_timeout_seconds() -> int:
    raw_timeout = os.environ.get(
        "IA_PDF_PROCESSING_TIMEOUT_SECONDS",
        str(DEFAULT_PDF_PROCESSING_TIMEOUT_SECONDS),
    )
    try:
        timeout_seconds = int(raw_timeout)
        if timeout_seconds <= 0:
            raise ValueError
    except ValueError:
        timeout_seconds = DEFAULT_PDF_PROCESSING_TIMEOUT_SECONDS
    return timeout_seconds


def _get_pdf_context_chunk_size() -> int:
    raw_chunk_size = os.environ.get(
        "IA_PDF_CONTEXT_CHUNK_SIZE",
        str(DEFAULT_PDF_CONTEXT_CHUNK_SIZE),
    )
    try:
        chunk_size = int(raw_chunk_size)
        if chunk_size < 500:
            raise ValueError
    except ValueError:
        chunk_size = DEFAULT_PDF_CONTEXT_CHUNK_SIZE
    return chunk_size


def _get_pdf_context_chunks() -> int:
    raw_chunks = os.environ.get(
        "IA_PDF_CONTEXT_CHUNKS",
        str(DEFAULT_PDF_CONTEXT_CHUNKS),
    )
    try:
        chunks = int(raw_chunks)
        if chunks <= 0:
            raise ValueError
    except ValueError:
        chunks = DEFAULT_PDF_CONTEXT_CHUNKS
    return chunks
