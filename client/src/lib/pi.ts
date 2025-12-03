/**
 * Pi Network SDK Integration
 * 
 * This module provides a typed interface to the Pi Network SDK
 * loaded via script tag in index.html
 */

export interface PiUser {
  uid: string;
  username?: string;
}

export interface AuthResult {
  accessToken: string;
  user: PiUser;
}

export interface PaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

export interface Payment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  to_address: string;
  created_at: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: Payment) => void;
}

export interface PiSDK {
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: Payment) => void
  ) => Promise<AuthResult>;
  
  createPayment: (
    paymentData: PaymentData,
    callbacks: PaymentCallbacks
  ) => Promise<Payment>;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

/**
 * Get the Pi SDK instance
 * Throws if SDK is not loaded
 */
export function getPiSDK(): PiSDK {
  if (!window.Pi) {
    throw new Error('Pi SDK not loaded. Make sure the script tag is included in index.html');
  }
  return window.Pi;
}

/**
 * Check if Pi SDK is available
 */
export function isPiSDKAvailable(): boolean {
  return typeof window.Pi !== 'undefined';
}

/**
 * Authenticate with Pi Network
 * @param scopes - Array of permission scopes (e.g., ['username', 'payments'])
 * @param onIncompletePayment - Callback for incomplete payments
 */
export async function authenticateWithPi(
  scopes: string[] = ['username', 'payments'],
  onIncompletePayment?: (payment: Payment) => void
): Promise<AuthResult> {
  const pi = getPiSDK();
  
  const handleIncompletePayment = onIncompletePayment || ((payment: Payment) => {
    console.warn('Incomplete payment found:', payment);
  });
  
  return pi.authenticate(scopes, handleIncompletePayment);
}

/**
 * Create a payment in Pi Network
 * @param amount - Amount in Pi
 * @param memo - Payment description
 * @param metadata - Additional payment metadata
 * @param callbacks - Payment lifecycle callbacks
 */
export async function createPiPayment(
  amount: number,
  memo: string,
  metadata: Record<string, any>,
  callbacks: PaymentCallbacks
): Promise<Payment> {
  const pi = getPiSDK();
  
  const paymentData: PaymentData = {
    amount,
    memo,
    metadata,
  };
  
  return pi.createPayment(paymentData, callbacks);
}
