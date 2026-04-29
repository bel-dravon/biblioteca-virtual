class IAServiceError(RuntimeError):
    """Base exception for IA service errors."""

    def __init__(self, message: str, code: str = "IA_ERROR") -> None:
        super().__init__(message)
        self.code = code


class GeminiClientError(IAServiceError):
    """Raised when Gemini cannot be configured or reached."""


class EmbeddingError(IAServiceError):
    """Raised when embeddings cannot be generated or used."""


class SearchServiceError(IAServiceError):
    """Raised when the retrieval step fails."""


class RAGServiceError(IAServiceError):
    """Raised when the RAG generation step fails."""


class AnalyticsServiceError(IAServiceError):
    """Raised when analytics cannot be generated."""
