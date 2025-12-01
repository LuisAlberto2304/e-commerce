"use client";

import { useState } from 'react';
import { useAuth } from '@/context/userContext';

/**
 * Componente de prueba para Google Sign-In
 * Agrega este componente a cualquier página para probar Google Sign-In
 * 
 * Uso:
 * import GoogleSignInTest from '@/components/GoogleSignInTest';
 * 
 * <GoogleSignInTest />
 */
export default function GoogleSignInTest() {
    const { signInWithGoogle, user } = useAuth();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testPopupMethod = async () => {
        setError('');
        setLoading(true);
        setLogs([]);

        try {
            addLog('🔵 Iniciando prueba con método POPUP...');
            await signInWithGoogle(false); // false = usar popup
            addLog('✅ Sign-in exitoso con popup!');
        } catch (err: any) {
            const errorMsg = err.message || err.toString();
            addLog(`❌ Error: ${errorMsg}`);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const testRedirectMethod = async () => {
        setError('');
        setLoading(true);
        setLogs([]);

        try {
            addLog('🔵 Iniciando prueba con método REDIRECT...');
            addLog('⚠️  La página se recargará...');
            await signInWithGoogle(true); // true = usar redirect
            // No llegará aquí porque la página se recarga
        } catch (err: any) {
            const errorMsg = err.message || err.toString();
            addLog(`❌ Error: ${errorMsg}`);
            setError(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🧪 Prueba de Google Sign-In</h2>

            {/* Estado del usuario */}
            <div className="mb-6 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">Estado actual:</h3>
                {user ? (
                    <div className="text-green-600">
                        ✅ Usuario autenticado: {user.email}
                    </div>
                ) : (
                    <div className="text-gray-600">
                        ⚪ No hay usuario autenticado
                    </div>
                )}
            </div>

            {/* Botones de prueba */}
            <div className="space-y-4 mb-6">
                <div>
                    <button
                        onClick={testPopupMethod}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '⏳ Probando...' : '🪟 Probar con Popup'}
                    </button>
                    <p className="text-sm text-gray-600 mt-1">
                        Abre una ventana emergente para autenticación
                    </p>
                </div>

                <div>
                    <button
                        onClick={testRedirectMethod}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '⏳ Probando...' : '🔄 Probar con Redirect'}
                    </button>
                    <p className="text-sm text-gray-600 mt-1">
                        Redirige a Google y vuelve (más confiable en móviles)
                    </p>
                </div>
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <h3 className="font-semibold mb-2">❌ Error:</h3>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
                <div className="p-4 bg-gray-900 text-green-400 rounded font-mono text-sm">
                    <h3 className="font-semibold mb-2 text-white">📋 Logs:</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                        {logs.map((log, index) => (
                            <div key={index}>{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instrucciones */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold mb-2 text-blue-900">💡 Instrucciones:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Abre la consola del navegador (F12) para ver logs detallados</li>
                    <li>Prueba primero con el método Popup</li>
                    <li>Si el popup es bloqueado, prueba con Redirect</li>
                    <li>Revisa los mensajes de error para diagnosticar problemas</li>
                </ol>
            </div>

            {/* Checklist de verificación */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold mb-2 text-yellow-900">✅ Checklist de verificación:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                    <li>□ Google Sign-In está habilitado en Firebase Console</li>
                    <li>□ El dominio actual está en la lista de dominios autorizados</li>
                    <li>□ Los popups están permitidos en el navegador</li>
                    <li>□ La configuración de Firebase es correcta</li>
                </ul>
            </div>
        </div>
    );
}
