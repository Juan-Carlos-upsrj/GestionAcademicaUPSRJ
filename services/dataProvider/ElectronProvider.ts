import { IDataProvider } from './IDataProvider';
import { AppState } from '../../types';

export class ElectronProvider implements IDataProvider {
    async save(state: AppState): Promise<void> {
        if (window.electronAPI) {
            try {
                // Remove ephemeral state (toasts)
                const stateToSave = { ...state, toasts: [] };
                await window.electronAPI.saveData(stateToSave);
            } catch (error) {
                console.error('ElectronProvider: Failed to save state', error);
            }
        }
    }

    async load(): Promise<AppState | null> {
        if (window.electronAPI) {
            try {
                const data = await window.electronAPI.getData();
                return (data as AppState) || null;
            } catch (error) {
                console.error('ElectronProvider: Failed to load state', error);
                return null;
            }
        }
        return null;
    }
}
