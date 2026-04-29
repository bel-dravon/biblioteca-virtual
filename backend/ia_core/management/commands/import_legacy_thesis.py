import hashlib
import logging
import os
from pathlib import Path
from typing import List
import chromadb
from pathlib import Path
from django.conf import settings
import pytesseract
from pdf2image import convert_from_path
from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from biblioteca.models import TrabajoInvestigacion
from ia_core.models import ThesisEmbedding
from ia_core.services.exceptions import EmbeddingError
from ia_core.services.gemini_client import DEFAULT_EMBEDDING_MODEL, embed_text

logger = logging.getLogger(__name__)

CHROMA_COLLECTION_NAME = "tesis_collection"
CHROMA_PATH = Path(settings.BASE_DIR) / "chroma_db"

class Command(BaseCommand):
    help = (
        "Importa tesis escaneadas desde una carpeta local, "
        "ejecuta OCR, guarda contenido y genera embeddings."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--input-dir",
            type=str,
            default="documentos_para_procesar",
            help="Ruta de la carpeta con PDFs a procesar.",
        )
        parser.add_argument(
            "--lang",
            type=str,
            default="spa",
            help="Idioma de OCR para Tesseract (default: spa).",
        )
        parser.add_argument(
            "--dpi",
            type=int,
            default=300,
            help="Resolucion DPI para conversion de PDF a imagen.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Numero maximo de PDFs a procesar (0 = todos).",
        )

    def handle(self, *args, **options):
        input_dir = self._resolve_input_dir(options["input_dir"])
        lang = options["lang"]
        dpi = options["dpi"]
        limit = options["limit"]

        self.poppler_path = os.environ.get("POPPLER_PATH")
        self._configure_tesseract()

        pdf_files = self._collect_pdfs(input_dir)
        if limit and limit > 0:
            pdf_files = pdf_files[:limit]

        total = len(pdf_files)
        if total == 0:
            self.stdout.write(self.style.WARNING("No se encontraron PDFs."))
            return

        self.stdout.write(
            f"Procesando {total} archivo(s) desde {input_dir}"
        )

        success = 0
        failed = 0

        for index, pdf_path in enumerate(pdf_files, start=1):
            self.stdout.write(f"[{index}/{total}] {pdf_path.name}")
            try:
                md5_hash = self._calculate_md5(pdf_path)
                duplicate_reason = self._duplicate_reason(pdf_path, md5_hash)
                if duplicate_reason:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Omitido (duplicado): {duplicate_reason}"
                        )
                    )
                    continue

                self._process_pdf(
                    pdf_path,
                    md5_hash,
                    lang=lang,
                    dpi=dpi,
                )
                success += 1
                self.stdout.write(self.style.SUCCESS("Importado correctamente."))
            except Exception as exc:
                failed += 1
                logger.exception("Error procesando %s", pdf_path.name)
                self.stderr.write(self.style.ERROR(str(exc)))

        self.stdout.write(
            self.style.SUCCESS(
                f"Importacion finalizada. Exitos: {success}, Fallos: {failed}"
            )
        )

    def _resolve_input_dir(self, raw_path: str) -> Path:
        base_dir = Path(settings.BASE_DIR)
        input_dir = Path(raw_path)
        if not input_dir.is_absolute():
            input_dir = base_dir / input_dir
        input_dir = input_dir.resolve()

        if not input_dir.exists() or not input_dir.is_dir():
            raise CommandError(f"Directorio no valido: {input_dir}")
        return input_dir

    def _collect_pdfs(self, input_dir: Path) -> List[Path]:
        pdfs = list(input_dir.glob("*.pdf")) + list(input_dir.glob("*.PDF"))
        return sorted(set(pdfs))

    def _process_pdf(self, pdf_path: Path, md5_hash: str,**kwargs) -> None:
        title = self._title_from_filename(pdf_path.stem)
        try:
            contenido = self._extract_text_from_pdf(pdf_path, **kwargs)
        except TypeError:
            contenido = self._extract_text_from_pdf(pdf_path)
            
        if not contenido:
            raise CommandError(f"No se pudo extraer texto del PDF: {pdf_path.name}")
            
        with transaction.atomic():
            trabajo = TrabajoInvestigacion.objects.create(
                titulo=title,
                resumen="Pendiente de procesamiento.",
                anio_publicacion=timezone.now().year,
                tipo_material="tesis",
                tiene_archivo_digital=True,
            )
            resumen = self._build_resumen(contenido)
            trabajo.contenido = contenido
            if resumen:
                trabajo.resumen = resumen
            trabajo.save(update_fields=["contenido", "resumen"])
            
            stored_path = self._store_pdf(pdf_path)
            trabajo.archivo_ruta.name = stored_path
            trabajo.save(update_fields=["archivo_ruta"])
            
        # --- INICIO DEL FLUJO RAG HACIA CHROMADB ---
        chunks = self._split_text_into_chunks(contenido, max_words=150)
        if not chunks:
            raise CommandError(f"No se generaron fragmentos para {pdf_path.name}")
            
        ids = []
        documents = []
        embeddings = []
        metadatas = []
        
        for chunk_index, chunk_text in enumerate(chunks):
            embedding = embed_text(
                chunk_text,
                model_name=DEFAULT_EMBEDDING_MODEL,
                task_type="retrieval_document",
            )
            ids.append(f"trabajo-{trabajo.id}-chunk-{chunk_index}")
            documents.append(chunk_text)
            embeddings.append(embedding)
            metadatas.append({
                "trabajo_id": trabajo.id,
                "titulo": trabajo.titulo,
                "filename": pdf_path.name,
                "md5": md5_hash,
                "chunk_index": chunk_index,
            })
            
        collection = self._get_chroma_collection()
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    def _extract_text_from_pdf(self, pdf_path: Path, lang: str, dpi: int) -> str:
        try:
            images = convert_from_path(
                str(pdf_path),
                dpi=dpi,
                poppler_path=self.poppler_path or None,
            )
        except Exception as exc:
            raise CommandError(f"Error convirtiendo PDF a imagen: {exc}") from exc

        text_blocks = []
        for image in images:
            try:
                text_blocks.append(pytesseract.image_to_string(image, lang=lang))
            except Exception as exc:
                raise CommandError(f"Error OCR en {pdf_path.name}: {exc}") from exc

        return "\n\n".join(block for block in text_blocks if block).strip()

    def _store_pdf(self, pdf_path: Path) -> str:
        target_name = f"tesis/{pdf_path.name}"
        try:
            with pdf_path.open("rb") as handle:
                stored_path = default_storage.save(target_name, File(handle))
            pdf_path.unlink()
            return stored_path
        except Exception as exc:
            raise CommandError(f"Error moviendo PDF a media: {exc}") from exc

    def _build_resumen(self, contenido: str, max_chars: int = 500) -> str:
        cleaned = (contenido or "").strip()
        if len(cleaned) < 50:
            return ""
        if len(cleaned) <= max_chars:
            return cleaned
        return f"{cleaned[:max_chars].rstrip()}..."

    def _build_embedding_text(self, trabajo: TrabajoInvestigacion, contenido: str) -> str:
        base_text = f"{trabajo.titulo}\n\n{trabajo.resumen}\n\n{contenido}".strip()
        return self._truncate_text(base_text, max_chars=12000)

    def _truncate_text(self, text: str, max_chars: int) -> str:
        if not text:
            raise EmbeddingError("Texto vacio para embedding.", code="EMPTY_TEXT")
        if len(text) <= max_chars:
            return text
        return text[:max_chars]

    def _title_from_filename(self, filename: str) -> str:
        title = filename.replace("_", " ").replace("-", " ").strip()
        if not title:
            title = f"Tesis {timezone.now().strftime('%Y%m%d%H%M%S')}"
        return title

    def _configure_tesseract(self) -> None:
        tesseract_cmd = os.environ.get("TESSERACT_CMD")
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def _calculate_md5(self, pdf_path: Path, chunk_size: int = 8192) -> str:
        hash_md5 = hashlib.md5()
        try:
            with pdf_path.open("rb") as handle:
                for chunk in iter(lambda: handle.read(chunk_size), b""):
                    hash_md5.update(chunk)
        except Exception as exc:
            raise CommandError(f"Error calculando MD5: {exc}") from exc
        return hash_md5.hexdigest()

    def _duplicate_reason(self, pdf_path: Path, md5_hash: str) -> str:
        filename = pdf_path.name
        if ThesisEmbedding.objects.filter(metadata__md5=md5_hash).exists():
            return f"hash MD5 ya importado ({md5_hash})"

        if ThesisEmbedding.objects.filter(metadata__filename=filename).exists():
            return f"nombre de archivo ya importado ({filename})"

        if TrabajoInvestigacion.objects.filter(
            archivo_ruta__endswith=filename
        ).exists():
            return f"PDF existente en media ({filename})"

        return ""
    
    def _split_text_into_chunks(self, text: str, max_words: int = 150) -> list[str]:
        words = (text or "").split()
        if not words:
            return []
        chunks = []
        for i in range(0, len(words), max_words):
            chunk = " ".join(words[i:i + max_words]).strip()
            if chunk:
                chunks.append(chunk)
        return chunks

    def _get_chroma_collection(self):
        client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        return client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
