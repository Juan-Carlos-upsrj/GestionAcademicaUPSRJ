import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../context/AppContext';
import { AppState } from '../types';

interface LegacyFound {
    folder: string;
    filename: string;
    path: string;
    lastModified: string; // serialized date
    stats: {
        groups: number;
        students: number;
        grades: number;
    }
}

interface DataRecoveryModalProps {
    onClose: () => void;
}

export const DataRecoveryModal: React.FC<DataRecoveryModalProps> = ({ onClose }) => {
    const { dispatch } = useContext(AppContext);
    const [legacyFiles, setLegacyFiles] = useState<LegacyFound[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const scan = async () => {
            try {
                if (window.electronAPI) {
                    const found = await window.electronAPI.invoke('data:scan-legacy');
                    setLegacyFiles(found);
                }
            } catch (err) {
                console.error("Failed to scan legacy data", err);
                setError("Error buscando datos antiguos.");
            } finally {
                setLoading(false);
            }
        };
        scan();
    }, []);

    const handleImport = async (filePath: string) => {
        if (!confirm("Esto reemplazará los datos actuales con la versión seleccionada. Se recomienda exportar un respaldo actual antes. ¿Continuar?")) return;

        setImporting(true);
        try {
            if (window.electronAPI) {
                const legacyData: Partial<AppState> = await window.electronAPI.invoke('data:import-legacy', filePath);

                // Dispatch SET_INITIAL_STATE with the Legacy Data directly.
                dispatch({ type: 'SET_INITIAL_STATE', payload: legacyData });
                alert("Datos importados correctamente. La aplicación se recargará.");

                // Force reload to ensure all states (like hooks) catch up properly
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Error al importar datos.");
            setImporting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    🔄 Recuperación Profunda de Datos
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    El sistema ha buscado en todas las carpetas de la aplicación (versiones actuales, previas y respaldos automáticos) para encontrar su información.
                </p>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                        <p>Analizando archivos del sistema...</p>
                    </div>
                ) : error ? (
                    <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>
                ) : legacyFiles.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-600 dark:text-gray-400">No se encontraron datos recuperables en este equipo.</p>
                        <p className="text-xs text-gray-400 mt-2">Intente buscar manualmente el archivo appData.json</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                            <span>Archivo Encontrado</span>
                            <span>Contenido</span>
                        </div>
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {legacyFiles.map((file, idx) => {
                                // Determine health/relevance color
                                const hasData = file.stats.students > 0;
                                const isBestCandidate = idx === 0 && hasData; // Assuming sorted by score

                                return (
                                    <li key={idx} className={`border rounded-xl p-4 flex justify-between items-center transition-all ${isBestCandidate
                                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                        }`}>
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-black text-sm truncate ${isBestCandidate ? 'text-indigo-700' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {file.folder}
                                                </span>
                                                {isBestCandidate && (
                                                    <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">Recomendado</span>
                                                )}
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                                    {file.filename}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-3">
                                                <span>📅 {new Date(file.lastModified).toLocaleDateString()} {new Date(file.lastModified).toLocaleTimeString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {file.stats.students} Alumnos
                                                </div>
                                                <div className={`text-[10px] font-black ${file.stats.grades > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {file.stats.grades} Califs.
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleImport(file.path)}
                                                disabled={importing}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isBestCandidate
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {importing ? '...' : 'Restaurar'}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
