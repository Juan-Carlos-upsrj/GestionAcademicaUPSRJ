import { Group, Settings, Student } from '../types';
import { GAMES_API_URL, GAMES_API_KEY } from '../constants';

export interface GamesPointsResult {
    studentId: string;
    studentName: string;
    pointsTotal: number;
    extraCalculated: number;
}

const normalizeForMatch = (s: string) =>
    (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();

export const syncGamesPointsForGroup = async (
    _settings: Settings,
    group: Group,
    students: Student[]
): Promise<GamesPointsResult[]> => {
    if (!GAMES_API_URL || !GAMES_API_KEY) {
        throw new Error('Falta GAMES_API_URL o GAMES_API_KEY');
    }

    const materiaGrupoId = Number.parseInt(group.id, 10);
    const hasMateriaId = Number.isFinite(materiaGrupoId);
    const endpoint = GAMES_API_URL.replace(/\/$/, '') + '/points/apply';

    const out: GamesPointsResult[] = [];
    for (const st of students) {
        const body: Record<string, unknown> = { query: st.name };
        if (hasMateriaId) {
            body.materia_grupo_id = materiaGrupoId;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': GAMES_API_KEY
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            continue;
        }
        const data = await res.json();
        const returnedName = String(data.alumno_nombre || '');
        if (
            normalizeForMatch(returnedName) !== normalizeForMatch(st.name) &&
            !normalizeForMatch(returnedName).includes(normalizeForMatch(st.name))
        ) {
            continue;
        }
        out.push({
            studentId: st.id,
            studentName: st.name,
            pointsTotal: Number(data.puntos_totales || 0),
            extraCalculated: Number(data.extra_calculada || 0)
        });
    }

    return out;
};
