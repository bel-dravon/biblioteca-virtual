# Dependencies: scikit-learn for clustering.
import logging
from typing import Any, Dict, List

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

from shared.constants import STOP_WORDS_ES
from ia_core.models import ThesisEmbedding
from .exceptions import AnalyticsServiceError

logger = logging.getLogger(__name__)


def generate_trend_analysis(n_clusters: int = 6) -> Dict[str, Any]:
    """Generate topic clusters for thesis embeddings."""
    embeddings = list(ThesisEmbedding.objects.select_related("trabajo"))
    total_docs = len(embeddings)
    if total_docs < 2:
        return {
            "clusters": [],
            "summary": {"total_documents": total_docs, "clusters": 0},
        }

    vectors = [list(item.embedding) for item in embeddings]
    texts = [
        f"{item.trabajo.titulo} {item.trabajo.resumen}".strip()
        for item in embeddings
    ]
    k = _resolve_cluster_count(n_clusters, total_docs)

    try:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(vectors)
        clusters = _build_cluster_payload(labels, texts)
        return {
            "clusters": clusters,
            "summary": {"total_documents": total_docs, "clusters": k},
        }
    except Exception as exc:  # pragma: no cover - external dependency
        logger.exception("Trend analysis failed.")
        raise AnalyticsServiceError(
            "Failed to generate trend analysis.",
            code="ANALYTICS_ERROR",
        ) from exc


def _resolve_cluster_count(requested: int, total_docs: int) -> int:
    if requested < 2:
        return 2 if total_docs >= 2 else total_docs
    return min(requested, total_docs)


def _build_cluster_payload(labels: np.ndarray, texts: List[str]) -> List[Dict[str, Any]]:
    vectorizer = TfidfVectorizer(
        stop_words=STOP_WORDS_ES,
        max_features=1500,
    )
    try:
        tfidf_matrix = vectorizer.fit_transform(texts)
        terms = vectorizer.get_feature_names_out()
    except ValueError:
        tfidf_matrix = None
        terms = []

    clusters: List[Dict[str, Any]] = []
    label_set = sorted(set(labels.tolist()))
    for cluster_id in label_set:
        indices = [idx for idx, label in enumerate(labels) if label == cluster_id]
        if not indices:
            continue

        keywords = _extract_cluster_keywords(tfidf_matrix, terms, indices)
        label = ", ".join(keywords[:3]) if keywords else f"Cluster {cluster_id + 1}"
        clusters.append(
            {
                "id": int(cluster_id),
                "label": label,
                "count": len(indices),
                "keywords": keywords,
            }
        )

    return clusters


def _extract_cluster_keywords(
    tfidf_matrix: Any,
    terms: List[str],
    indices: List[int],
) -> List[str]:
    if tfidf_matrix is None or not terms:
        return []

    cluster_matrix = tfidf_matrix[indices]
    mean_vector = np.asarray(cluster_matrix.mean(axis=0)).ravel()
    if mean_vector.size == 0:
        return []

    top_indices = mean_vector.argsort()[::-1][:5]
    return [terms[i] for i in top_indices if mean_vector[i] > 0]
