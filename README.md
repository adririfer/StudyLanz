# StudyLanz DAW — Gestor de Entregas y Asistente de Estudio con IA

Práctica **Actividad Resumen** de Inteligencia Artificial (2º DAW — I.E.S. Politécnico Hermenegildo Lanz, Granada).  
**Autor:** Adrián Rivas Fernández

---

## ¿Qué hace esta aplicación?

1. **Agenda de Entregas (2º DAW):** Permite añadir, filtrar y marcar como entregadas las prácticas de clase (`IA`, `Despliegue`, `DWES`, `DWEC`, `DIW`), guardando los datos en `localStorage`.
2. **Asistente de Apuntes y Exámenes Tipo Test:** Permite escribir cualquier tema o pegar apuntes y elegir el proveedor de IA para generar un resumen con ejemplos de código o un examen tipo test autocorregible.

---

## Elementos del Temario Integrados

| Elemento | Archivo / Ubicación | Función en el proyecto |
| :--- | :--- | :--- |
| **llmfit** | `src/gestor.ts` | Mide el hardware real (Intel i5-1135G7, 11.5 GB RAM) y fija modelos de 1.5B-3B en local. |
| **Ollama** | `opencode.json`, `dist/server.js` | Inferencia local (`llama3.2:3b` y `qwen2.5-coder:1.5b`) sin gastar tokens ni depender de red. |
| **OpenRouter y Gemini** | `opencode.json`, `dist/server.js` | Inferencia Cloud (`north-mini-code` y `gemini-2.5-flash`) sin ocupar RAM local. |
| **Meta-Gema y Gemas** | `gemini_gemas/*.md` | Definen el rol del Tutor DAW y las reglas de calidad del Validador QA. |
| **OpenCode (Memoria y Plan/Build)** | `agents.md`, `opencode.json` | Reglas persistentes (TypeScript estricto, 0 `any`, español) cargadas con `/init`. |
| **Comandos OpenCode** | `.opencode/commands/` | Comandos reutilizables `/prompt` y `/validate`. |
| **Verificación y Validación** | `dist/validador.js`, `dist/validador.test.js` | Suite de comprobación de reglas, hardware `llmfit` y tests automatizados. |

---

## Cómo ejecutarlo

```bash
# 1. Pasar la batería de tests (4/4)
npm test

# 2. Validar las reglas de agents.md y hardware (5/5)
npm run validate

# 3. Ver el resumen en consola
npm start

# 4. Abrir la aplicación web interactiva en http://localhost:3005
npm run web
```

---

## Documentación incluida en el repositorio

* [Memoria_StudyLanz_Adrian_Rivas.pdf](./Memoria_StudyLanz_Adrian_Rivas.pdf) — Documento explicativo de la práctica.
* [Presentacion_StudyLanz_Adrian_Rivas.pdf](./Presentacion_StudyLanz_Adrian_Rivas.pdf) — Presentación en diapositivas para la exposición en clase.
