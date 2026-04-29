import logging
from typing import Any

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from biblioteca.permissions import IsAdministrador
from shared.response_helpers import api_error_response
from .services.analytics_service import generate_trend_analysis
from .services.exceptions import IAServiceError
from .services.search_service import generate_rag_response, search_similar_thesis

logger = logging.getLogger(__name__)


class RagSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = (request.data.get("query") or "").strip()
        limit = _parse_limit(request.data.get("limit"), default=5)
        filters = request.data.get("filters") or {}
        if not isinstance(filters, dict):
            return _error_response(
                "Filters must be an object.",
                "INVALID_FILTERS",
                status.HTTP_400_BAD_REQUEST,
            )

        try:
            results = search_similar_thesis(
                query_text=query,
                limit=limit,
                metadata_filters=filters,
            )
            return Response({"results": results}, status=status.HTTP_200_OK)
        except IAServiceError as exc:
            return _error_response(str(exc), exc.code, status.HTTP_400_BAD_REQUEST)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Unexpected search error.")
            return _error_response(
                "Unexpected error during search.",
                "SEARCH_ERROR",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RagAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = (request.data.get("query") or "").strip()
        limit = _parse_limit(request.data.get("limit"), default=5)
        filters = request.data.get("filters") or {}
        if not isinstance(filters, dict):
            return _error_response(
                "Filters must be an object.",
                "INVALID_FILTERS",
                status.HTTP_400_BAD_REQUEST,
            )

        try:
            results = search_similar_thesis(
                query_text=query,
                limit=limit,
                metadata_filters=filters,
            )
            if not results:
                return _error_response(
                    "No context documents found.",
                    "NO_CONTEXT",
                    status.HTTP_404_NOT_FOUND,
                )

            rag_output = generate_rag_response(query=query, context_documents=results)
            return Response(
                {
                    "answer": rag_output.get("answer"),
                    "sources": rag_output.get("sources", []),
                    "results": results,
                },
                status=status.HTTP_200_OK,
            )
        except IAServiceError as exc:
            return _error_response(str(exc), exc.code, status.HTTP_400_BAD_REQUEST)
        except Exception:  # pragma: no cover - defensive
            logger.exception("Unexpected RAG error.")
            return _error_response(
                "Unexpected error during RAG generation.",
                "RAG_ERROR",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrendAnalyticsView(APIView):
    permission_classes = [IsAdministrador]

    def get(self, request):
        clusters_param = request.query_params.get("clusters")
        cluster_count = _parse_limit(clusters_param, default=6)

        try:
            data = generate_trend_analysis(n_clusters=cluster_count)
            return Response(data, status=status.HTTP_200_OK)
        except IAServiceError as exc:
            return _error_response(str(exc), exc.code, status.HTTP_400_BAD_REQUEST)
        except Exception:  # pragma: no cover - defensive
            logger.exception("Unexpected analytics error.")
            return _error_response(
                "Unexpected error during analytics.",
                "ANALYTICS_ERROR",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


def _parse_limit(value: Any, default: int) -> int:
    try:
        limit = int(value)
        if limit <= 0:
            return default
        return min(limit, 50)
    except (TypeError, ValueError):
        return default


def _error_response(message: str, code: str, http_status: int) -> Response:
    return api_error_response(
        message=message,
        error_code=code,
        http_status=http_status,
    )
