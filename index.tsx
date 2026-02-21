import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { SettingsProvider } from './context/SettingsContext';
import { GradesProvider } from './context/GradesContext';
import { AttendanceProvider } from './context/AttendanceContext';
import './index.css';
import 'driver.js/dist/driver.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <SettingsProvider>
    <AppProvider>
      <AttendanceProvider>
        <GradesProvider>
          <App />
        </GradesProvider>
      </AttendanceProvider>
    </AppProvider>
  </SettingsProvider>
);