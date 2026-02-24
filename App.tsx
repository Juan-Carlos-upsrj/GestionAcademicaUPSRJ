import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from './context/AppContext';
import { useSettings } from './context/SettingsContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GroupManagement from './components/GroupManagement';
import TeamsView from './components/TeamsView';
import AttendanceView from './components/AttendanceView';
import ReportsView from './components/ReportsView';
import GradesView from './components/GradesView';
import TutorshipView from './components/TutorshipView';
import CalendarView from './components/CalendarView';
import { APP_VERSION } from './constants';
import { checkForMobileUpdate } from './services/mobileUpdateService';
import { MobileUpdateInfo } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import RequireAuth from './components/layout/RequireAuth';
import MobileUpdateModal from './components/MobileUpdateModal';
import ChangelogModal from './components/ChangelogModal';

import CommandPalette from './components/common/CommandPalette';
import StudentProfileModal from './components/StudentProfileModal';

const normalizeStr = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const App: React.FC = () => {
  const { state } = useContext(AppContext);
  const { teacherSchedule } = state;
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [mobileUpdateInfo, setMobileUpdateInfo] = useState<MobileUpdateInfo | null>(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Global Search & Profile State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, groupId: string } | null>(null);

  const [lastSeenVersion, setLastSeenVersion] = useLocalStorage('lastSeenVersion', '0.0.0');

  const notifiedClassesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            console.log("Notificaciones habilitadas por el usuario.");
          }
        });
      }
    }

    if (lastSeenVersion !== APP_VERSION) {
      setIsChangelogOpen(true);
      setLastSeenVersion(APP_VERSION);
    }
  }, []);

  useEffect(() => {
    if (!teacherSchedule || teacherSchedule.length === 0 || !settings.enableReminders) return;

    const checkSchedule = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      const currentDayStr = normalizeStr(now.toLocaleDateString('es-ES', { weekday: 'long' }));
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeInMins = currentHour * 60 + currentMin;

      const todaysClasses = teacherSchedule.filter(c => normalizeStr(c.day) === currentDayStr);

      todaysClasses.forEach(clase => {
        const classStartInMins = clase.startTime * 60;
        const classEndInMins = (clase.startTime + clase.duration) * 60;

        const diffToStart = classStartInMins - currentTimeInMins;
        const diffToEnd = classEndInMins - currentTimeInMins;

        const todayKey = now.toDateString();
        const startKey = `START-${clase.id}-${todayKey}`;
        const endKey = `END-${clase.id}-${todayKey}`;

        const reminderTime = settings.reminderTime || 20;
        if (diffToStart > 0 && diffToStart <= reminderTime && !notifiedClassesRef.current.has(startKey)) {
          new Notification("🍎 Próxima Clase", {
            body: `Faltan ${diffToStart} min para: ${clase.subjectName} (${clase.groupName})`,
            icon: "logo.png",
            silent: false,
            requireInteraction: true
          });
          notifiedClassesRef.current.add(startKey);
        }

        if (diffToEnd > 0 && diffToEnd <= 5 && !notifiedClassesRef.current.has(endKey)) {
          new Notification("🔔 Fin de Clase", {
            body: `La clase de ${clase.subjectName} está por terminar en 5 minutos.`,
            icon: "logo.png",
            silent: false
          });
          notifiedClassesRef.current.add(endKey);
        }
      });
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [teacherSchedule, settings.enableReminders, settings.reminderTime]);


  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateDownloaded(() => {
        // Handle update
      });
    }
    else if (settings.mobileUpdateUrl) {
      checkForMobileUpdate(settings.mobileUpdateUrl, APP_VERSION)
        .then(info => {
          if (info) setMobileUpdateInfo(info);
        })
        .catch(err => {
          console.warn("Auto-update check failed:", err);
        });
    }
  }, [settings.mobileUpdateUrl]);

  if (isSettingsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Router>
        {mobileUpdateInfo && (
          <MobileUpdateModal
            isOpen={!!mobileUpdateInfo}
            onClose={() => setMobileUpdateInfo(null)}
            updateInfo={mobileUpdateInfo}
          />
        )}
        <ChangelogModal
          isOpen={isChangelogOpen}
          onClose={() => setIsChangelogOpen(false)}
        />

        {/* Global Components */}
        <CommandPalette
          onSelectStudent={(studentId, groupId) => {
            setSelectedStudent({ id: studentId, groupId });
            setProfileModalOpen(true);
          }}
        />

        <StudentProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          studentId={selectedStudent?.id || null}
          groupId={selectedStudent?.groupId || null}
        />

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<GroupManagement />} />
            <Route path="/teams" element={<TeamsView />} />
            <Route path="/attendance" element={<AttendanceView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/grades" element={<GradesView />} />
            <Route path="/grades/:groupId" element={<GradesView />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/tutorship" element={<TutorshipView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;