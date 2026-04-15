import { useEffect, useRef } from 'react';

/**
 * Escucha eventos de teclado globales simulando un lector de código de barras/NFC/QR
 * que se comporta como un teclado Bluetooth (HID).
 * 
 * @param onScan Callback que recibe el ID o texto escaneado completo
 * @param prefix Opcional: Solo procesar si empieza con cierto prefijo (por si lee URLs enteras)
 */
export const useScanner = (onScan: (scanData: string) => void) => {
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorar eventos si el usuario está en un input normal escribiendo
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            const currentTime = new Date().getTime();
            
            // Los scanners hardware teclean muuuuy rapido (menos de 30ms entre teclas)
            // Si pasan más de 100ms, vaciamos el buffer porque fue un humano tecleando lento
            if (currentTime - lastKeyTimeRef.current > 100) {
                bufferRef.current = '';
            }

            if (e.key === 'Enter') {
                if (bufferRef.current.length >= 6) { 
                    // Un ID o Matricula razonable tiene al menos 6 caracteres
                    const scanData = bufferRef.current;
                    setTimeout(() => onScan(scanData), 0);
                    e.preventDefault();
                }
                bufferRef.current = '';
            } else if (e.key.length === 1) { // Solo caracteres visibles
                bufferRef.current += e.key;
            }

            lastKeyTimeRef.current = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan]);
};
