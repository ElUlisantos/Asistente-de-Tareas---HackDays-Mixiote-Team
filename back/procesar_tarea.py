import json
from google import genai

# Inicializar el cliente de Gemini
client = genai.Client(api_key="TU_API_KEY_DE_GEMINI_AQUI")


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
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )

        texto_limpio = response.text.strip()

        if texto_limpio.startswith("```json"):
            texto_limpio = texto_limpio.replace("```json", "").replace("```", "").strip()

        return json.loads(texto_limpio)

    except Exception as e:
        print(f"Error procesando con Gemini: {e}")
        return None


# --- Texto plano de entrada ---
texto_usuario = "Tengo que entregar el reporte de física el viernes a las 3pm, incluye gráficas y conclusiones"

tarea = extraer_datos_tarea(texto_usuario)

if tarea:
    print("Tarea extraída:")
    print(json.dumps(tarea, indent=2, ensure_ascii=False))
else:
    print("No se pudo procesar el texto.")
