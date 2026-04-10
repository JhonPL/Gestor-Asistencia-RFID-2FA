import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext — gestiona la sesión simulada de SmartClass.
 *
 * En producción este contexto se reemplaza por los hooks de @azure/msal-react.
 * Por ahora persiste en localStorage para que la sesión sobreviva un refresh.
 *
 * Roles disponibles para simulación: 'docente' | 'administrador'
 */

const STORAGE_KEY = 'smartclass_mock_user';

export const MOCK_USERS = {
  docente: {
    nombre: 'Carlos',
    apellido: 'Ramírez',
    iniciales: 'CR',
    correo: 'carlos.ramirez@ucc.edu.co',
    rol: 'docente',
  },
  administrador: {
    nombre: 'Admin',
    apellido: 'Sistema',
    iniciales: 'AS',
    correo: 'admin@ucc.edu.co',
    rol: 'administrador',
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sincroniza con localStorage cada vez que cambia el usuario
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (rol) => {
    const mockUser = MOCK_USERS[rol];
    if (!mockUser) throw new Error(`Rol desconocido: ${rol}`);
    setUser(mockUser);
    return mockUser;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook para consumir el contexto de autenticación */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};

export default AuthContext;