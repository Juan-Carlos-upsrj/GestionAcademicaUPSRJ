import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { SidebarGroupDisplayMode } from '../types';
import { GROUP_COLORS, APP_VERSION } from '../constants';
import { CAREERS } from '../config/careerConfig';
import Icon from './icons/Icon';
import SettingsModal from './SettingsModal';
import TermsModal from './TermsModal';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

// Helper to parse quarter for sorting (e.g. "5º" -> 5)
const parseQ = (q?: string) => parseInt(q || '0') || 0;

const navItems: { path: string; label: string; icon: string; id: string }[] = [
  { path: '/', label: 'Inicio', icon: 'home', id: 'nav-item-dashboard' },
  { path: '/groups', label: 'Grupos', icon: 'users', id: 'nav-item-groups' },
  { path: '/teams', label: 'Equipos', icon: 'grid', id: 'nav-item-teams' },
  { path: '/tutorship', label: 'Tutoreo', icon: 'book-marked', id: 'nav-item-tutorship' },
  { path: '/attendance', label: 'Asistencia', icon: 'check-square', id: 'nav-item-attendance' },
  { path: '/calendar', label: 'Calendario', icon: 'calendar', id: 'nav-item-calendar' },
  { path: '/grades', label: 'Calificaciones', icon: 'graduation-cap', id: 'nav-item-grades' },
  { path: '/reports', label: 'Reportes', icon: 'bar-chart-3', id: 'nav-item-reports' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { state, dispatch } = useContext(AppContext);
  const { groups, selectedGroupId } = state;
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => parseQ(a.quarter) - parseQ(b.quarter) || a.name.localeCompare(b.name));
  }, [groups]);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleGroupClick = (groupId: string) => {
    dispatch({ type: 'SET_SELECTED_GROUP', payload: groupId });

    // Context-aware navigation
    if (location.pathname.startsWith('/grades')) {
      navigate(`/grades/${groupId}`);
    }
    // For other views (Attendance, Reports, Teams, etc.), the context update triggers the view change 
    // without changing the route. This prevents unwanted redirection to /groups.

    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleAbbreviationDisplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const modes: SidebarGroupDisplayMode[] = ['name', 'name-abbrev', 'abbrev'];
    const currentIndex = modes.indexOf(settings.sidebarGroupDisplayMode || 'name-abbrev');
    const nextMode = modes[(currentIndex + 1) % modes.length];

    updateSettings({ sidebarGroupDisplayMode: nextMode });
  };

  const getModeTitle = () => {
    switch (settings.sidebarGroupDisplayMode) {
      case 'name': return "Mostrar Nombre + Abreviatura";
      case 'name-abbrev': return "Mostrar Solo Abreviatura";
      case 'abbrev': return "Mostrar Solo Nombre";
      default: return "Cambiar vista";
    }
  };

  // Check active state loosely (e.g., /grades matches /grades/123)
  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  // Determine career config
  const careerId = state.currentUser?.careerId || 'isw';
  const careerConfig = CAREERS[careerId] || CAREERS['isw'];
  const careerAbbrev = careerId.toUpperCase(); // e.g., ISW, LTF, IAEV

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 bg-surface flex flex-col z-30 border-r border-border-color transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64 h-full`}
        aria-label="Barra lateral principal"
        id="sidebar-main"
      >
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-surface border border-border-color rounded-full p-1 text-text-secondary hover:text-primary shadow-sm z-40"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
        </button>

        <div className={`p-4 border-b border-border-color flex items-center gap-3 h-[73px] flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`} id="sidebar-logo">
          <motion.img
            src={careerConfig.logo || "logo.png"}
            alt={`${careerAbbrev} Logo`}
            className="w-10 h-10 flex-shrink-0 object-contain"
            animate={{ rotate: [0, 7, -7, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {!isCollapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 whitespace-nowrap overflow-hidden"
            >
              Gestión {careerAbbrev}
            </motion.h1>
          )}
        </div>

        <div className={`p-4 border-b border-border-color flex-shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`} id="sidebar-quick-groups">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Grupos Rápidos</h3>
              <button
                onClick={toggleAbbreviationDisplay}
                className={`p-1 rounded-md transition-colors ${settings.sidebarGroupDisplayMode !== 'name' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-secondary text-text-secondary hover:text-primary'}`}
                title={getModeTitle()}
              >
                <Icon name="layout" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {sortedGroups.length > 0 ? (
            <div className={`flex flex-wrap gap-2 ${isCollapsed ? 'justify-center flex-col w-full' : ''} max-h-[30vh] overflow-y-auto custom-scrollbar pr-1`}>
              {sortedGroups.map(g => {
                const colorObj = GROUP_COLORS.find(c => c.name === g.color) || GROUP_COLORS[0];
                const isGroupActive = selectedGroupId === g.id;

                const activeClass = `${colorObj.bg} !text-white shadow-md ring-2 ring-offset-1 ring-offset-surface ${colorObj.ring || 'ring-primary'}`;
                const inactiveClass = `bg-surface-secondary text-text-secondary hover:bg-border-color hover:text-text-primary`;

                let displayLabel = g.name;
                const abbrev = g.subjectShortName || g.subject.substring(0, 3).toUpperCase();

                if (settings.sidebarGroupDisplayMode === 'abbrev') {
                  displayLabel = abbrev;
                } else if (settings.sidebarGroupDisplayMode === 'name-abbrev') {
                  displayLabel = `${g.name} - ${abbrev}`;
                }

                if (isCollapsed) {
                  return (
                    <motion.button
                      key={g.id}
                      onClick={() => handleGroupClick(g.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title={`${g.name} - ${g.subject} (${g.quarter || '?'})`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border border-transparent mx-auto mb-1 relative ${isGroupActive ? activeClass : inactiveClass
                        }`}
                    >
                      {displayLabel.charAt(0).toUpperCase()}
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-slate-800 rounded-full flex items-center justify-center text-[7px] font-black shadow-sm ring-1 ring-slate-200">{parseQ(g.quarter)}</span>
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={g.id}
                    onClick={() => handleGroupClick(g.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={`${g.name} - ${g.subject}`}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200 border border-transparent whitespace-nowrap overflow-hidden text-ellipsis max-w-full flex items-center justify-between gap-2 mb-0.5 ${isGroupActive ? activeClass : inactiveClass
                      }`}
                  >
                    <span className="truncate">{displayLabel}</span>
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border ${isGroupActive ? 'bg-white/20 border-white/30' : 'bg-slate-200 border-slate-300 text-slate-600'}`}>{parseQ(g.quarter)}</span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            !isCollapsed && <p className="text-xs text-text-secondary italic">No hay grupos creados.</p>
          )}
        </div>

        <nav className="flex-grow py-2 sm:py-4 overflow-y-auto custom-scrollbar" id="sidebar-nav">
          <ul className="px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <motion.a
                  href="#"
                  id={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }}
                  title={isCollapsed ? item.label : ''}
                  className={`flex items-center gap-3 px-4 py-2.5 my-1 rounded-lg text-base font-semibold transition-all duration-200 relative overflow-hidden ${isActive(item.path)
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-text-primary hover:bg-surface-secondary'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </motion.a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`p-4 border-t border-border-color space-y-2 flex-shrink-0 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
          <button
            id="sidebar-settings"
            onClick={() => setIsSettingsOpen(true)}
            title={isCollapsed ? "Configuración" : ""}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-text-primary hover:bg-surface-secondary transition-colors duration-200 ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <Icon name="settings" className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-base font-semibold whitespace-nowrap">Configuración</span>}
          </button>

          <button
            onClick={() => setIsTermsOpen(true)}
            title={isCollapsed ? "Términos Legales" : ""}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-text-secondary hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200 border border-transparent hover:border-indigo-100 ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <Icon name="shield" className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold whitespace-nowrap">Términos y condiciones</span>}
          </button>

          {!isCollapsed && (
            <div className="pt-2 flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Versión Ecosistema</span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 border border-primary/20">v{APP_VERSION}</span>
            </div>
          )}
        </div>
      </aside>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
};

export default Sidebar;