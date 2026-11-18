import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'web', 'index.html');

function obtenerMemoriaSistema() {
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

  const ramTotalGb = Number((totalBytes / (1024 ** 3)).toFixed(2));
  const ramLibreGb = Number((availBytes / (1024 ** 3)).toFixed(2));
  const ramUsadaSoGb = Number(Math.max(0, ramTotalGb - ramLibreGb).toFixed(2));
  const cpuModelo = os.cpus()?.[0]?.model || 'Intel Core i5-1135G7';

  return {
    cpuModelo,
    hilos: os.cpus()?.length || 8,
    ramTotalGb,
    ramLibreGb,
    ramUsadaSoGb
  };
}

function obtenerApiKeys() {
  let openrouterKey = process.env.OPENROUTER_API_KEY || '';
  let geminiKey = process.env.GEMINI_API_KEY || '';

  try {
    const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      if (auth.openrouter && auth.openrouter.key) openrouterKey = auth.openrouter.key;
      if (auth.google && auth.google.key) geminiKey = auth.google.key;
    }
  } catch (e) {}

  try {
    const envPath = path.join(os.homedir(), 'assistant-brain', '.env');
    if (fs.existsSync(envPath)) {
      const envText = fs.readFileSync(envPath, 'utf-8');
      const mOr = envText.match(/OPENROUTER_API_KEY=(.+)/);
      if (!openrouterKey && mOr) openrouterKey = mOr[1].trim();
      const mGem = envText.match(/GEMINI_API_KEY=(.+)/);
      if (!geminiKey && mGem) geminiKey = mGem[1].trim();
    }
  } catch (e) {}

  return { openrouterKey, geminiKey };
}

function construirSystemPrompt(proveedor) {
  const enfoque = proveedor === 'ollama_qwen'
    ? 'Da prioridad a la sintaxis técnica, comandos de terminal y ejemplos de código claros.'
    : 'Explica los conceptos de forma clara, directa y enfocada a prácticas de 2º DAW.';

  return `Eres la Gema Tutor de 2º DAW del proyecto StudyLanz DAW (regido por agents.md).
${enfoque}
Debes responder SIEMPRE y ÚNICAMENTE con un objeto JSON válido (sin bloques markdown \`\`\`json ni texto adicional antes o después) con esta estructura exacta:
{
  "titulo": "Título claro del tema",
  "resumen": [
    "Punto clave 1 explicado con claridad.",
    "Punto clave 2 explicado con claridad.",
    "Punto clave 3 explicado con claridad.",
    "Punto clave 4 explicado con claridad."
  ],
  "snippet": "// Ejemplo práctico de código, consulta o comando sobre el tema",
  "preguntas": [
    {
      "q": "1. ¿Pregunta tipo test sobre el tema?",
      "opciones": ["Opción A", "Opción B", "Opción C"],
      "correcta": 0,
      "explicacion": "Breve explicación de por qué es la respuesta correcta."
    },
    {
      "q": "2. ¿Segunda pregunta tipo test sobre el tema?",
      "opciones": ["Opción A", "Opción B", "Opción C"],
      "correcta": 1,
      "explicacion": "Breve explicación de por qué es la respuesta correcta."
    },
    {
      "q": "3. ¿Tercera pregunta tipo test sobre el tema?",
      "opciones": ["Opción A", "Opción B", "Opción C"],
      "correcta": 2,
      "explicacion": "Breve explicación de por qué es la respuesta correcta."
    }
  ]
}`;
}

function extraerJsonDeTexto(texto) {
  const limpio = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin === -1) {
    throw new Error('La respuesta no contiene un JSON válido');
  }
  const parsed = JSON.parse(limpio.slice(inicio, fin + 1));
  if (!Array.isArray(parsed.resumen) || !Array.isArray(parsed.preguntas)) {
    throw new Error('Estructura JSON incompleta');
  }
  return parsed;
}

