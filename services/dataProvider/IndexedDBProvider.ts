import { IDataProvider } from './IDataProvider';
import { AppState } from '../../types';
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'gestion-academica-db';
const STORE_NAME = 'app-state-store';
const VERSION = 1;

export class IndexedDBProvider implements IDataProvider {
    private dbPromise: Promise<IDBPDatabase> | null = null;

    private getDB(): Promise<IDBPDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = openDB(DB_NAME, VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME);
                    }
                },
            });
        }
        return this.dbPromise;
    }

    async save(state: AppState): Promise<void> {
        try {
            const db = await this.getDB();
            // Remove ephemeral state (toasts)
            const stateToSave = { ...state, toasts: [] };
            await db.put(STORE_NAME, stateToSave, 'full-state');
        } catch (error) {
            console.error('IndexedDBProvider: Failed to save state', error);
        }
    }

    async load(): Promise<AppState | null> {
        try {
            const db = await this.getDB();
            const data = await db.get(STORE_NAME, 'full-state');
            return data || null;
        } catch (error) {
            console.error('IndexedDBProvider: Failed to load state', error);
            return null;
        }
    }
}
