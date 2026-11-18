import { TareaDAW, ApunteClase, PerfilHardware } from './types.js';

export const PERFIL_LLMFIT: PerfilHardware = {
  cpu: 'Intel Core i5-1135G7 @ 2.40GHz (8 hilos)',
  ramTotalGb: 11.5,
  ramDisponibleGb: 4.8,
  gpu: 'Intel Iris Xe Graphics (Memoria compartida)',
  limiteLocal: 'Modelos 1.5B - 3B en local (Ollama) / Modelos > 7B en Cloud (OpenRouter / Gemini)'
};

export const TAREAS_INICIALES: TareaDAW[] = [
  {
    id: 'T-01',
    asignatura: 'IA',
    titulo: 'Actividad Resumen: Ecosistema OpenCode, Ollama y Gemini',
    fechaLimite: '2026-11-18',
    prioridad: 'alta',
    estado: 'pendiente'
  },
  {
    id: 'T-02',
    asignatura: 'Despliegue',
    titulo: 'Práctica Docker: Volúmenes persistentes y Bind Mounts',
    fechaLimite: '2026-11-20',
    prioridad: 'media',
    estado: 'completada'
  },
  {
    id: 'T-03',
    asignatura: 'DWES',
    titulo: 'CRUD de tienda online con sesiones y PDO en PHP',
    fechaLimite: '2026-11-24',
    prioridad: 'alta',
    estado: 'pendiente'
  },
  {
    id: 'T-04',
    asignatura: 'DIW',
    titulo: 'Diseño de Design System y librería de componentes en Figma',
    fechaLimite: '2026-11-26',
    prioridad: 'media',
    estado: 'pendiente'
  }
];

export const APUNTES_EJEMPLO: ApunteClase[] = [
  {
    id: 'AP-01',
    asignatura: 'IA',
    titulo: 'OpenCode: Memoria (agents.md), Comandos y Proveedores',
    contenido: 'La ventana de contexto es el límite de tokens que la IA procesa en una sesión. Como los modelos no tienen memoria infinita, usamos el comando /init para generar agents.md, que actúa como fuente de verdad del repositorio. Los comandos personalizados se guardan en .opencode/commands/ como archivos Markdown reutilizables. Con llmfit medimos nuestra RAM (11.5 GB) para usar modelos ligeros en Ollama local y modelos grandes en Gemini o OpenRouter.',
    resumenClave: [
      'agents.md es la memoria persistente y fuente de verdad del proyecto en OpenCode (creado con /init).',
      'Los comandos personalizados (.opencode/commands/*.md) estandarizan prompts repetitivos.',
      'opencode.json centraliza la conexión con Ollama (local), OpenRouter y Google Gemini.',
      'llmfit permite elegir qué modelos correr en local (1.5B-3B) sin saturar los 11.5 GB de RAM.'
    ],
    preguntas: [
      {
        enunciado: '¿Qué archivo actúa como memoria principal y fuente de verdad del repositorio en OpenCode?',
        opciones: ['package.json', 'agents.md', 'tsconfig.json'],
        indiceCorrecto: 1,
        explicacion: 'Según la documentación de clase, agents.md almacena las reglas y el contexto permanente del proyecto.'
      },
      {
        enunciado: '¿Dónde se guardan los comandos personalizados a nivel de proyecto en OpenCode?',
        opciones: ['En la carpeta .opencode/commands/', 'En /etc/opencode/', 'Dentro de node_modules/'],
        indiceCorrecto: 0,
        explicacion: 'Los comandos de proyecto se definen como archivos Markdown dentro de .opencode/commands/<nombre>.md.'
      },
      {
        enunciado: 'Según el análisis de llmfit (11.5 GB RAM), ¿cuándo conviene usar Ollama en local frente a Gemini?',
        opciones: [
          'Para modelos gigantes de 70B de parámetros',
          'Para modelos ligeros (1.5B-3B) cuando queremos coste 0 de tokens o trabajar sin conexión',
          'Nunca, siempre requiere internet'
        ],
        indiceCorrecto: 1,
        explicacion: 'Ollama ejecuta modelos ligeros localmente sin gastar tokens ni depender de red, respetando la RAM disponible.'
      }
    ]
  }
];
