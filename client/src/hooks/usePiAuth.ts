/**
 * React hook for Pi Network authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { authenticateWithPi, isPiSDKAvailable, type AuthResult, type Payment } from '@/lib/pi';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function usePiAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [piUser, setPiUser] = useState<AuthResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkAvailable, setSdkAvailable] = useState(false);

  const verifyUserMutation = trpc.pi.verifyUser.useMutation();
  const { data: piConfig } = trpc.pi.isConfigured.useQuery();

  // Check if Pi SDK is available
  useEffect(() => {
    const checkSDK = () => {
      const available = isPiSDKAvailable();
      setSdkAvailable(available);
      
      if (!available) {
        console.warn('Pi SDK not available - make sure you are running in Pi Browser');
        setIsLoading(false);
      }
    };

    // Check immediately
    checkSDK();

    // Check again after a short delay in case SDK is still loading
    const timer = setTimeout(checkSDK, 1000);

    return () => clearTimeout(timer);
  }, []);

  const authenticate = useCallback(async () => {
    if (!sdkAvailable) {
      toast.error('Pi SDK not available. Please open this app in Pi Browser.');
      return false;
    }

    if (!piConfig?.configured) {
      toast.error('Pi Network integration not configured. Please contact support.');
      return false;
    }

    try {
      setIsLoading(true);

      // Handle incomplete payments
      const handleIncompletePayment = (payment: Payment) => {
        console.warn('Incomplete payment found:', payment);
        toast.warning('You have an incomplete payment. Please complete it to continue.');
      };

      // Authenticate with Pi Network
      const auth = await authenticateWithPi(['username', 'payments'], handleIncompletePayment);
      setPiUser(auth);

      // Verify user on backend and create/update user record
      const result = await verifyUserMutation.mutateAsync({
        accessToken: auth.accessToken,
        username: auth.user.username,
      });

      if (result.success) {
        setIsAuthenticated(true);
        toast.success(`Welcome, ${auth.user.username || 'Pioneer'}!`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error('Failed to authenticate with Pi Network');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sdkAvailable, piConfig, verifyUserMutation]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setPiUser(null);
  }, []);

  return {
    isAuthenticated,
    piUser,
    isLoading,
    sdkAvailable,
    piConfigured: piConfig?.configured ?? false,
    authenticate,
    logout,
  };
}
