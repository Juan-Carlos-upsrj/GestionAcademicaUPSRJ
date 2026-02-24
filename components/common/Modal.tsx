import React, { ReactNode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../icons/Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-[95vw] lg:max-w-6xl',
  '7xl': 'max-w-[98vw] lg:max-w-7xl',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, headerActions, size = 'md' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative z-10 w-full ${sizeClasses[size]} bg-surface rounded-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto border border-white/20 dark:border-slate-700/50 overflow-hidden text-slate-800 dark:text-slate-200`}
          >
            <header className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 shrink-0">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate pr-4 uppercase">{title}</h2>
              <div className="flex items-center gap-2">
                {headerActions && <div className="mr-2">{headerActions}</div>}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 dark:hover:text-rose-400 transition-all focus:outline-none"
                >
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>
            </header>
            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar bg-white/40 dark:bg-slate-900/40">
              {children}
            </div>
            {footer && (
              <footer className="flex justify-end p-5 border-t border-slate-100 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 shrink-0">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
