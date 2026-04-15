import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Group } from '../types';
import { useSettings } from '../context/SettingsContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
}

const QRCodeAttendanceModal: React.FC<Props> = ({ isOpen, onClose, group }) => {
    const { settings } = useSettings();
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState<number>(0);
    const [_scanCount, setScanCount] = useState<number>(0);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    
    let apiBase = settings.apiUrl.split('/api/')[0];
    if (!apiBase.endsWith('/')) apiBase += '/';

    const fetchQR = async () => {
        setIsRefreshing(true);
        try {
            const carrera = 'IAEV';
            const url = `${apiBase}api/qr_auto.php?action=generate&c=${carrera}&g=${encodeURIComponent(group.name)}&m=${encodeURIComponent(group.subject)}&p=${encodeURIComponent(settings.professorName)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.status === 'success') {
                const qrImageSrc = `https://quickchart.io/qr?text=${encodeURIComponent(data.url)}&size=600&margin=2&dark=1a1a2e&light=ffffff`;
                const img = new Image();
                img.onload = () => {
                    setQrUrl(qrImageSrc);
                    setIsRefreshing(false);
                };
                img.onerror = () => setIsRefreshing(false);
                img.src = qrImageSrc;
                setExpiresIn(data.expires_in ?? 30);
                if (data.scan_count !== undefined) setScanCount(data.scan_count);
            }
        } catch (e) {
            console.error('Error fetching QR', e);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setQrUrl(null);
            setExpiresIn(0);
            setScanCount(0);
            return;
        }

        fetchQR();
        
        const countInterval = setInterval(() => {
            setExpiresIn(prev => {
                if (prev <= 1) {
                    fetchQR();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countInterval);
    }, [isOpen, group.name, group.subject, settings.professorName, apiBase]);

    if (!isOpen) return null;

    const urgencyColor = expiresIn <= 5 ? '#ef4444' : expiresIn <= 10 ? '#f97316' : '#10b981';
    const progress = expiresIn <= 0 ? 0 : (expiresIn / 30) * 100;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pizarrón Auto-Asistencia QR" size="2xl">
            <div className="flex flex-col gap-4">

                {/* Cabecera de info del grupo */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/50">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined material-icon">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Clase Activa</p>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight truncate">{group.subject}</h3>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{group.name}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Docente</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[140px] text-right truncate">{settings.professorName}</p>
                    </div>
                </div>

                {/* QR principal */}
                <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 text-center">
                        <span className="material-symbols-outlined material-icon text-emerald-500">qr_code_scanner</span>
                        <div>
                            <p className="font-black text-slate-800 dark:text-slate-100 text-lg">Escanea para registrar asistencia</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Los alumnos abren la cámara o app de QR. El código cambia automáticamente.</p>
                        </div>
                    </div>

                    {/* QR Image */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        {qrUrl ? (
                            <img
                                src={qrUrl}
                                alt="QR Code Auto-Asistencia"
                                className={`w-full h-full object-contain rounded-2xl border-4 border-slate-100 dark:border-slate-700 shadow-xl transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
                                <span className="material-symbols-outlined text-4xl">qr_code_2</span>
                                <span className="text-sm font-medium">Generando QR...</span>
                            </div>
                        )}

                        {/* Scan line animation */}
                        {qrUrl && !isRefreshing && (
                            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl">
                                <div
                                    className="w-full h-0.5 animate-[scan_2.5s_ease-in-out_infinite]"
                                    style={{
                                        background: 'linear-gradient(to right, transparent, #10b981, transparent)',
                                        boxShadow: '0 0 12px 3px rgba(16,185,129,0.6)'
                                    }}
                                />
                            </div>
                        )}

                        {isRefreshing && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-slate-800/60 z-30">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-indigo-500 text-3xl animate-spin">refresh</span>
                                    <p className="text-xs font-bold text-indigo-500 mt-1">Actualizando...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Countdown + Progress */}
                    <div className="w-full space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expira en</span>
                            <span
                                className="text-2xl font-black font-mono transition-colors duration-500"
                                style={{ color: urgencyColor }}
                            >
                                {expiresIn}s
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: urgencyColor,
                                    boxShadow: `0 0 8px ${urgencyColor}60`
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Info + Botón */}
                <div className="flex gap-3 items-stretch">
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">check_circle</span>
                            <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Registro automático</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Cada escaneo registra asistencia en el servidor en tiempo real. Cierra el modal cuando termines la clase.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 px-6 py-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-black rounded-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 min-w-[100px]"
                    >
                        <span className="material-symbols-outlined text-2xl">stop_circle</span>
                        <span className="text-xs">Finalizar QR</span>
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(288px); }
                    100% { transform: translateY(0); }
                }
            `}</style>
        </Modal>
    );
};

export default QRCodeAttendanceModal;
