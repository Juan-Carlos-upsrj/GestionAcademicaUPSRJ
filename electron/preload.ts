
import { contextBridge, ipcRenderer } from 'electron';
import type { AppState } from '../types';

contextBridge.exposeInMainWorld('electronAPI', {
  getData: (): Promise<Partial<AppState>> => ipcRenderer.invoke('get-data'),
  saveData: (data: AppState): Promise<void> => ipcRenderer.invoke('save-data', data),
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-version'),

  // Update listeners
  onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update_downloaded', callback),
  onUpdateNotAvailable: (callback: () => void) => ipcRenderer.on('update_not_available', callback),
  onUpdateError: (callback: (message: string) => void) => ipcRenderer.on('update_error', (_, message) => callback(message)),

  // Generic invoke for cleaner API expansion
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  onDownloadProgress: (callback: (percent: number) => void) => ipcRenderer.on('download_progress', (_, percent) => callback(percent)),

  // Actions
  restartApp: () => ipcRenderer.send('restart_app'),
  checkForUpdates: () => ipcRenderer.send('check_for_updates'),

  // Auth
  startGoogleLogin: () => ipcRenderer.invoke('auth:start-google-login'),
  onGoogleLoginResult: (callback: (result: any) => void) => ipcRenderer.on('auth:google-callback-result', (_, result) => callback(result)),

  // Classroom
  listCourses: (tokens: any) => ipcRenderer.invoke('classroom:list-courses', tokens),
  listCourseWork: (tokens: any, courseId: string) => ipcRenderer.invoke('classroom:list-coursework', tokens, courseId),
  listSubmissions: (tokens: any, courseId: string, courseWorkId: string) => ipcRenderer.invoke('classroom:list-submissions', tokens, courseId, courseWorkId),
  listStudents: (tokens: any, courseId: string) => ipcRenderer.invoke('classroom:list-students', tokens, courseId),
});
