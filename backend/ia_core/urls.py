from django.urls import path

from .views import RagAnswerView, RagSearchView, TrendAnalyticsView

urlpatterns = [
    path("search/", RagSearchView.as_view(), name="ia-search"),
    path("rag/", RagAnswerView.as_view(), name="ia-rag"),
    path("analytics/trends/", TrendAnalyticsView.as_view(), name="ia-trends"),
]
