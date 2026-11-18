---
description: Ejecuta la validación completa del proyecto StudyLanz DAW verificando reglas de agents.md, límites de llmfit y tests.
---

Verifica que todos los archivos del repositorio cumplan:
1. Ausencia total del tipo `any` en `src/`.
2. Cumplimiento de las interfaces `TareaDAW`, `ApunteClase` y `PreguntaTest`.
3. Mensajes de validación y errores íntegramente en español.
4. Respeto de los límites de RAM de `llmfit` (máximo 11.5 GB totales; modelos locales <= 3B parámetros).
5. Ejecución exitosa de la batería de pruebas (`npm test`).
