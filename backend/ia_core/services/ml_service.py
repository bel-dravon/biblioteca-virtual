import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

from biblioteca.models import TrabajoInvestigacion
from shared.constants import STOP_WORDS_ES


def obtener_recomendaciones(trabajo_id, limite=3):
    trabajos = list(TrabajoInvestigacion.objects.all().values('id', 'titulo', 'resumen'))
    if len(trabajos) < 2:
        return []

    df = pd.DataFrame(trabajos)
    df['contenido'] = df['titulo'].fillna('') + " " + df['resumen'].fillna('')

    tfidf = TfidfVectorizer(stop_words=STOP_WORDS_ES)
    tfidf_matrix = tfidf.fit_transform(df['contenido'])

    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

    try:
        idx = df.index[df['id'] == int(trabajo_id)][0]
    except IndexError:
        return []

    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:limite + 1]

    trabajo_indices = [i[0] for i in sim_scores]
    recomendados_ids = df['id'].iloc[trabajo_indices].tolist()

    return TrabajoInvestigacion.objects.filter(id__in=recomendados_ids)


def verificar_originalidad(texto_idea):
    trabajos = list(TrabajoInvestigacion.objects.all().values('id', 'titulo', 'resumen'))
    if not trabajos:
        return {"es_original": True, "mensaje": "Sin datos previos.", "similares": []}

    df = pd.DataFrame(trabajos)
    df['contenido'] = df['titulo'].fillna('') + " " + df['resumen'].fillna('')

    df.loc[len(df)] = {'id': -1, 'titulo': 'NUEVO', 'resumen': '', 'contenido': texto_idea}

    tfidf = TfidfVectorizer(stop_words=STOP_WORDS_ES)
    tfidf_matrix = tfidf.fit_transform(df['contenido'])

    cosine_sim = linear_kernel(tfidf_matrix[-1:], tfidf_matrix[:-1])

    scores = list(enumerate(cosine_sim[0]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)

    top_3 = scores[:3]
    resultados = []
    max_similitud = 0

    for idx, score in top_3:
        similitud = round(score * 100, 2)
        if similitud > max_similitud:
            max_similitud = similitud

        trabajo_real = TrabajoInvestigacion.objects.get(id=df.iloc[idx]['id'])
        resultados.append({
            "titulo": trabajo_real.titulo,
            "similitud": f"{similitud}%",
            "id": trabajo_real.id
        })

    es_original = max_similitud < 40

    return {
        "es_original": es_original,
        "max_similitud": max_similitud,
        "similares": resultados
    }
