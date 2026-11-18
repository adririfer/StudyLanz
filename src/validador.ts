import { TareaDAW, ApunteClase, PerfilHardware } from './types.js';

export class ValidadorStudyLanz {
  public static validarTarea(tarea: TareaDAW): boolean {
    if (!tarea.titulo || tarea.titulo.trim().length < 3) {
      throw new Error('Error de validación: El título de la tarea debe tener al menos 3 caracteres.');
    }
    if (!tarea.fechaLimite) {
      throw new Error('Error de validación: La tarea debe incluir una fecha límite válida.');
    }
    return true;
  }

  public static validarConsumoRamLocal(ramActualGb: number, ramModeloGb: number, perfil: PerfilHardware): boolean {
    if (ramActualGb + ramModeloGb > perfil.ramTotalGb) {
      throw new Error(
        `Error de hardware (llmfit): El modelo requiere +${ramModeloGb} GB y superaría los ${perfil.ramTotalGb} GB totales del equipo.`
      );
    }
    return true;
  }

  public static validarApunte(apunte: ApunteClase): boolean {
    if (apunte.resumenClave.length === 0) {
      throw new Error('Error de validación: El apunte debe incluir al menos un punto en el resumen clave.');
    }
    for (const p of apunte.preguntas) {
      if (p.indiceCorrecto < 0 || p.indiceCorrecto >= p.opciones.length) {
        throw new Error('Error de validación: El índice de respuesta correcta está fuera de rango.');
      }
    }
    return true;
  }
}
