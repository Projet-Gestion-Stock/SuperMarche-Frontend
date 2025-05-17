import { useState } from 'react';
import { getDefaultRoute } from '@/utils/navigation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import api from '@/services/api'; // Import manquant
import '@/styles/ConnexionPage.css';
import logo from '@/assets/logo.png';

function ConnexionPage() {
  const [credentials, setCredentials] = useState({ 
    username: '', 
    password: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAuth(); // On n'utilise plus login du contexte
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!credentials.username || !credentials.password) {
      showToast('Tous les champs doivent être renseignés', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/user/connexion', credentials);
      
      if (!response.data.Bearer) {
        throw new Error("Token manquant dans la réponse");
      }

      localStorage.setItem('token', response.data.Bearer);
      const role = response.data.role;
      
      showToast('Authentification réussie', 'success');
      
      // Définition des routes par défaut par rôle
      const getDefaultRoute = (role) => {
        const roleRoutes = {
          STAFF: '/caisse',       // Premier item accessible pour STAFF
          GERANT: '/vue-ensemble', // Premier item accessible pour GERANT
          ADMIN: '/vue-ensemble'   // Premier item accessible pour ADMIN
        };
        return roleRoutes[role] || '/connexion'; // Fallback sécurisé
      };

      // Redirection basée sur le rôle avec la route par défaut appropriée
      setTimeout(() => {
        window.location.href = getDefaultRoute(role);
      }, 1500);

    } catch (err) {
      console.error("Erreur de connexion:", err);
      
      showToast(
        err.response?.status === 401 
          ? 'Identifiants incorrects' 
          : 'Erreur de connexion',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-branding">
          <div className="auth-logo">
            <img 
              src={logo}
              alt="Logo Gère Ma Boutique" 
              className="connexion-logo"
            />
          </div>
          <h1>Gère Ma Boutique</h1>
          <p className="auth-subtitle">Accès réservé au personnel</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <FiUser className="input-icon" />
            <input
              type="email"
              placeholder="Identifiant"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="auth-input"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            <FiLogIn className="button-icon" />
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConnexionPage;




