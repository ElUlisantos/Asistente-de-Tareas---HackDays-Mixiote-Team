import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Tarea

# NUEVO: Importamos la librería moderna
from google import genai 

# NUEVO: Así se inicializa el cliente ahora
client = genai.Client(api_key="TU_API_KEY_AQUÍ")  # Reemplaza con tu API Key real

def extraer_datos_tarea(texto_usuario):
    prompt = f"""
    Eres el motor de procesamiento de un gestor de tareas. 
    Analiza el siguiente texto dictado por un usuario:
    
    "{texto_usuario}"
    
    Extrae la información y devuélvela ESTRICTAMENTE en formato JSON con la siguiente estructura exacta:
    {{
        "titulo": "Un título muy corto y claro (máximo 5 palabras)",
        "descripcion": "Los detalles o contexto adicional. Si no hay, devuelve un string vacío ''",
        "fecha": "La fecha, día o la hora mencionada (ej. 'Mañana a las 5pm', 'Viernes'). Si no menciona nada, devuelve null"
    }}
    
    No incluyas saludos, ni markdown, ni comillas triples. Devuelve únicamente el texto en formato JSON válido.
    """
    
    try:
        # NUEVO: La forma actualizada de llamar al modelo (usamos la versión 2.0 que es la más robusta)
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt
        )
        
        # El texto ahora viene directo en response.text
        texto_limpio = response.text.strip()
        
        if texto_limpio.startswith("```json"):
            texto_limpio = texto_limpio.replace("```json", "").replace("```", "").strip()
            
        return json.loads(texto_limpio)
        
    except Exception as e:
        print(f"Error procesando con Gemini: {e}")
        return None


@csrf_exempt
def endpoint_procesar_texto(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            texto_recibido = body.get('texto', '')
            
            if not texto_recibido:
                return JsonResponse({"error": "No enviaste ningún texto"}, status=400)
                
            tarea_estructurada = extraer_datos_tarea(texto_recibido)
            
            if tarea_estructurada:
                # ==========================================
                # NUEVO: Guardamos directamente en la Base de Datos
                # ==========================================
                nueva_tarea = Tarea.objects.create(
                    titulo=tarea_estructurada.get('titulo', 'Tarea sin título'),
                    descripcion=tarea_estructurada.get('descripcion', ''),
                    fecha_mencionada=tarea_estructurada.get('fecha', '')
                )
                
                # Devolvemos una respuesta de éxito con el ID que se le asignó en la BD
                return JsonResponse({
                    "status": "success",
                    "message": "¡Tarea guardada exitosamente!",
                    "db_id": nueva_tarea.id,
                    "data": tarea_estructurada
                })
            else:
                return JsonResponse({"error": "Gemini no pudo procesar el texto"}, status=500)
                
        except json.JSONDecodeError:
            return JsonResponse({"error": "El cuerpo de la petición debe ser JSON válido"}, status=400)

    return JsonResponse({"error": "Método no permitido"}, status=405)