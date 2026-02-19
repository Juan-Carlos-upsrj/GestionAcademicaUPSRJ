import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { MOCK_USERS } from '../config/users';
import { CAREER_CONFIG, CAREERS } from '../config/careerConfig';
import Icon from './icons/Icon';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
    const { dispatch } = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Get the redirect path from location state or default to /
    const from = location.state?.from?.pathname || "/";

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const user = MOCK_USERS.find(u => u.username === username && u.password === password);

        if (user) {
            dispatch({ type: 'SET_USER', payload: user });
            navigate(from, { replace: true });
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    React.useEffect(() => {
        // Listen for Google Auth results
        if ((window as any).electronAPI) {
            (window as any).electronAPI.onGoogleLoginResult((result: any) => {
                if (result.success && result.user) {
                    // Map Google User to App User structure
                    // For now, allow any whitelisted user to be a generic "Professor" or match with existing users if email matches?
                    // Let's create a session user from Google data
                    const googleUser = {
                        username: result.user.email.split('@')[0],
                        name: result.user.name,
                        careerId: result.user.careerId || 'iaev', // Default or derived?
                        email: result.user.email,
                        googleId: result.user.googleId,
                        picture: result.user.picture,
                        accessToken: result.user.tokens?.access_token, // Store access token for API calls
                        tokens: result.user.tokens // Store full tokens object for refresh logic
                    };

                    dispatch({ type: 'SET_USER', payload: googleUser });
                    navigate(from, { replace: true });
                } else {
                    setError(result.error || 'Error al iniciar sesión con Google');
                }
            });
        }
    }, [dispatch, navigate, from]);

    const careerLogos = useMemo(() => Object.values(CAREERS).map(c => ({ src: c.logo || 'logo_IAEV.png', name: c.name })), []);

    // Create rows for the background animation
    const rows = [
        [...careerLogos, ...careerLogos, ...careerLogos],
        [...careerLogos, ...careerLogos, ...careerLogos].reverse(), // Different order/direction
        [...careerLogos, ...careerLogos, ...careerLogos],
        [...careerLogos, ...careerLogos, ...careerLogos].reverse(),
        [...careerLogos, ...careerLogos, ...careerLogos],
        [...careerLogos, ...careerLogos, ...careerLogos].reverse(),
        [...careerLogos, ...careerLogos, ...careerLogos],
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden flex flex-col justify-between opacity-10 pointer-events-none select-none z-0">
                {rows.map((row, rowIndex) => (
                    <motion.div
                        key={rowIndex}
                        className="flex gap-12 whitespace-nowrap"
                        initial={{ x: rowIndex % 2 === 0 ? '-20%' : '-50%' }}
                        animate={{ x: rowIndex % 2 === 0 ? ['-20%', '-50%'] : ['-100%', '-50%'] }}
                        // Note: To make it infinite properly without jumps, we usually need a specialized Marquee component.
                        // For a simple effect, we can just animate X. 
                        // A better infinite loop:
                        // animate from 0 to -50% (if the content is doubled). 
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 30 + (rowIndex * 2), // Vary speed slightly
                            repeatType: "loop"
                        }}
                        style={{ width: "max-content" }}
                    >
                        {row.map((logo, logoIndex) => (
                            <div key={logoIndex} className="w-32 h-24 flex items-center justify-center grayscale opacity-80">
                                <img src={logo.src} alt="" className="max-h-full max-w-full object-contain" />
                            </div>
                        ))}
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 border border-slate-200 rounded-2xl shadow-2xl p-8 w-full max-w-[400px] backdrop-blur-md mx-4 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-md p-3 border border-slate-100 relative">
                        <img
                            src={CAREER_CONFIG.logo || "/logo_IAEV.png"}
                            alt={`Logo ${CAREER_CONFIG.name}`}
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Universidad Politécnica</h1>
                    <p className="text-sm text-slate-500 font-medium">de Santa Rosa Jáuregui</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Usuario</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition-all font-medium"
                                placeholder="Ingresa tu usuario"
                            />
                            <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Icon name="user" className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Contraseña</label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 transition-all font-medium"
                                placeholder="••••••••"
                            />
                            <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Icon name="lock" className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg flex items-center gap-2 border border-red-100"
                            >
                                <Icon name="alert-triangle" className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">O continuar con</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => (window as any).electronAPI.startGoogleLogin()}
                        className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm mb-4"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        <span>Google</span>
                    </button>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                    >
                        <span>Ingresar</span>
                        <Icon name="chevron-right" className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center flex flex-col items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        Gestor Académico v3.3.27
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
