import { IDataProvider } from './IDataProvider';
import { AppState } from '../../types';
import { IndexedDBProvider } from './IndexedDBProvider';
import { ElectronProvider } from './ElectronProvider';

export class CompositeDataProvider implements IDataProvider {
    private providers: IDataProvider[];

    constructor() {
        // Order matters for loading strategy. Electron (File System) is preferred source of truth.
        this.providers = [
            new ElectronProvider(),
            new IndexedDBProvider()
        ];
    }

    async save(state: AppState): Promise<void> {
        // Save to ALL providers concurrently to ensure redundancy
        await Promise.all(this.providers.map(p => p.save(state)));
    }

    async load(): Promise<AppState | null> {
        // Try to load from the first provider that returns data (Priority Strategy)
        for (const provider of this.providers) {
            const data = await provider.load();
            if (data) {
                console.log(`Data loaded successfully from ${provider.constructor.name}`);
                return data;
            }
        }
        return null;
    }
}
