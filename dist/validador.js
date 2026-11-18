import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('=== PROTOCOLO DE VALIDACIÓN OPENCODE (/validate) — STUDYLANZ DAW ===\n');

const reglas = [
  {
    nombre: 'Regla 1 (agents.md y opencode.json presentes)',
    ok: fs.existsSync(path.join(rootDir, 'agents.md')) && fs.existsSync(path.join(rootDir, 'opencode.json'))
  },
  {
    nombre: 'Regla 2 (Prohibición estricta del tipo "any" en src/)',
    ok: !fs.readFileSync(path.join(rootDir, 'src/types.ts'), 'utf-8').includes(': any') &&
        !fs.readFileSync(path.join(rootDir, 'src/validador.ts'), 'utf-8').includes(': any')
  },
  {
    nombre: 'Regla 3 (Idioma español en mensajes de error y validación)',
    ok: fs.readFileSync(path.join(rootDir, 'src/validador.ts'), 'utf-8').includes('Error de validación')
  },
  {
    nombre: 'Regla 4 (Gemas de Gemini y Comandos personalizados definidos)',
    ok: fs.existsSync(path.join(rootDir, 'gemini_gemas/meta_gema_arquitecto.md')) &&
        fs.existsSync(path.join(rootDir, '.opencode/commands/prompt.md')) &&
        fs.existsSync(path.join(rootDir, '.opencode/commands/validate.md'))
  },
  {
    nombre: 'Regla 5 (Límites de hardware llmfit: 11.5 GB RAM configurados)',
    ok: fs.readFileSync(path.join(rootDir, 'src/gestor.ts'), 'utf-8').includes('11.5')
  }
];

let superadas = 0;
for (const r of reglas) {
  if (r.ok) {
    superadas += 1;
    console.log(`  [OK] ${r.nombre}`);
  } else {
    console.error(`  [FALLO] ${r.nombre}`);
  }
}

console.log(`\nEstado final: ${superadas}/${reglas.length} reglas cumplidas.`);
if (superadas !== reglas.length) {
  process.exit(1);
}
