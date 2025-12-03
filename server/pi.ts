/**
 * Pi Network Backend Integration
 * 
 * Server-side helpers for Pi Network API calls
 */

import axios from 'axios';

const PI_API_BASE_URL = 'https://api.minepi.com/v2';

// This should be set via environment variable in production
// For now, we'll use a placeholder that developers need to replace
const PI_API_KEY = process.env.PI_API_KEY || 'YOUR_PI_API_KEY_HERE';

export interface PiUser {
  uid: string;
  username?: string;
}

export interface PiPayment {
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

/**
 * Verify a user's access token and get their Pi Network user info
 * @param accessToken - Access token from Pi.authenticate()
 * @returns User information from Pi Network
 */
export async function verifyPiUser(accessToken: string): Promise<PiUser> {
  try {
    const response = await axios.get(`${PI_API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to verify Pi user:', error);
    throw new Error('Invalid Pi Network access token');
  }
}

/**
 * Get payment information
 * @param paymentId - Payment identifier from Pi SDK
 * @returns Payment details
 */
export async function getPiPayment(paymentId: string): Promise<PiPayment> {
  try {
    const response = await axios.get(`${PI_API_BASE_URL}/payments/${paymentId}`, {
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get Pi payment:', error);
    throw new Error('Failed to retrieve payment information');
  }
}

/**
 * Approve a payment (server-side approval step)
 * @param paymentId - Payment identifier from Pi SDK
 * @returns Updated payment details
 */
export async function approvePiPayment(paymentId: string): Promise<PiPayment> {
  try {
    const response = await axios.post(
      `${PI_API_BASE_URL}/payments/${paymentId}/approve`,
      null,
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to approve Pi payment:', error);
    throw new Error('Failed to approve payment');
  }
}

/**
 * Complete a payment (final step after blockchain confirmation)
 * @param paymentId - Payment identifier from Pi SDK
 * @param txid - Transaction ID from blockchain
 * @returns Updated payment details
 */
export async function completePiPayment(paymentId: string, txid: string): Promise<PiPayment> {
  try {
    const response = await axios.post(
      `${PI_API_BASE_URL}/payments/${paymentId}/complete`,
      { txid },
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to complete Pi payment:', error);
    throw new Error('Failed to complete payment');
  }
}

/**
 * Check if Pi API key is configured
 */
export function isPiConfigured(): boolean {
  return PI_API_KEY !== 'YOUR_PI_API_KEY_HERE' && PI_API_KEY.length > 0;
}
