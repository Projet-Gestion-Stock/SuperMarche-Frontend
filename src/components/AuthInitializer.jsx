import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthInitializer() {
  const { checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuth = checkAuth();
    const isAuthPage = location.pathname === '/connexion';
    
    if (!isAuth && !isAuthPage) {
      navigate('/connexion', { replace: true });
    }
  }, [location, checkAuth, navigate]);

  return null;
}