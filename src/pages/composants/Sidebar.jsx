
import { useState, useEffect, useMemo } from 'react';
import { 
  FiHome, FiShoppingCart, FiSettings, 
  FiPackage, FiUsers, FiLogOut,
  FiMenu, FiX, FiFileText
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/Sidebar.css';

const MENU_ITEMS_CONFIG = [
  { 
    icon: <FiHome size={20} />, 
    label: 'Vue d\'ensemble', 
    key: 'vue-ensemble',
    path: '/vue-ensemble',
    roles: ['ADMIN', 'GERANT']
  },
  { 
    icon: <FiShoppingCart size={20} />, 
    label: 'Caisse', 
    key: 'caisse',
    path: '/caisse',
    roles: ['ADMIN', 'GERANT', 'STAFF']
  },
  { 
    icon: <FiFileText size={20} />, 
    label: 'Commande', 
    key: 'commande',
    path: '/commande',
    roles: ['ADMIN', 'GERANT', 'STAFF']
  },
  { 
    icon: <FiPackage size={20} />, 
    label: 'Inventaire (Stock)', 
    key: 'inventaire',
    path: '/inventaire',
    roles: ['ADMIN', 'GERANT']
  },
  { 
    icon: <FiUsers size={20} />, 
    label: 'Personnel', 
    key: 'personnel',
    path: '/personnel',
    roles: ['ADMIN', 'GERANT']
  },
  { 
    icon: <FiSettings size={20} />, 
    label: 'Paramètre', 
    key: 'parametre',
    path: '/parametre',
    roles: ['ADMIN', 'GERANT', 'STAFF']
  },
  { 
    icon: <FiLogOut size={20} />, 
    label: 'Déconnexion', 
    key: 'deconnexion',
    action: (logout) => {
      logout();
    },
    roles: ['ADMIN', 'GERANT', 'STAFF']
  }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  
  // États initiaux
  const [isMobile, setIsMobile] = useState(null); // Initialisé à null
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Ajouté

  // Détection responsive améliorée
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };

    // Initialisation synchrone
    handleResize();
    setIsInitialized(true); // Marquer comme initialisé
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrer les items
  const menuItems = useMemo(() => {
    return MENU_ITEMS_CONFIG.filter(item => item.roles.includes(user?.role));
  }, [user?.role]);

  // Détermine l'item actif
  const activeItem = useMemo(() => {
    const currentItem = menuItems.find(item => 
      item.path && location.pathname.startsWith(item.path));
    return currentItem?.key;
  }, [location.pathname, menuItems]);

  // Gestion des clics
  const handleItemClick = (item) => {
    if (item.action) {
      item.action(logout);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Ne rien rendre avant l'initialisation
  if (!isInitialized || isMobile === null) {
    return null;
  }

  return (
    <>
      {/* Bouton hamburger mobile */}
      {isMobile && (
        <button 
          className={`mobile-toggle-btn ${mobileOpen ? 'hidden' : ''}`}
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1000,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem',
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
        >
          <FiMenu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobile ? 'mobile' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Bouton de fermeture mobile */}
        {isMobile && (
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <FiX size={24} />
          </button>
        )}

        <div className="sidebar-header">
          <h2>Gère Ma Boutique</h2>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeItem === item.key ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay pour mobile */}
      {isMobile && mobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
