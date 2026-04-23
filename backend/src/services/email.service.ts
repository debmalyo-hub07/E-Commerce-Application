import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import { OrderConfirmEmail } from "../emails/order-confirm";
import { ShippingUpdateEmail } from "../emails/shipping-update";
import { RefundConfirmEmail } from "../emails/refund-confirm";
import { AccountSuspendedEmail } from "../emails/account-suspended";

// ── SMTP Transporter ─────────────────────────────────────────

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });

const globalForEmail = globalThis as unknown as {
  smtpTransporter: nodemailer.Transporter;
};
const transporter: nodemailer.Transporter =
  globalForEmail.smtpTransporter ?? createTransporter();

if (process.env.NODE_ENV !== "production") {
  globalForEmail.smtpTransporter = transporter;
}

// ── Core Send Function ────────────────────────────────────────

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const from = process.env.SMTP_FROM ?? "StyleMart <noreply@stylemart.in>";

  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

// ── Email Service Helpers ─────────────────────────────────────

export interface OrderConfirmEmailProps {
  customerName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  total: number;
  shippingAddress: string;
  estimatedDelivery?: string;
}

export interface ShippingUpdateEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export interface RefundConfirmEmailProps {
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  refundMethod: string;
  processingDays: number;
}

export interface AccountSuspendedEmailProps {
  customerName: string;
  reason?: string;
  supportEmail: string;
}

export const emailService = {
  async sendOrderConfirmation(
    to: string,
    props: OrderConfirmEmailProps
  ): Promise<void> {
    const html = await render(OrderConfirmEmail(props));
    await sendEmail({
      to,
      subject: `Order Confirmed: ${props.orderNumber} — StyleMart`,
      html,
    });
  },

  async sendShippingUpdate(
    to: string,
    props: ShippingUpdateEmailProps
  ): Promise<void> {
    const html = await render(ShippingUpdateEmail(props));
    await sendEmail({
      to,
      subject: `Your order ${props.orderNumber} has been shipped — StyleMart`,
      html,
    });
  },

  async sendRefundConfirmation(
    to: string,
    props: RefundConfirmEmailProps
  ): Promise<void> {
    const html = await render(RefundConfirmEmail(props));
    await sendEmail({
      to,
      subject: `Refund Initiated for ${props.orderNumber} — StyleMart`,
      html,
    });
  },

  async sendAccountSuspended(
    to: string,
    props: AccountSuspendedEmailProps
  ): Promise<void> {
    const html = await render(AccountSuspendedEmail(props));
    await sendEmail({
      to,
      subject: "Important Notice: Your StyleMart Account Has Been Suspended",
      html,
    });
  },

  /** Raw send for custom emails */
  async sendRaw(params: SendEmailParams): Promise<void> {
    await sendEmail(params);
  },
};
