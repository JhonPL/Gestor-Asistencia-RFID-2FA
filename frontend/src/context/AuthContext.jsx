// src/context/AuthContext.jsx
// Gestiona la sesión real con JWT del backend.
// Al iniciar la app valida el token almacenado contra /api/auth/me.
// En producción reemplazar login por loginConAzure + MSAL.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/authApi';

const TOKEN_KEY = 'smartclass_token';
const USER_KEY  = 'smartclass_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // loading = true mientras validamos el token almacenado al arrancar
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  // Al montar, si hay token guardado lo validamos contra el backend
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    getMe(storedToken)
      .then(({ user: backendUser }) => {
        setUser(backendUser);
        setToken(storedToken);
      })
      .catch(() => {
        // Token expirado o inválido → limpiar sesión silenciosamente
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  /** Guarda el JWT y los datos del usuario tras un login exitoso */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /** Borra la sesión */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!user && !!token,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};

export default AuthContext;