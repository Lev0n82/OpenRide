/**
 * React hook for Pi Network payments
 */

import { useState, useCallback } from 'react';
import { createPiPayment, type Payment, type PaymentCallbacks } from '@/lib/pi';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface UsePiPaymentOptions {
  onSuccess?: (payment: Payment) => void;
  onError?: (error: Error) => void;
}

export function usePiPayment(options?: UsePiPaymentOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);

  const approvePaymentMutation = trpc.pi.approvePayment.useMutation();
  const completePaymentMutation = trpc.pi.completePayment.useMutation();

  const createPayment = useCallback(async (
    amount: number,
    memo: string,
    metadata: Record<string, any>
  ): Promise<Payment | null> => {
    try {
      setIsProcessing(true);

      const callbacks: PaymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('Payment ready for server approval:', paymentId);
          toast.loading('Approving payment...', { id: 'pi-payment' });
          
          try {
            await approvePaymentMutation.mutateAsync({
              paymentId,
              rideId: metadata.rideId,
            });
            toast.success('Payment approved!', { id: 'pi-payment' });
          } catch (error) {
            console.error('Failed to approve payment:', error);
            toast.error('Failed to approve payment', { id: 'pi-payment' });
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('Payment ready for completion:', paymentId, txid);
          toast.loading('Completing payment...', { id: 'pi-payment' });
          
          try {
            const result = await completePaymentMutation.mutateAsync({
              paymentId,
              txid,
              rideId: metadata.rideId,
              amount,
            });
            
            toast.success(`Payment completed! You earned ${result.rideTokensAwarded} RIDE tokens!`, { 
              id: 'pi-payment' 
            });
            
            if (options?.onSuccess && currentPayment) {
              options.onSuccess(currentPayment);
            }
          } catch (error) {
            console.error('Failed to complete payment:', error);
            toast.error('Failed to complete payment', { id: 'pi-payment' });
          }
        },

        onCancel: (paymentId: string) => {
          console.log('Payment cancelled:', paymentId);
          toast.error('Payment cancelled', { id: 'pi-payment' });
          setIsProcessing(false);
          setCurrentPayment(null);
        },

        onError: (error: Error, payment?: Payment) => {
          console.error('Payment error:', error, payment);
          toast.error(`Payment error: ${error.message}`, { id: 'pi-payment' });
          setIsProcessing(false);
          setCurrentPayment(null);
          
          if (options?.onError) {
            options.onError(error);
          }
        },
      };

      const payment = await createPiPayment(amount, memo, metadata, callbacks);
      setCurrentPayment(payment);
      return payment;
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error('Failed to create payment');
      setIsProcessing(false);
      return null;
    }
  }, [approvePaymentMutation, completePaymentMutation, currentPayment, options]);

  return {
    createPayment,
    isProcessing,
    currentPayment,
  };
}
