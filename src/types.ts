export type AsignaturaDAW = 'IA' | 'Despliegue' | 'DWES' | 'DWEC' | 'DIW';

export type EstadoEntrega = 'pendiente' | 'completada';

export type ProveedorIA = 'ollama' | 'openrouter' | 'google';

export interface TareaDAW {
  id: string;
  asignatura: AsignaturaDAW;
  titulo: string;
  fechaLimite: string;
  prioridad: 'alta' | 'media' | 'baja';
  estado: EstadoEntrega;
}

export interface PreguntaTest {
  enunciado: string;
  opciones: string[];
  indiceCorrecto: number;
  explicacion: string;
}

export interface ApunteClase {
  id: string;
  asignatura: AsignaturaDAW;
  titulo: string;
  contenido: string;
  resumenClave: string[];
  preguntas: PreguntaTest[];
}

export interface PerfilHardware {
  cpu: string;
  ramTotalGb: number;
  ramDisponibleGb: number;
  gpu: string;
  limiteLocal: string;
}
