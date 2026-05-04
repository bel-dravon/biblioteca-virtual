import React, { createContext, useState, useContext } from 'react';
import apiClient from '../api/config';

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        return localStorage.getItem('authToken') || null;
    });

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('userData');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(false);

    // Obtener perfil del usuario (incluye rol)
    const fetchUserProfile = async (username) => {
        try {
            // Obtener perfil que incluye el rol
            const response = await apiClient.get('/perfiles/');
            const perfiles = Array.isArray(response) ? response : response.results || [];

            // El endpoint de perfiles filtra por usuario actual
            if (perfiles.length > 0) {
                const perfil = perfiles[0];
                return {
                    username: perfil.usuario?.username || username,
                    id: perfil.usuario?.id,
                    email: perfil.usuario?.email,
                    first_name: perfil.usuario?.first_name,
                    last_name: perfil.usuario?.last_name,
                    rol: perfil.rol?.nombre || null,
                    rol_id: perfil.rol?.id,
                    permisos: {
                        puede_gestionar_usuarios: perfil.rol?.puede_gestionar_usuarios || false,
                        puede_eliminar_contenido: perfil.rol?.puede_eliminar_contenido || false,
                        puede_ver_estadisticas: perfil.rol?.puede_ver_estadisticas || false,
                    }
                };
            }
            return { username };
        } catch (error) {
            console.warn('No se pudo obtener el perfil:', error);
            return { username };
        }
    };

    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await apiClient.post('/api-token-auth/', { username, password });

            const { token } = response;

            if (token) {
                setToken(token);
                localStorage.setItem('authToken', token);

                // Obtener perfil completo con rol
                const userData = await fetchUserProfile(username);
                setUser(userData);
                localStorage.setItem('userData', JSON.stringify(userData));

                return { success: true };
            }
            return { success: false, message: 'No se recibió token' };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Credenciales incorrectas' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    };

    const register = async (userData) => {
        try {
            await apiClient.post('/users/', userData);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.errors ? JSON.stringify(error.errors) : 'Error al registrarse'
            };
        }
    };

    // Refrescar datos del usuario (útil después de cambios de perfil)
    const refreshUser = async () => {
        if (user?.username) {
            const userData = await fetchUserProfile(user.username);
            setUser(userData);
            localStorage.setItem('userData', JSON.stringify(userData));
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        register,
        refreshUser,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
