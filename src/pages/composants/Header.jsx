import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import '@/styles/Header.css';

import { FiLogOut, FiSun, FiMoon } from 'react-icons/fi';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Mapping des routes aux titres
  const pageTitles = {
    '/overview': 'Vue d\'ensemble',
    '/caisse': 'Caisse',
    '/commande': 'Commandes',
    '/inventaire': 'Inventaire',
    '/personnel': 'Personnel',
    '/parametre': 'Paramètres',
    '/': 'Tableau de bord'
  };

  // Fonction pour déterminer le titre
  const getPageTitle = () => {
    return pageTitles[location.pathname] || 'Tableau de bord';
  };

  // Extraction des infos utilisateur
  const userEmail = user?.email || (user?.sub ? user.sub : 'dercispoedel@gmail.com');
  const userRole = user?.role || 'Admin';

  return (
    <header className="header">
      <div className="header__content">
        <h1 className="header__title">{getPageTitle()}</h1>
        
        <div className="header__actions">
          <div className="header__user-info">
            <span className="header__email">{userEmail}</span>
            <span className="header__role"> |  {userRole}</span>
          </div>
          
          <button 
            onClick={toggleTheme} 
            className="header__theme-toggle"
            aria-label="Changer de thème"
          >
            {theme === 'light' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          
          <button 
            onClick={() => {
              logout();
            }}
            className="header__logout"
          >
            <FiLogOut className="logout-icon" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