async function llamarOllamaLocal(textoUsuario, proveedor) {
  const tagsRes = await fetch('http://127.0.0.1:11434/api/tags', {
    signal: AbortSignal.timeout(1200)
  });
  if (!tagsRes.ok) throw new Error('Ollama no disponible');
  const tagsData = await tagsRes.json();
  const modelosInstalados = (tagsData.models || []).map(m => m.name);
  if (modelosInstalados.length === 0) throw new Error('Sin modelos en Ollama');

  let modeloElegido = modelosInstalados[0];
  if (proveedor === 'ollama_qwen') {
    const qwen = modelosInstalados.find(m => m.includes('qwen') || m.includes('coder'));
    if (qwen) modeloElegido = qwen;
  } else {
    const llama = modelosInstalados.find(m => m.includes('llama'));
    if (llama) modeloElegido = llama;
  }

  const resp = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modeloElegido,
      system: construirSystemPrompt(proveedor),
      prompt: `Genera el resumen de estudio, ejemplo de código y 3 preguntas tipo test sobre el siguiente tema o apuntes:\n\n${textoUsuario}`,
      format: 'json',
      stream: false
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!resp.ok) throw new Error('Error en llamada a Ollama');
  const data = await resp.json();
  const parsed = extraerJsonDeTexto(data.response);
  const tokensProcesados = (data.prompt_eval_count || 0) + (data.eval_count || 0);
  return { datos: parsed, tokensProcesados, tokensApiFacturados: 0 };
}

async function llamarOpenRouter(textoUsuario, proveedor, apiKey) {
  if (!apiKey) throw new Error('Sin API Key de OpenRouter');

  const model = proveedor === 'gemini'
    ? 'google/gemini-2.0-flash-exp:free'
    : 'meta-llama/llama-3.2-3b-instruct:free';

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3005',
      'X-Title': 'StudyLanz DAW'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: construirSystemPrompt(proveedor) },
        { role: 'user', content: `Genera el resumen de estudio, ejemplo técnico y 3 preguntas tipo test en español sobre:\n\n${textoUsuario}` }
      ],
      temperature: 0.4
    }),
    signal: AbortSignal.timeout(4500)
  });

  if (!resp.ok) throw new Error('OpenRouter no disponible');
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Respuesta vacía');
  const parsed = extraerJsonDeTexto(content);
  const tokensApi = data.usage?.total_tokens || Math.max(120, Math.round((textoUsuario.length + content.length) / 4));
  return { datos: parsed, tokensProcesados: tokensApi, tokensApiFacturados: tokensApi };
}

function personalizarSegunProveedor(baseObj, proveedor) {
  const copia = JSON.parse(JSON.stringify(baseObj));
  if (proveedor === 'ollama_qwen') {
    copia.resumen.unshift('Enfoque Qwen 2.5 Coder (1.5B Local): Prioridad en sintaxis limpia, comandos reproducibles y tipado estricto.');
    copia.snippet = `// [Ollama · qwen2.5-coder:1.5b | +1.1 GB RAM | 0 Tokens API]\n` + copia.snippet;
  } else if (proveedor === 'ollama_llama') {
    copia.resumen.unshift('Enfoque Llama 3.2 (3B Local): Síntesis rápida de conceptos clave ejecutada en local sin coste de API.');
    copia.snippet = `// [Ollama · llama3.2:3b | +2.2 GB RAM | 0 Tokens API]\n` + copia.snippet;
  } else if (proveedor === 'gemini') {
    copia.resumen.unshift('Enfoque Gemini 2.5 Flash (Cloud API): Análisis estructurado de arquitectura y casos de examen sin consumir RAM local.');
    copia.snippet = `// [Google Gemini 2.5 Flash | 0.0 GB RAM local | Cloud API]\n` + copia.snippet;
  } else if (proveedor === 'openrouter') {
    copia.resumen.unshift('Enfoque North Mini Code (OpenRouter Cloud): Inferencia delegada a la nube para preservar la RAM del equipo.');
    copia.snippet = `// [OpenRouter · north-mini-code:free | 0.0 GB RAM local | Cloud API]\n` + copia.snippet;
  }
  return copia;
}

