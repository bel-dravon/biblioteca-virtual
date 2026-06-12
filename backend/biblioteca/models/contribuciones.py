import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import User
import fitz 
from docx import Document
import hashlib
import os


class DocumentoAporte(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente de verificación'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]

    # --- Quién aportó ---
    usuario_interno = models.ForeignKey(
        User, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='aportes'
    )

    # --- Datos del aportante (obligatorios para externos) ---
    nombre_completo = models.CharField(max_length=200)
    email = models.EmailField(db_index=True)
    institucion = models.CharField(max_length=200, blank=True)
    grado_academico = models.CharField(max_length=100, blank=True)

    # --- El documento aportado ---
    titulo = models.CharField(max_length=300)
    descripcion = models.TextField()
    archivo = models.FileField(upload_to='aportes/%Y/%m/')
    archivo_hash = models.CharField(
        max_length=64, blank=True, db_index=True,
        help_text="Hash MD5 del archivo para detectar duplicados"
    )

    # --- Control de estado ---
    estado = models.CharField(
        max_length=20, choices=ESTADOS, default='pendiente'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        help_text="Si fue rechazado, ¿por qué?"
    )

    # --- Revisión manual ---
    revisado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='aportes_revisados'
    )
    revisado_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Documento Aporte'
        verbose_name_plural = 'Documentos Aporte'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titulo} ({self.estado})"

    def calcular_hash(self):
        """Calcula hash MD5 del archivo para evitar duplicados."""
        if not self.archivo:
            return
        md5 = hashlib.md5()
        self.archivo.seek(0)
        for chunk in self.archivo.chunks():
            md5.update(chunk)
        self.archivo_hash = md5.hexdigest()
        self.archivo.seek(0)

    def save(self, *args, **kwargs):
        # Calcular hash antes de guardar
        if self.archivo and not self.archivo_hash:
            self.calcular_hash()
        super().save(*args, **kwargs)

    def verificar_automaticamente(self):
        """
        Verifica automáticamente si el aporte es válido.
        Retorna (aprobado: bool, motivo: str)
        """
        # 1. Verificar formato
        ext = os.path.splitext(self.archivo.name)[1].lower()
        if ext not in ['.pdf', '.docx']:
            return False, "Formato no permitido. Solo PDF o DOCX."

        # 2. Verificar tamaño
        if self.archivo.size < 50 * 1024:  # 50KB mínimo
            return False, "El archivo es demasiado pequeño. Parece estar vacío."

        # 3. Verificar páginas/contenido según formato
        if ext == '.pdf':
            try:
                doc = fitz.open(self.archivo.path)
                num_paginas = len(doc)
                
                if num_paginas < 2:
                    doc.close()
                    return False, f"El documento solo tiene {num_paginas} páginas. Mínimo requerido: 2."
                
                # Extraer texto y contar palabras
                texto = ""
                for pagina in doc:
                    texto += pagina.get_text()
                doc.close()
                
                palabras = len(texto.split())
                if palabras < 250:
                    return False, f"El documento tiene muy poco contenido ({palabras} palabras). Mínimo: 250."
                
            except Exception as e:
                return False, f"No se pudo leer el PDF: {str(e)}"
        
        elif ext == '.docx':
            try:
                doc = Document(self.archivo.path)
                num_parrafos = len(doc.paragraphs)
                
                if num_parrafos < 10:
                    return False, f"El documento tiene muy pocos párrafos ({num_parrafos}). Mínimo: 10."
                
                # Contar palabras totales
                palabras = sum(len(p.text.split()) for p in doc.paragraphs if p.text)
                if palabras < 250:
                    return False, f"El documento tiene muy poco contenido ({palabras} palabras). Mínimo: 250."
                    
            except Exception as e:
                return False, f"No se pudo leer el DOCX: {str(e)}"

        # 4. Verificar no duplicado (hash)
        self.calcular_hash()
        from biblioteca.models import TrabajoInvestigacion
        existe = TrabajoInvestigacion.objects.filter(
            archivo_ruta__icontains=self.archivo_hash[:16]
        ).exists()
        if existe:
            return False, "Este documento ya existe en nuestra biblioteca."

        return True, "Documento verificado automáticamente. Aprobado."

    def save(self, *args, **kwargs):
        # Calcular hash antes de guardar
        if self.archivo and not self.archivo_hash:
            self.calcular_hash()
        
        # Si es nuevo y está pendiente, verificar automáticamente
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.estado == 'pendiente':
            aprobado, motivo = self.verificar_automaticamente()
            if aprobado:
                self.estado = 'aprobado'
                self.motivo_rechazo = ''
                # Generar 3 créditos automáticamente
                self.generar_creditos()
            else:
                self.estado = 'rechazado'
                self.motivo_rechazo = motivo
            super().save(update_fields=['estado', 'motivo_rechazo'])
    
    def verificar_automaticamente(self):
        """
        Verifica automáticamente si el aporte es válido.
        Retorna (aprobado: bool, motivo: str)
        """
        import os
        import fitz  # PyMuPDF
        from docx import Document

        # 1. Verificar formato
        ext = os.path.splitext(self.archivo.name)[1].lower()
        if ext not in ['.pdf', '.docx']:
            return False, "Formato no permitido. Solo PDF o DOCX."

        # 2. Verificar tamaño
        if self.archivo.size < 50 * 1024:  # 50KB mínimo
            return False, "El archivo es demasiado pequeño. Parece estar vacío."

        # 3. Verificar páginas/contenido según formato
        if ext == '.pdf':
            try:
                doc = fitz.open(self.archivo.path)
                num_paginas = len(doc)
                
                if num_paginas < 5:
                    doc.close()
                    return False, f"El documento solo tiene {num_paginas} páginas. Mínimo requerido: 5."
                
                # Extraer texto y contar palabras
                texto = ""
                for pagina in doc:
                    texto += pagina.get_text()
                doc.close()
                
                palabras = len(texto.split())
                if palabras < 250:
                    return False, f"El documento tiene muy poco contenido ({palabras} palabras). Mínimo: 250."
                
            except Exception as e:
                return False, f"No se pudo leer el PDF: {str(e)}"
        
        elif ext == '.docx':
            try:
                doc = Document(self.archivo.path)
                num_parrafos = len(doc.paragraphs)
                
                if num_parrafos < 10:
                    return False, f"El documento tiene muy pocos párrafos ({num_parrafos}). Mínimo: 10."
                
                # Contar palabras totales
                palabras = sum(len(p.text.split()) for p in doc.paragraphs if p.text)
                if palabras < 250:
                    return False, f"El documento tiene muy poco contenido ({palabras} palabras). Mínimo: 250."
                    
            except Exception as e:
                return False, f"No se pudo leer el DOCX: {str(e)}"

        # 4. Verificar no duplicado (hash)
        self.calcular_hash()
        from biblioteca.models import TrabajoInvestigacion
        existe = TrabajoInvestigacion.objects.filter(
            archivo_ruta__icontains=self.archivo_hash[:16]
        ).exists()
        if existe:
            return False, "Este documento ya existe en nuestra biblioteca."

        return True, "Documento verificado automáticamente. Aprobado."

    def generar_creditos(self):
        """Genera 2 créditos de descarga. Solo externos reciben token."""
        from biblioteca.models import CreditoDescarga
        import uuid
        
        for i in range(2):  # ← 2 descargas, no 3
            # Solo generar token si NO hay usuario interno
            token = None
            if not self.usuario_interno:
                token = str(uuid.uuid4()).replace('-', '')
            
            CreditoDescarga.objects.create(
                aporte=self,
                usuario=self.usuario_interno,  # null si es externo
                email_externo=self.email if not self.usuario_interno else None,
                token_acceso=token  # null si es interno
            )


