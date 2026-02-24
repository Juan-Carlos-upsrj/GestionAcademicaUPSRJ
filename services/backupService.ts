import { AppState } from '../types';

export const exportBackup = (state: AppState, settings?: any) => {
    try {
        // We remove toasts from the backup as they are transient state
        const stateToSave = { ...state, toasts: [] };
        // If settings are provided, inject them into the export so they can be restored later
        if (settings) {
            (stateToSave as any).settings = settings;
        }
        const dataStr = JSON.stringify(stateToSave, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `gestion_academica_backup_${date}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export backup:", error);
        alert("Error al exportar los datos.");
    }
};

export const importBackup = (file: File): Promise<Partial<AppState>> => {
    return new Promise((resolve, reject) => {
        if (!file || file.type !== 'application/json') {
            return reject(new Error('Por favor, selecciona un archivo de respaldo JSON válido.'));
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result as string;
                const parsedData = JSON.parse(result);
                // Security Validation: Rigorously check structure to prevent malformed or malicious objects
                const hasObjectStructure = typeof parsedData === 'object' && parsedData !== null;
                const hasValidGroups = hasObjectStructure && 'groups' in parsedData && Array.isArray(parsedData.groups);

                if (hasValidGroups) {
                    resolve(parsedData);
                } else {
                    reject(new Error('El archivo de respaldo no tiene el formato esperado o fue adulterado. Verifique que sea válido.'));
                }
            } catch (error) {
                reject(new Error('Error al leer el archivo de respaldo. Asegúrate de que es un archivo JSON válido.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('No se pudo leer el archivo.'));
        };
        reader.readAsText(file);
    });
};
