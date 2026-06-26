from rest_framework import viewsets
from biblioteca.models import PaginaPDF
from biblioteca.serializers import PaginaPDFSerializer


class PaginaPDFViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaginaPDF.objects.all()
    serializer_class = PaginaPDFSerializer
    filter_backends = []

    def get_queryset(self):
        queryset = PaginaPDF.objects.all()
        material_id = self.request.query_params.get('material', None)
        if material_id:
            queryset = queryset.filter(material_id=material_id)
        return queryset