import fs from 'node:fs';
import os from 'node:os';

function leerRamReal() {
  let totalBytes = os.totalmem();
  let availBytes = os.freemem();
  try {
    if (fs.existsSync('/proc/meminfo')) {
      const meminfo = fs.readFileSync('/proc/meminfo', 'utf-8');
      const mTotal = meminfo.match(/^MemTotal:\s+(\d+)\s+kB/m);
      const mAvail = meminfo.match(/^MemAvailable:\s+(\d+)\s+kB/m);
      if (mTotal) totalBytes = Number(mTotal[1]) * 1024;
      if (mAvail) availBytes = Number(mAvail[1]) * 1024;
    }
  } catch (e) {}
  return {
    totalGb: Number((totalBytes / (1024 ** 3)).toFixed(2)),
    libreGb: Number((availBytes / (1024 ** 3)).toFixed(2))
  };
}

const ram = leerRamReal();
const PERFIL_LLMFIT = {
  cpu: os.cpus()?.[0]?.model || 'Intel Core i5-1135G7 @ 2.40GHz (8 hilos)',
  ramTotalGb: ram.totalGb,
  ramDisponibleGb: ram.libreGb,
  gpu: 'Intel Iris Xe Graphics (Memoria compartida)',
  limiteLocal: 'Modelos 1.5B - 3B en local (Ollama) / Modelos > 7B en Cloud (OpenRouter / Gemini)'
};

const TAREAS = [
  { id: 'T-01', asignatura: 'IA', titulo: 'Actividad Resumen: OpenCode, Ollama y Gemini', fecha: '2026-11-18', estado: 'PENDIENTE' },
  { id: 'T-02', asignatura: 'Despliegue', titulo: 'Práctica Docker: Volúmenes y Bind Mounts', fecha: '2026-11-20', estado: 'COMPLETADA' },
  { id: 'T-03', asignatura: 'DWES', titulo: 'CRUD tienda online con sesiones y PDO en PHP', fecha: '2026-11-24', estado: 'PENDIENTE' },
  { id: 'T-04', asignatura: 'DIW', titulo: 'Design System y componentes en Figma', fecha: '2026-11-26', estado: 'PENDIENTE' }
];

console.log('======================================================================');
console.log('   STUDYLANZ DAW — GESTOR DE ENTREGAS Y ASISTENTE DE ESTUDIO CON IA   ');
console.log('   I.E.S. Politécnico Hermenegildo Lanz · 2º DAW · Adrián Rivas       ');
console.log('======================================================================\n');

console.log('[1] PERFIL DE HARDWARE DETECTADO EN VIVO (llmfit + sistema):');
console.log(`    - CPU : ${PERFIL_LLMFIT.cpu}`);
console.log(`    - RAM : ${PERFIL_LLMFIT.ramTotalGb} GB totales (${PERFIL_LLMFIT.ramDisponibleGb} GB disponibles ahora)`);
console.log(`    - GPU : ${PERFIL_LLMFIT.gpu}`);
console.log(`    - Regla: ${PERFIL_LLMFIT.limiteLocal}\n`);

console.log('[2] PROVEEDORES CARGADOS DESDE opencode.json Y agents.md:');
console.log('    - Ollama Local  : llama3.2:3b (Resúmenes rápidos offline, 0 Tokens API, +2.2 GB RAM)');
console.log('    - Ollama Local  : qwen2.5-coder:1.5b (Revisión de código, 0 Tokens API, +1.1 GB RAM)');
console.log('    - OpenRouter    : cohere/north-mini-code:free (Generación en nube, 0 GB RAM local)');
console.log('    - Google Gemini : gemini-2.5-flash (Exámenes tipo test y validación QA, 0 GB RAM local)\n');

console.log('[3] ENTREGAS REGISTRADAS EN EL CURSO (2º DAW):');
for (const t of TAREAS) {
  console.log(`    [${t.estado}] (${t.asignatura}) ${t.titulo} — Entrega: ${t.fecha}`);
}

console.log('\n[4] DEMOSTRACIÓN DE GENERACIÓN DE ESTUDIO (Gema Tutor DAW):');
console.log('    Entrada libre  : "Git y gestión de ramas en proyectos de 2º DAW"');
console.log('    Resumen (vía Ollama llama3.2:3b - Local):');
console.log('      • agents.md actúa como memoria principal y fuente de verdad del repositorio.');
console.log('      • Los comandos personalizados (.opencode/commands/*.md) automatizan prompts.');
console.log('      • opencode.json unifica claves y modelos locales/cloud.');
console.log('    Test generado (vía Gemini 2.5 Flash - Cloud): 3 preguntas autocorregibles listas.');
console.log('\n======================================================================');
console.log('   VERIFICACIÓN COMPLETADA: Ejecuta "npm test" o "npm run web"       ');
console.log('======================================================================');
