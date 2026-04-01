import { useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { syncAttendanceData } from '../services/syncService';

// Intervalo de comprobación: 1 hora (3600000 ms)
const AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000;

export const useAutoSync = () => {
    const { state, dispatch } = useContext(AppContext);
    const { settings } = useSettings();
    const hasInitialSyncChecked = useRef(false);

    useEffect(() => {
        // Solo ejecuta si el usuario está configurado (tiene nombre)
        if (!settings.professorName || settings.professorName === 'Nombre del Profesor') {
            return;
        }

        const checkAndSync = () => {
            const lastSync = localStorage.getItem('lastAutoSyncTimestamp');
            const now = Date.now();

            // Si nunca ha sincronizado o pasaron > de AUTO_SYNC_INTERVAL_MS horas
            if (!lastSync || now - parseInt(lastSync, 10) > AUTO_SYNC_INTERVAL_MS) {
                // Realizar sync de manera silenciosa
                // Llamamos a syncAttendanceData que por dentro evalúa qué es lo que estáticamente falta por subir
                syncAttendanceData(state, dispatch, 'all', settings)
                    .then(() => {
                        localStorage.setItem('lastAutoSyncTimestamp', now.toString());
                        console.log('[AutoSync] Asistencias sincronizadas exitosamente en background.');
                    })
                    .catch(err => {
                        console.error('[AutoSync] Error al sincronizar en background:', err);
                    });
            }
        };

        // Comprobación al arrancar la app una sola vez
        if (!hasInitialSyncChecked.current) {
            checkAndSync();
            hasInitialSyncChecked.current = true;
        }

        // Configurar un intervalo activo
        const intervalId = setInterval(checkAndSync, AUTO_SYNC_INTERVAL_MS);

        return () => clearInterval(intervalId);

    }, [state.attendance, settings.professorName]); // Dependemos de las asistencias, cada que cambien o carguen se evalúa
};
