# Memoria del Repositorio — StudyLanz DAW (agents.md)

## 1. Descripción del Proyecto
**StudyLanz DAW** es una aplicación web y de consola diseñada para alumnos de 2º DAW del I.E.S. Politécnico Hermenegildo Lanz. Permite gestionar las entregas de las asignaturas del curso y transformar apuntes de clase en resúmenes estructurados y preguntas tipo test autocorregibles utilizando modelos de IA locales (Ollama) y en la nube (OpenRouter / Google Gemini).

## 2. Reglas de Desarrollo Obligatorias (Fuente de Verdad)
1. **Tipado Estricto**: Todo el código en `src/` debe usar tipos explícitos en TypeScript.
2. **Prohibición de `any`**: Queda prohibido el uso del tipo `any`. Toda tarea, apunte o pregunta de test debe usar su interfaz (`TareaDAW`, `ApunteClase`, `PreguntaTest`).
3. **Idioma**: Todos los textos de interfaz, comentarios y mensajes de error deben estar escritos en español.
4. **Restricciones de Hardware (`llmfit`)**:
   - Equipo analizado: Intel Core i5-1135G7 (8 hilos), 11.5 GB RAM total, gráfica integrada Intel Iris Xe.
   - En local (Ollama) solo se permiten modelos ligeros de 1.5B a 3B (`llama3.2:3b` y `qwen2.5-coder:1.5b`) para tareas de resumen rápido y uso sin conexión, garantizando no superar los 11.5 GB de RAM.
   - La generación de cuestionarios complejos o validación multipaso se delega a `gemini-2.5-flash` o `north-mini-code` (Cloud) con 0 consumo de RAM local.
5. **Verificación Continua**: Cualquier cambio debe superar el comando `/validate` y la suite `npm test`.
