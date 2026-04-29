import { useAuth } from '../context/AuthContext';

const hasRole = (user, allowedRoles = []) => {
  if (!user || allowedRoles.length === 0) return false;

  const role = user.rol;
  return allowedRoles.some((allowedRole) => role === allowedRole);
};

export default function RoleGuard({ allowedRoles = [], children, fallback = null }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return fallback;

  return hasRole(user, allowedRoles) ? children : fallback;
}

export { hasRole };
