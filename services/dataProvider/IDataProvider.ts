import { AppState } from '../../types';

export interface IDataProvider {
    save(state: AppState): Promise<void>;
    load(): Promise<AppState | null>;
}
