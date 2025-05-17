import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/connexion" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    // Vérifie si le token est expiré
    if (Date.now() >= decoded.exp * 1000) {
      localStorage.removeItem('token');
      return <Navigate to="/connexion" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/non-autorise" replace />;
    }

    return children;
  } catch (error) {
    console.error("Token invalide:", error);
    localStorage.removeItem('token');
    return <Navigate to="/connexion" replace />;
  }
};

export default ProtectedRoute;