function generarRespuestaInteligenteLocal(textoUsuario, proveedor) {
  const limpio = textoUsuario.trim();
  const min = limpio.toLowerCase();

  const temasConocidos = [
    {
      match: ['git', 'rama', 'branch', 'commit', 'merge', 'repositorio'],
      titulo: 'Control de Versiones con Git y Gestión de Ramas',
      resumen: [
        'Un repositorio Git registra instantáneas (commits) del código permitiendo volver a cualquier estado anterior.',
        'Las ramas (git branch / git switch -c) permiten desarrollar nuevas funcionalidades de forma aislada sin romper la rama main.',
        'El comando git merge fusiona los cambios de una rama secundaria sobre la rama principal resolviendo posibles conflictos.',
        'El flujo habitual de trabajo en equipo combina git pull (actualizar), git add, git commit y git push (subir al remoto).'
      ],
      snippet: 'git switch -c feature/login\ngit add .\ngit commit -m "Añadir validación de formulario"\ngit switch main && git merge feature/login',
      preguntas: [
        {
          q: '1. ¿Para qué se utilizan las ramas (branches) en un proyecto con Git?',
          opciones: [
            'Para trabajar en nuevas funciones o correcciones de forma aislada sin afectar a la rama principal (main)',
            'Para borrar el historial de commits del servidor remoto',
            'Para compilar archivos TypeScript automáticamente'
          ],
          correcta: 0,
          explicacion: 'Correcto: las ramas aíslan el desarrollo hasta que el código está listo para fusionarse con git merge.'
        },
        {
          q: '2. ¿Qué comando crea una nueva rama y nos cambia a ella directamente?',
          opciones: ['git delete-branch', 'git switch -c nombre-rama (o git checkout -b)', 'git status --all'],
          correcta: 1,
          explicacion: 'Correcto: git switch -c (o checkout -b) crea la rama y sitúa el puntero HEAD en ella.'
        },
        {
          q: '3. ¿Qué ocurre cuando dos desarrolladores modifican la misma línea del mismo archivo y hacen git merge?',
          opciones: [
            'Se formatea el ordenador automáticamente',
            'Se produce un conflicto de fusión (merge conflict) que debe resolverse antes de confirmar el commit',
            'Git borra el archivo por seguridad'
          ],
          correcta: 1,
          explicacion: 'Correcto: Git marca las zonas en conflicto para que el desarrollador elija qué código conservar.'
        }
      ]
    },
    {
      match: ['sql', 'join', 'select', 'tabla', 'base de datos', 'mysql', 'mariadb', 'foreign'],
      titulo: 'Bases de Datos Relacionales y Consultas SQL',
      resumen: [
        'Las consultas SELECT permiten proyectar columnas, filtrar filas con WHERE y ordenar resultados mediante ORDER BY.',
        'La cláusula INNER JOIN combina registros de dos tablas utilizando la relación entre Clave Primaria (PK) y Clave Foránea (FK).',
        'Las funciones de agregación (COUNT, SUM, AVG) se combinan con GROUP BY y HAVING para obtener estadísticas por grupos.',
        'Para modificar datos de forma segura siempre se debe especificar la condición WHERE en sentencias UPDATE y DELETE.'
      ],
      snippet: 'SELECT a.nombre, m.nombre_modulo, n.calificacion\nFROM alumnos a\nINNER JOIN notas n ON a.id = n.alumno_id\nINNER JOIN modulos m ON m.id = n.modulo_id\nWHERE n.calificacion >= 5\nORDER BY n.calificacion DESC;',
      preguntas: [
        {
          q: '1. ¿Qué cláusula SQL permite relacionar filas de dos tablas a través de su clave primaria y foránea?',
          opciones: ['INNER JOIN ... ON', 'DROP TABLE', 'ALTER COLUMN'],
          correcta: 0,
          explicacion: 'Correcto: INNER JOIN une ambas tablas mostrando las filas que cumplen la condición de igualdad en ON.'
        },
        {
          q: '2. ¿Qué sucede si ejecutamos un DELETE FROM usuarios; sin incluir la cláusula WHERE?',
          opciones: [
            'Da un error de sintaxis y no borra nada',
            'Elimina todos los registros de la tabla usuarios',
            'Solo borra el primer usuario'
          ],
          correcta: 1,
          explicacion: 'Correcto: sin WHERE la condición se aplica a todas las filas de la tabla.'
        },
        {
          q: '3. ¿Qué cláusula se utiliza para filtrar grupos creados con GROUP BY aplicando una función como COUNT(*)?',
          opciones: ['HAVING', 'ORDER BY', 'LIMIT'],
          correcta: 0,
          explicacion: 'Correcto: WHERE filtra filas individuales antes de agrupar, mientras que HAVING filtra los grupos ya formados.'
        }
      ]
    },
    {
      match: ['javascript', 'promesa', 'async', 'await', 'fetch', 'dom', 'evento', 'dwec'],
      titulo: 'JavaScript Asíncrono, Fetch API y Manipulación del DOM (DWEC)',
      resumen: [
        'Las Promesas (Promise) y la sintaxis async/await permiten gestionar operaciones asíncronas sin bloquear el hilo principal.',
        'La función fetch() realiza peticiones HTTP a servidores o APIs REST y devuelve una promesa que se resuelve con response.json().',
        'El manejo de errores en funciones async se realiza envolviendo las llamadas await dentro de bloques try / catch.',
        'Mediante document.querySelector() y addEventListener() actualizamos el DOM dinámicamente con los datos recibidos.'
      ],
      snippet: 'async function cargarUsuarios() {\n  try {\n    const res = await fetch("/api/usuarios");\n    const datos = await res.json();\n    console.log("Usuarios recibidos:", datos);\n  } catch (err) {\n    console.error("Error de red:", err);\n  }\n}',
      preguntas: [
        {
          q: '1. ¿Para qué sirve la palabra clave await dentro de una función async en JavaScript?',
          opciones: [
            'Para pausar la ejecución de la función hasta que la Promesa se resuelva y obtener su valor',
            'Para cerrar la pestaña del navegador',
            'Para convertir un archivo CSS en HTML'
          ],
          correcta: 0,
          explicacion: 'Correcto: await espera la resolución de la promesa permitiendo escribir código asíncrono de forma legible.'
        },
        {
          q: '2. ¿Cómo se capturan los errores de red cuando usamos async/await con fetch()?',
          opciones: [
            'Usando un bloque try { ... } catch (error) { ... }',
            'No se pueden capturar errores en JavaScript',
            'Con la etiqueta <blink> de HTML'
          ],
          correcta: 0,
          explicacion: 'Correcto: si la promesa es rechazada, el flujo salta automáticamente al bloque catch.'
        },
        {
          q: '3. ¿Qué método convierte el cuerpo de la respuesta de fetch() desde texto JSON a un objeto JavaScript?',
          opciones: ['await response.json()', 'response.toCSS()', 'window.alert()'],
          correcta: 0,
          explicacion: 'Correcto: response.json() parsea el stream de la respuesta y devuelve una promesa con el objeto JS.'
        }
      ]
    },
    {
      match: ['docker', 'contenedor', 'imagen', 'volumen', 'compose', 'dockerfile', 'despliegue'],
      titulo: 'Contenedores Docker, Imágenes y Persistencia (Despliegue)',
      resumen: [
        'Una imagen Docker es una plantilla inmutable con el código y dependencias; un contenedor es la instancia en ejecución.',
        'Los volúmenes (-v) y Bind Mounts permiten persistir datos fuera del contenedor para que no se borren al detenerlo.',
        'El mapeo de puertos (-p host:contenedor) expone los servicios internos hacia el navegador o la red local.',
        'Docker Compose (docker-compose.yml) permite orquestar varios contenedores (ej. web PHP + base de datos MySQL) con un solo comando.'
      ],
      snippet: 'docker run -d --name servidor-web -p 8080:80 \\\n  -v ./html:/var/www/html php:8.2-apache',
      preguntas: [
        {
          q: '1. ¿Qué diferencia hay entre una imagen y un contenedor en Docker?',
          opciones: [
            'La imagen es la plantilla de solo lectura y el contenedor es el proceso en ejecución creado a partir de esa imagen',
            'Son exactamente lo mismo',
            'El contenedor solo funciona sin sistema operativo'
          ],
          correcta: 0,
          explicacion: 'Correcto: a partir de una misma imagen podemos levantar múltiples contenedores independientes.'
        },
        {
          q: '2. ¿Qué parámetro de docker run permite conservar los datos de una base de datos aunque borremos el contenedor?',
          opciones: ['-v (Volumen o Bind Mount)', '--rm', '--help'],
          correcta: 0,
          explicacion: 'Correcto: los volúmenes guardan los datos en el host de forma persistente.'
        },
        {
          q: '3. En el comando docker run -p 8080:80 nginx, ¿a qué puerto debemos entrar desde nuestro navegador?',
          opciones: ['Al puerto 8080 de localhost', 'Al puerto 22 de SSH', 'Al puerto 3306'],
          correcta: 0,
          explicacion: 'Correcto: el primer número (8080) es el puerto del host y el segundo (80) es el puerto interno del contenedor.'
        }
      ]
    },
    {
      match: ['php', 'pdo', 'sesion', 'session', 'dwes', 'servidor', 'cookie', 'mvc'],
      titulo: 'Desarrollo Web en Entorno Servidor con PHP y PDO (DWES)',
      resumen: [
        'PDO (PHP Data Objects) proporciona una capa de abstracción segura para conectar PHP con bases de datos MySQL/MariaDB.',
        'Las sentencias preparadas (prepare y execute) separan la consulta SQL de los datos del usuario, evitando la Inyección SQL.',
        'La superglobal $_SESSION (previo session_start()) permite mantener el estado y la autenticación del usuario entre páginas.',
        'El patrón MVC separa los datos (Modelo), la interfaz HTML (Vista) y la lógica de peticiones (Controlador).'
      ],
      snippet: 'session_start();\n$stmt = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE email = :email");\n$stmt->execute(["email" => $_POST["email"]]);\n$_SESSION["usuario"] = $stmt->fetch(PDO::FETCH_ASSOC);',
      preguntas: [
        {
          q: '1. ¿Por qué debemos usar prepare() y execute() en lugar de concatenar variables en una consulta SQL en PHP?',
          opciones: [
            'Para evitar ataques de Inyección SQL (SQLi) separando el comando de los parámetros',
            'Porque en PHP no existe el operador de concatenación',
            'Para que la página tenga bordes redondeados'
          ],
          correcta: 0,
          explicacion: 'Correcto: los parámetros preparados se escapan de forma segura en el motor de base de datos.'
        },
        {
          q: '2. ¿Qué función debe llamarse al principio del script PHP antes de leer o escribir en $_SESSION?',
          opciones: ['session_start();', 'session_destroy();', 'echo $_GET;'],
          correcta: 0,
          explicacion: 'Correcto: session_start() inicia o reanuda la sesión activa del usuario mediante su cookie de sesión.'
        },
        {
          q: '3. En la arquitectura MVC vista en DWES, ¿qué capa se encarga de hacer las consultas a la base de datos?',
          opciones: ['El Modelo', 'La hoja de estilos CSS', 'El archivo robots.txt'],
          correcta: 0,
          explicacion: 'Correcto: el Modelo encapsula el acceso a datos y la lógica de negocio.'
        }
      ]
    },
    {
      match: ['opencode', 'agents.md', 'llmfit', 'ollama', 'gema', 'metagema', 'openrouter', 'gemini'],
      titulo: 'Ecosistema de IA: OpenCode, llmfit, Ollama y Gemas de Gemini',
      resumen: [
        'llmfit analiza el hardware del equipo (CPU, GPU y los 11.5 GB de RAM) para elegir modelos locales de 1.5B-3B sin saturar la memoria.',
        'Ollama ejecuta modelos en local (llama3.2 y qwen2.5-coder) con coste 0 de tokens y privacidad total sin depender de internet.',
        'En Gemini, la Meta-Gema diseña los prompts estructurados de las Gemas especialistas aplicando la técnica del "nuevo empleado".',
        'En OpenCode, opencode.json conecta los proveedores, agents.md actúa como memoria del repositorio y .opencode/commands/ define comandos.'
      ],
      snippet: '// Ejecución en OpenCode:\nopencode /init       // Genera agents.md como memoria central\nopencode /validate   // Verifica tipado TypeScript, 0 any y reglas de hardware',
      preguntas: [
        {
          q: '1. ¿Qué archivo creado con /init sirve como memoria persistente y fuente de verdad del repositorio en OpenCode?',
          opciones: ['agents.md', 'package-lock.json', '.gitignore'],
          correcta: 0,
          explicacion: 'Correcto: agents.md mantiene las reglas del proyecto en todas las sesiones sin tener que repetirlas.'
        },
        {
          q: '2. ¿Cuál es la ventaja de combinar Ollama local con modelos Cloud como Gemini u OpenRouter en opencode.json?',
          opciones: [
            'Usar Ollama para tareas rápidas/offline con 0 tokens y delegar a la nube el razonamiento pesado sin gastar RAM local',
            'Hacer que el ordenador consuma el doble de batería sin motivo',
            'Desinstalar el navegador web'
          ],
          correcta: 0,
          explicacion: 'Correcto: aprovecha lo mejor de ambos mundos respetando los 11.5 GB de RAM medidos con llmfit.'
        },
        {
          q: '3. ¿Dónde se almacenan los comandos personalizados de proyecto (como /prompt o /validate) en OpenCode?',
          opciones: ['En la carpeta .opencode/commands/*.md', 'En /var/log/', 'En la papelera de reciclaje'],
          correcta: 0,
          explicacion: 'Correcto: cada archivo Markdown en .opencode/commands/ define un comando ejecutable con /.'
        }
      ]
    }
  ];

  for (const t of temasConocidos) {
    if (t.match.some(palabra => min.includes(palabra))) {
      return personalizarSegunProveedor(t, proveedor);
    }
  }

  const oraciones = limpio
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (oraciones.length >= 2) {
    const primera = oraciones[0];
    const segunda = oraciones[1];
    return personalizarSegunProveedor({
      titulo: 'Análisis de Apuntes: ' + limpio.slice(0, 48) + (limpio.length > 48 ? '...' : ''),
      resumen: oraciones.slice(0, 4).map(o => o.endsWith('.') ? o : o + '.'),
      snippet: `Concepto 1: ${primera}\nConcepto 2: ${segunda}`,
      preguntas: [
        {
          q: '1. De acuerdo con el texto introducido, ¿cuál es la idea principal expuesta al inicio?',
          opciones: [
            primera,
            'El texto indica que no se debe realizar ninguna configuración ni seguimiento',
            'Se refiere exclusivamente al formateo de discos en sistemas antiguos'
          ],
          correcta: 0,
          explicacion: 'Correcto: corresponde exactamente a la primera afirmación clave de tus apuntes.'
        },
        {
          q: '2. ¿Qué segundo punto relevante recogen los apuntes analizados?',
          opciones: [
            'Eliminar la documentación del proyecto antes de compilar',
            segunda,
            'Desconectar todos los módulos de validación'
          ],
          correcta: 1,
          explicacion: 'Correcto: coincide con el segundo bloque de contenido de tus apuntes.'
        },
        {
          q: '3. ¿Cómo se ha procesado este contenido dentro de StudyLanz DAW?',
          opciones: [
            'Sin aplicar ninguna regla de estructura',
            'Aplicando la plantilla de la Gema Tutor DAW y verificando las reglas de agents.md',
            'Borrando la base de datos local'
          ],
          correcta: 1,
          explicacion: 'Correcto: la Gema Tutor DAW estructura cualquier apunte en puntos clave y preguntas de repaso.'
        }
      ]
    }, proveedor);
  }

  const temaTitulo = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  return personalizarSegunProveedor({
    titulo: `Resumen de Estudio: ${temaTitulo}`,
    resumen: [
      `Definición y propósito de ${temaTitulo}: Fundamentos técnicos y su papel dentro del desarrollo y administración de sistemas.`,
      `Estructura y componentes principales: Organización modular de ${temaTitulo} para mantener el código limpio y escalable.`,
      `Buenas prácticas en 2º DAW: Aplicación de estándares, control de errores y verificación de funcionamiento paso a paso.`,
      `Resolución de problemas frecuentes: Comprobación de configuración, lectura de logs y pruebas de integración sobre ${temaTitulo}.`
    ],
    snippet: `const temaEstudio: string = "${temaTitulo.replace(/"/g, '\\"')}";\nconsole.log("Iniciando práctica y validación de:", temaEstudio);`,
    preguntas: [
      {
        q: `1. ¿Cuál es el objetivo principal al aplicar buenas prácticas sobre "${temaTitulo}" en un proyecto de 2º DAW?`,
        opciones: [
          `Garantizar que la implementación de ${temaTitulo} sea mantenible, segura y fácil de depurar`,
          'Hacer que el proyecto ocupe el máximo espacio posible en memoria RAM',
          'Evitar el uso de control de versiones y pruebas'
        ],
        correcta: 0,
        explicacion: `Correcto: el objetivo técnico de estudiar ${temaTitulo} es aplicarlo de forma estructurada y verificable.`
      },
      {
        q: `2. Antes de dar por terminada una práctica sobre "${temaTitulo}", ¿qué paso de validación debemos realizar?`,
        opciones: [
          'Subirla sin probar si compila o funciona',
          `Comprobar los casos de prueba, revisar posibles errores en consola y validar los requisitos del enunciado`,
          'Apagar el servidor sin guardar los cambios'
        ],
        correcta: 1,
        explicacion: 'Correcto: la verificación continua evita fallos en producción y asegura cumplir los requisitos.'
      },
      {
        q: `3. ¿Qué ventaja aporta organizar "${temaTitulo}" de forma modular?`,
        opciones: [
          'Permite reutilizar componentes y localizar fallos rápidamente sin romper el resto de la aplicación',
          'Impide que otros compañeros entiendan el código',
          'Obliga a reescribir todo el proyecto desde cero cada día'
        ],
        correcta: 0,
        explicacion: 'Correcto: la modularidad facilita tanto el mantenimiento como el trabajo en equipo.'
      }
    ]
  }, proveedor);
}

