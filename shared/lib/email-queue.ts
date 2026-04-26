/**
 * Email Queue Type Definitions & Dynamic Imports
 *
 * This module provides type definitions and runtime access to email queue functions.
 * The actual implementations are in backend/src/jobs/email.queue.ts
 * Frontend API routes use the dynamic import functions to avoid static cross-workspace imports.
 */

export interface OrderConfirmJobData {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>;
  total: number;
  shippingAddress: string;
}

export interface ShippingUpdateJobData {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export interface RefundJobData {
  to: string;
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  refundMethod: string;
}

export interface AccountSuspendedJobData {
  to: string;
  customerName: string;
  reason?: string;
}

export interface EmailQueueFunctions {
  enqueueOrderConfirmEmail(data: OrderConfirmJobData): Promise<any>;
  enqueueShippingUpdateEmail(data: ShippingUpdateJobData): Promise<any>;
  enqueueRefundEmail(data: RefundJobData): Promise<any>;
  enqueueAccountSuspendedEmail(data: AccountSuspendedJobData): Promise<any>;
}

/** Dynamic import of email queue functions from backend */
export async function getEmailQueueFunctions(): Promise<EmailQueueFunctions> {
  const {
    enqueueOrderConfirmEmail,
    enqueueShippingUpdateEmail,
    enqueueRefundEmail,
    enqueueAccountSuspendedEmail,
  } = await import("../../backend/src/jobs/email.queue");

  return {
    enqueueOrderConfirmEmail,
    enqueueShippingUpdateEmail,
    enqueueRefundEmail,
    enqueueAccountSuspendedEmail,
  };
}


