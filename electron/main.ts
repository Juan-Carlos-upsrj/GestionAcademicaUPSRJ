import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import type { AppState } from '../types';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { startGoogleLogin, handleGoogleCallback } from './auth';
import { listCourses, listCourseWork, listSubmissions, listCourseStudents } from './classroom';

const isDev = !!process.env.VITE_DEV_SERVER_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'appData.json');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

if (process.platform === 'win32') {
  app.setAppUserModelId('Gestión Académica IAEV');
}

// SETUP DEEP LINKING
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('gestion-docente', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('gestion-docente');
}

// SINGLE INSTANCE LOCK
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow: BrowserWindow | null = null;

function readData(): Partial<AppState> {
  try {
    if (fs.existsSync(dataFilePath)) {
      const rawData = fs.readFileSync(dataFilePath, 'utf-8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    log.error('Failed to read data file:', error);
  }
  return {};
}

function writeData(data: AppState): void {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    log.error('Failed to write data file:', error);
  }
}

// Define handleUrl to process deep links
function handleUrl(url: string) {
  handleGoogleCallback(url).then(result => {
    if (mainWindow) {
      mainWindow.webContents.send('auth:google-callback-result', result);
    }
    // Focus window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Handle the protocol url
    const url = commandLine.find(arg => arg.startsWith('gestion-docente://'));
    if (url) {
      log.info('Received deep link:', url);
      handleUrl(url);
    }
  });

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 940,
      minHeight: 600,
      icon: path.join(__dirname, isDev ? '../../public/logo.png' : '../dist/logo.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
      show: false,
      autoHideMenuBar: true,
    });

    if (isDev) {
      const devUrl = process.env.VITE_DEV_SERVER_URL;
      console.log(`[ELECTRON] Cargando servidor de desarrollo: ${devUrl}`);
      mainWindow.loadURL(devUrl);
      mainWindow.webContents.openDevTools();
    } else {
      console.log(`[ELECTRON] Cargando archivo de producción (dist/index.html)`);
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.maximize();
      }

      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    // Auto Updater Events
    autoUpdater.on('checking-for-update', () => { log.info('Checking for update...'); });
    autoUpdater.on('update-available', (info) => {
      log.info('Update available.', info);
      if (mainWindow) mainWindow.webContents.send('update_available');
    });
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available.', info);
      if (mainWindow) mainWindow.webContents.send('update_not_available');
    });
    autoUpdater.on('download-progress', (progressObj) => {
      if (mainWindow) mainWindow.webContents.send('download_progress', progressObj.percent);
    });
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded', info);
      if (mainWindow) mainWindow.webContents.send('update_downloaded');
    });
    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater. ' + err);
      if (mainWindow) mainWindow.webContents.send('update_error', err.message);
    });

    // Cleanup on closed
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  };

  app.whenReady().then(async () => {
    // --- AUTOMATIC BACKUP LOGIC ---
    try {
      const documentsPath = app.getPath('documents');
      const backupFolder = path.join(documentsPath, 'RespaldoGestionUPSRJ');

      if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
      }

      // Check last backup
      const appDataPath = path.join(app.getPath('userData'), 'appData.json');
      if (fs.existsSync(appDataPath)) {
        const files = fs.readdirSync(backupFolder);

        // Pattern: backup_YYYY-MM-DD.json
        const now = new Date();
        let shouldBackup = true;

        // Find the most recent backup
        let lastBackupTime = 0;
        for (const file of files) {
          if (file.startsWith('backup_') && file.endsWith('.json')) {
            const stats = fs.statSync(path.join(backupFolder, file));
            if (stats.mtimeMs > lastBackupTime) {
              lastBackupTime = stats.mtimeMs;
            }
          }
        }

        // Check if 7 days have passed (7 * 24 * 60 * 60 * 1000 ms)
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (now.getTime() - lastBackupTime < sevenDaysMs) {
          shouldBackup = false;
        }

        if (shouldBackup || files.length === 0) {
          const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
          const backupPath = path.join(backupFolder, `backup_${dateStr}.json`);
          fs.copyFileSync(appDataPath, backupPath);
          console.log(`Automatic backup created at: ${backupPath}`);
        }
      }
    } catch (err) {
      console.error("Failed to perform automatic backup:", err);
    }
    // ------------------------------

    createWindow();

    ipcMain.handle('get-data', () => readData());
    ipcMain.handle('save-data', (_, data: AppState) => writeData(data));
    ipcMain.handle('get-version', () => app.getVersion());
    ipcMain.on('restart_app', () => autoUpdater.quitAndInstall());
    ipcMain.on('check_for_updates', () => { if (!isDev) autoUpdater.checkForUpdates(); });

    // Auth Handlers
    ipcMain.handle('auth:start-google-login', async () => {
      await startGoogleLogin();
    });

    ipcMain.handle('auth:refresh-tokens', async (_, refreshToken) => {
      try {
        // Lazy import to avoid circular dependencies if any, though auth.ts is safe
        const { refreshGoogleTokens } = await import('./auth');
        return await refreshGoogleTokens(refreshToken);
      } catch (error) {
        log.error('Failed to refresh tokens via IPC:', error);
        throw error;
      }
    });

    // Classroom Handlers
    ipcMain.handle('classroom:list-courses', async (_, tokens) => {
      try {
        return await listCourses(tokens);
      } catch (error) {
        log.error('IPC Error classroom:list-courses:', error);
        throw error;
      }
    });

    ipcMain.handle('classroom:list-coursework', async (_, tokens, courseId) => {
      try {
        return await listCourseWork(tokens, courseId);
      } catch (error) {
        log.error(`IPC Error classroom:list-coursework (course ${courseId}):`, error);
        throw error;
      }
    });

    ipcMain.handle('classroom:list-submissions', async (_, tokens, courseId, courseWorkId) => {
      try {
        return await listSubmissions(tokens, courseId, courseWorkId);
      } catch (error) {
        log.error(`IPC Error classroom:list-submissions (course ${courseId}, work ${courseWorkId}):`, error);
        throw error;
      }
    });

    ipcMain.handle('classroom:list-students', async (_, tokens, courseId) => {
      try {
        return await listCourseStudents(tokens, courseId);
      } catch (error) {
        log.error(`IPC Error classroom:list-students (course ${courseId}):`, error);
        throw error;
      }
    });

    // Legacy Data Recovery Handlers
    ipcMain.handle('data:scan-legacy', async () => {
      const roamingPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
      const localPath = process.env.LOCALAPPDATA || roamingPath; // Fallback for non-Windows

      const searchPaths = [roamingPath, localPath];
      // Deduplicate paths if they are same
      const uniquePaths = [...new Set(searchPaths)];

      const keywords = ['gestion', 'asistencia', 'iaev'];
      const found: any[] = [];

      for (const basePath of uniquePaths) {
        try {
          if (!fs.existsSync(basePath)) continue;

          const dirs = fs.readdirSync(basePath, { withFileTypes: true });

          for (const dir of dirs) {
            if (!dir.isDirectory()) continue;

            const dirNameLower = dir.name.toLowerCase();
            // Check if directory matches any keyword
            if (!keywords.some(k => dirNameLower.includes(k))) continue;

            // Check for data files in this directory
            const filesToCheck = ['appData.json', 'appData.backup.json', 'appData.json.bak', 'storage.json']; // storage.json for some older versions?

            for (const file of filesToCheck) {
              const fullPath = path.join(basePath, dir.name, file);
              if (fs.existsSync(fullPath)) {
                try {
                  const stats = fs.statSync(fullPath);
                  const content = fs.readFileSync(fullPath, 'utf-8');

                  // Validate and count data
                  const data = JSON.parse(content);
                  let studentCount = 0;
                  let groupCount = 0;
                  let gradeCount = 0;

                  if (data.groups && Array.isArray(data.groups)) {
                    groupCount = data.groups.length;
                    data.groups.forEach((g: any) => {
                      if (g.students) studentCount += g.students.length;
                    });
                  }

                  // Count grades (rough estimate based on keys)
                  if (data.grades) {
                    for (const groupId in data.grades) {
                      const groupGrades = data.grades[groupId];
                      for (const studentId in groupGrades) {
                        gradeCount += Object.keys(groupGrades[studentId] || {}).length;
                      }
                    }
                  }

                  found.push({
                    folder: dir.name,
                    filename: file,
                    path: fullPath,
                    lastModified: stats.mtime,
                    stats: {
                      groups: groupCount,
                      students: studentCount,
                      grades: gradeCount
                    }
                  });
                } catch (e) {
                  // File exists but is invalid JSON or unreadable
                  console.error(`Error reading potential legacy file ${fullPath}:`, e);
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error scanning path ${basePath}:`, err);
        }
      }

      // Sort: Files with most students/grades first, then by date
      return found.sort((a, b) => {
        const scoreA = (a.stats.students * 10) + a.stats.grades;
        const scoreB = (b.stats.students * 10) + b.stats.grades;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });
    });

    ipcMain.handle('data:import-legacy', async (_, filePath: string) => {
      try {
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(rawData);
        }
      } catch (error) {
        log.error('Failed to import legacy data:', error);
        throw error;
      }
      return null;
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Handle deep link on cold start (macOS mostly, but good to have)
    // On Windows, you typically get it via process.argv in main execution, handled by second-instance or initially
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}