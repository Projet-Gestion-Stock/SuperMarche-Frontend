import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';
import Toast from '@/components/Notification'; // Assurez-vous d'avoir créé ce composant

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Erreur de décodage du token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const showToast = (message, type = 'info', position = 'bottom-right', duration = 3000) => {
    setToast({
      message,
      type,
      position,
      duration,
      key: Date.now() // Utilise un timestamp comme clé unique
    });
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/user/connexion', credentials);
      localStorage.setItem('token', response.data.Bearer);
      const decoded = jwtDecode(response.data.Bearer);
      console.log('Decoded user:', decoded);

      setUser({
        email: decoded.sub || response.data.email, // Prend soit le sub du JWT soit l'email de la réponse
        role: decoded.role || response.data.role
      });
      
      showToast('Connexion réussie', 'success');
      return decoded.role;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      showToast('Identifiants incorrects', 'error');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/user/deconnexion', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Affiche la notification avant la redirection
      showToast('Déconnexion réussie. À bientôt !', 'success', 'bottom-center');

      // Délai pour permettre à l'utilisateur de voir le message
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('hasSeenSplash');
        setUser(null);
        window.location.href = '/connexion';
      }, 1500);

    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      showToast('Échec de la déconnexion', 'error');
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return Date.now() < decoded.exp * 1000;
    } catch (error) {
      console.error("Erreur de vérification du token:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      checkAuth,
      isAuthenticated: checkAuth(),
      showToast // Expose la fonction pour une utilisation dans d'autres composants
    }}>
      {children}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          position={toast.position}
          onClose={() => setToast(null)}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
