/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
// pages/profile/settings.tsx
import { useState, useEffect } from 'react';
import { getAuth, updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from "@/context/userContext";
import app from '@/app/lib/firebaseClient';

// Tipos TypeScript
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  storeName: string | null;
  createdAt: string;
  updatedAt: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    newsletter: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

export default function ProfileSettings() {
  const db = getFirestore(app);
  const storage = getStorage(app);
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<UserProfile>({
    uid: '',
    name: '',
    email: '',
    role: 'buyer',
    storeName: null,
    createdAt: '',
    updatedAt: '',
    photoURL: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    preferences: {
      newsletter: false,
      emailNotifications: true,
      smsNotifications: false
    }
  });
  
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Nuevos estados para las funcionalidades
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
        const loadUserData = async () => {
        try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
            const data = snap.data();

            setProfile(prev => ({
                ...prev,
                uid: user.uid,
                name: user.displayName || '',
                email: user.email || '',
                photoURL: user.photoURL || '',
                phoneNumber: user.phoneNumber || '',
                createdAt: data.createdAt || '',
                updatedAt: data.updatedAt || '',
                address: data.address || prev.address,
                preferences: data.preferences || prev.preferences
            }));
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
        };

        loadUserData();
    }
    }, [user]);

  // Validar formato de teléfono
  const validatePhoneNumber = (phone: string): boolean => {
    // Eliminar espacios, guiones y paréntesis
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // Validar que solo contenga números
    if (!/^\d+$/.test(cleanPhone)) {
      setPhoneError('El teléfono solo debe contener números');
      return false;
    }
    
    // Validar longitud típica de números celulares (entre 10 y 15 dígitos)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setPhoneError('El teléfono debe tener entre 10 y 15 dígitos');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name.startsWith('preferences.')) {
        const prefKey = name.split('.')[1];
        setProfile(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences!,
            [prefKey]: checked
          }
        }));
      }
    } else if (name.startsWith('address.')) {
      const addressKey = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressKey]: value
        }
      }));
    } else {
      // Validación especial para teléfono
      if (name === 'phoneNumber') {
        setProfile(prev => ({
          ...prev,
          [name]: value
        }));
        
        // Validar en tiempo real si el campo no está vacío
        if (value.trim() !== '') {
          validatePhoneNumber(value);
        } else {
          setPhoneError('');
        }
      } else {
        setProfile(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  // Subir imagen de perfil
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      const storageRef = ref(storage, `profile-images/${user.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Actualizar en Authentication
      await updateProfile(user, { photoURL: downloadURL });
      
      // Actualizar en Firestore si es necesario
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      });
      
      setProfile(prev => ({ ...prev, photoURL: downloadURL }));
      setMessage({ type: 'success', text: 'Imagen de perfil actualizada correctamente' });
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setMessage({ type: 'error', text: 'Error al subir la imagen' });
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar información personal
  const savePersonalInfo = async () => {
    if (!user) return;
    
    // Validar teléfono antes de guardar
    if (profile.phoneNumber && profile.phoneNumber.trim() !== '') {
      if (!validatePhoneNumber(profile.phoneNumber)) {
        setMessage({ type: 'error', text: 'Por favor, corrige el número de teléfono antes de guardar' });
        return;
      }
    }
    
    setIsLoading(true);
    try {
      // Actualizar en Authentication
      await updateProfile(user, { displayName: profile.name });
      
      // Actualizar en Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        updatedAt: new Date().toISOString()
      });
      
      setMessage({ type: 'success', text: 'Información personal actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar información:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la información' });
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar dirección
  const saveAddress = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        address: profile.address,
        updatedAt: new Date().toISOString()
      });
      
      setMessage({ type: 'success', text: 'Dirección actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar dirección:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la dirección' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cambiar contraseña
  const changePassword = async () => {
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    
    setIsLoading(true);
    try {
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Cambiar contraseña
      await updatePassword(user, newPassword);
      
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña. Verifica tu contraseña actual.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Esta función es más directa
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No disponible';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  // Guardar preferencias
  const savePreferences = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        preferences: profile.preferences,
        updatedAt: new Date().toISOString()
      });
      
      setMessage({ type: 'success', text: 'Preferencias actualizadas correctamente' });
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      setMessage({ type: 'error', text: 'Error al actualizar las preferencias' });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Debes iniciar sesión para ver esta página</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white p-6">
            <h1 className="text-2xl font-bold">Configuración de Perfil</h1>
            <p className="text-gray-300">Gestiona tu información personal, preferencias y configuración de cuenta</p>
          </div>

          {/* Mensajes */}
          {message.text && (
            <div className={`p-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col md:flex-row">
            {/* Navegación lateral */}
            <div className="md:w-64 bg-gray-50 border-r">
              <nav className="p-4 space-y-2">
                {[
                  { id: 'personal', label: 'Información Personal', icon: '👤' },
                  { id: 'address', label: 'Dirección', icon: '📍' },
                  { id: 'security', label: 'Seguridad', icon: '🔒' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 p-6">
              {/* Información Personal */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Información Personal</h2>

                  {/* Formulario de información personal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo electrónico *
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede cambiar</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono celular
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={profile.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          phoneError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: 1234567890"
                      />
                      {phoneError && (
                        <p className="text-red-600 text-xs mt-1">{phoneError}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Formato: 10-15 dígitos sin espacios ni caracteres especiales
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol
                      </label>
                      <input
                        type="text"
                        value={profile.role === 'buyer' ? 'Vendedor' : 'Comprador'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={savePersonalInfo}
                      disabled={isLoading || !!phoneError}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              )}

              {/* Dirección */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Dirección de Envío</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calle y número *
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={profile.address?.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={profile.address?.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado/Provincia *
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={profile.address?.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={profile.address?.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        País *
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={profile.address?.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={saveAddress}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar Dirección'}
                    </button>
                  </div>
                </div>
              )}

              {/* Seguridad */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Seguridad de la Cuenta</h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Cambiar contraseña
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Asegúrate de usar una contraseña segura que no uses en otros sitios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña actual *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m9.02 9.02l3.83 3.83" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nueva contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m9.02 9.02l3.83 3.83" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar nueva contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m9.02 9.02l3.83 3.83" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={changePassword}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </div>
              )}           
            </div>
          </div>
        </div>

        {/* Información de la cuenta */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de la Cuenta</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
            <p className="text-gray-600">ID de usuario:</p>
            <p className="font-mono text-gray-800 text-xs break-all">{profile.uid || 'Cargando...'}</p>
            </div>
            
            <div>
            <p className="text-gray-600">Fecha de creación:</p>
            <p className="text-gray-800">
                {profile.createdAt ? formatDate(profile.createdAt) : 'Cargando...'}
            </p>
            </div>
            
            <div>
            <p className="text-gray-600">Última actualización:</p>
            <p className="text-gray-800">
                {profile.updatedAt ? formatDate(profile.updatedAt) : 'Cargando...'}
            </p>
            </div>
            
            <div>
            <p className="text-gray-600">Estado de la cuenta:</p>
            <p className="text-green-600 font-medium">Verificada</p>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
}