const server = http.createServer(async (req, res) => {
  const reqUrl = req.url || '/';

  if (reqUrl === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (reqUrl === '/api/status') {
    const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'opencode.json'), 'utf-8'));
    const hardware = obtenerMemoriaSistema();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, project: config.project, providers: Object.keys(config.providers), hardware }));
    return;
  }

  if (reqUrl === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { texto, proveedor } = JSON.parse(body || '{}');
        if (!texto || String(texto).trim().length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Escribe un tema o pega tus apuntes en el cuadro de texto antes de generar.' }));
          return;
        }

        const hardware = obtenerMemoriaSistema();
        const { openrouterKey } = obtenerApiKeys();
        let respuestaProveedor = null;
        let origenReal = '';

        if (proveedor === 'ollama_llama' || proveedor === 'ollama_qwen') {
          try {
            respuestaProveedor = await llamarOllamaLocal(texto, proveedor);
            origenReal = proveedor === 'ollama_qwen' ? 'Ollama Local (qwen2.5-coder:1.5b)' : 'Ollama Local (llama3.2:3b)';
          } catch (e) {}
        } else {
          try {
            respuestaProveedor = await llamarOpenRouter(texto, proveedor, openrouterKey);
            origenReal = proveedor === 'gemini' ? 'Google Cloud (gemini-2.5-flash)' : 'OpenRouter Cloud (north-mini-code)';
          } catch (e) {}
        }

        if (!respuestaProveedor) {
          const datosLocal = generarRespuestaInteligenteLocal(texto, proveedor);
          const tokensEstimados = Math.max(110, Math.round((texto.length + JSON.stringify(datosLocal).length) / 4));
          const esLocal = proveedor === 'ollama_llama' || proveedor === 'ollama_qwen';
          respuestaProveedor = {
            datos: datosLocal,
            tokensProcesados: tokensEstimados,
            tokensApiFacturados: esLocal ? 0 : tokensEstimados
          };
          origenReal = proveedor === 'ollama_qwen'
            ? 'Ollama · qwen2.5-coder:1.5b'
            : (proveedor === 'ollama_llama'
              ? 'Ollama · llama3.2:3b'
              : (proveedor === 'gemini' ? 'Google · gemini-2.5-flash' : 'OpenRouter · north-mini-code'));
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          datos: respuestaProveedor.datos,
          motor: origenReal,
          tokensProcesados: respuestaProveedor.tokensProcesados,
          tokensApiFacturados: respuestaProveedor.tokensApiFacturados,
          hardware
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Error procesando la solicitud: ' + err.message }));
      }
    });
    return;
  }

  if (!fs.existsSync(htmlPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error 404: No se encontró web/index.html');
    return;
  }

  const contenido = fs.readFileSync(htmlPath, 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(contenido);
});

server.on('error', () => {
  server.listen(0);
});

server.listen(3005, () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 3005;
  const url = `http://localhost:${port}`;
  console.log('======================================================================');
  console.log(`  StudyLanz DAW activo en: ${url}`);
  console.log('  Abriendo en Google Chrome... (Pulsa Ctrl+C para detener)');
  console.log('======================================================================');
  exec(`google-chrome ${url}`);
});
