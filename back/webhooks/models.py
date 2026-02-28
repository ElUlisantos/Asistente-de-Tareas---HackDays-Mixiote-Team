from django.db import models

class Tarea(models.Model):
    # Los datos que extraemos directamente con Gemini
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    
    # OJO AQUÍ: Usamos CharField en lugar de DateTimeField. 
    # Como Gemini nos devolverá frases como "Mañana a las 5" o "El viernes", 
    # guardarlo como texto te ahorra horas de intentar parsear fechas en el hackathon.
    fecha_mencionada = models.CharField(max_length=100, blank=True, null=True)
    
    # Campos de control interno (Vitales para la app web)
    completada = models.BooleanField(default=False)
    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Así se verá bonito cuando entres al panel de administrador de Django
        return f"{self.titulo} - {'✅' if self.completada else '⏳'}"