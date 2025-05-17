import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedContent({ 
  children, 
  allowedRoles,
  fallback = null 
}) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return fallback;
  }

  return children;
}