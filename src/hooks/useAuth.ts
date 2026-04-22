import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * useAuth — hook de autenticação para usar em qualquer componente.
 *
 * @example
 * const { user, profile, signIn, signOut, isLoading } = useAuth();
 */
export const useAuth = () => {
  const auth = useAuthContext();
  return auth;
};