class CreditoDescarga(models.Model):
    """
    Cada fila = 1 descarga permitida.
    Al aprobar un aporte, se crean 3 filas de este modelo.
    """
    usuario = models.ForeignKey(
        User, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='creditos_descarga'
    )
    # Para externos sin cuenta: email + token único
    email_externo = models.EmailField(null=True, blank=True)
    token_acceso = models.CharField(
        max_length=64, null=True, blank=True,
        db_index=True, unique=True
    )

    aporte = models.ForeignKey(
        DocumentoAporte, on_delete=models.CASCADE,
        related_name='creditos'
    )
    usado = models.BooleanField(default=False)
    usado_en = models.DateTimeField(null=True, blank=True)
    usado_para = models.ForeignKey(
        'biblioteca.TrabajoInvestigacion',
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Crédito de Descarga'
        verbose_name_plural = 'Créditos de Descarga'

    def __str__(self):
        return f"Crédito {self.id} ({'usado' if self.usado else 'disponible'})"


class AccesoExterno(models.Model):
    """
    Registra que un externo (por token) ha desbloqueado
    la vista completa de un documento específico.
    """
    token_acceso = models.CharField(max_length=64, db_index=True)
    trabajo = models.ForeignKey(
        'biblioteca.TrabajoInvestigacion',
        on_delete=models.CASCADE,
        related_name='accesos_externos'
    )
    email = models.EmailField()
    nombre_completo = models.CharField(max_length=200)
    fecha_acceso = models.DateTimeField(auto_now_add=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = 'Acceso Externo'
        verbose_name_plural = 'Accesos Externos'
        # Un mismo token no puede desbloquear el mismo trabajo 2 veces
        unique_together = ['token_acceso', 'trabajo']

    def __str__(self):
        return f"Acceso {self.email} -> {self.trabajo.titulo}"