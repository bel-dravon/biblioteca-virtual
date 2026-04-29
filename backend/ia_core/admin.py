from django.contrib import admin

from .models import ThesisEmbedding


@admin.register(ThesisEmbedding)
class ThesisEmbeddingAdmin(admin.ModelAdmin):
    list_display = ('trabajo', 'created_at')
    search_fields = ('trabajo__titulo',)
    readonly_fields = ('embedding_vector', 'created_at')

    @admin.display(description='Embedding')
    def embedding_vector(self, obj):
        return obj.embedding
