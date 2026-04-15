// services/horarioService.ts
import { SYSTEM_API_URL, SYSTEM_API_KEY } from '../constants';

/**
 * Esta es la función principal que usaremos.
 * Busca el horario completo de un profesor en la nueva API PHP e incluye los alumnos.
 */
export const fetchHorarioCompleto = async (profesorNombre: string, careerId: string = 'IAEV'): Promise<{ horario: any[], grupos: any[] }> => {
    
    const response = await fetch(SYSTEM_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'X-API-KEY': SYSTEM_API_KEY,
            'X-CARRERA': careerId 
        },
        body: JSON.stringify({ action: 'get-full-schedule', profesor_nombre: profesorNombre })
    });

    if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'success') {
        throw new Error(data.message || 'Error al obtener el horario');
    }

    // 4. "Traducir" el horario a datos limpios
    // data.data son las clases del docente
    // data.grupos son todos los grupos con sus alumnos
    const groupsMap = new Map(data.grupos.map((g: any) => [g.id, g]));

    const horarioCompleto = data.data.map((clase: any) => {
        const group = groupsMap.get(clase.grupo_id);
        return {
            id: clase.id,
            day: clase.dia,
            startTime: typeof clase.hora_inicio === 'string' ? parseInt(clase.hora_inicio) : clase.hora_inicio,
            duration: typeof clase.duracion === 'string' ? parseInt(clase.duracion) : clase.duracion,
            subjectName: clase.materia_nombre || "Materia Desconocida",
            groupName: clase.grupo_nombre || "Grupo Desconocido",
            students: (group as any) ? ((group as any).alumnos || []) : []
        };
    });

    return {
        horario: horarioCompleto,
        grupos: data.grupos
    };
};