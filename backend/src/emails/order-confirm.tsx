import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Img, Row, Column, Heading,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmEmailProps {
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>;
  total: number;
  shippingAddress: string;
  estimatedDelivery?: string;
}

export function OrderConfirmEmail({
  customerName,
  orderNumber,
  items,
  total,
  shippingAddress,
  estimatedDelivery,
}: OrderConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>StyleMart</Heading>
            <Text style={tagline}>Order Confirmed ✓</Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Great news! Your order has been confirmed and is being prepared. Here's a summary of what's happening.
            </Text>

            {/* Order Number */}
            <Section style={orderBox}>
              <Text style={orderLabel}>ORDER NUMBER</Text>
              <Text style={orderNum}>{orderNumber}</Text>
            </Section>

            <Hr style={divider} />

            {/* Items */}
            <Text style={sectionTitle}>Your Items</Text>
            {items.map((item, idx) => (
              <Row key={idx} style={itemRow}>
                <Column style={itemInfo}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemMeta}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPrice}>
                  <Text style={priceText}>
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={divider} />

            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Total Amount</Text>
              </Column>
              <Column>
                <Text style={totalValue}>₹{total.toLocaleString("en-IN")}</Text>
              </Column>
            </Row>

            <Hr style={divider} />

            {/* Delivery Info */}
            <Text style={sectionTitle}>Delivery Address</Text>
            <Text style={addressText}>{shippingAddress}</Text>

            {estimatedDelivery && (
              <>
                <Text style={sectionTitle}>Estimated Delivery</Text>
                <Text style={paragraph}>{estimatedDelivery}</Text>
              </>
            )}

            <Section style={ctaSection}>
              <Button style={ctaButton} href={`${process.env.APP_URL}/account/orders`}>
                Track Your Order →
              </Button>
            </Section>

            <Text style={paragraph}>
              If you have any questions, reply to this email or contact us at{" "}
              <a href="mailto:support@stylemart.in">support@stylemart.in</a>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>© {new Date().getFullYear()} StyleMart. All rights reserved.</Text>
            <Text style={footerText}>
              <a href={`${process.env.APP_URL}/privacy-policy`} style={footerLink}>Privacy Policy</a>
              {" · "}
              <a href={`${process.env.APP_URL}/terms`} style={footerLink}>Terms of Service</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmEmail;

// ── Styles ────────────────────────────────────────────────────

const body: React.CSSProperties = { backgroundColor: "#f6f9fc", fontFamily: "Inter, Arial, sans-serif" };
const container: React.CSSProperties = { maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden" };
const header: React.CSSProperties = { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "32px 40px", textAlign: "center" };
const logo: React.CSSProperties = { color: "#ffffff", fontSize: "28px", fontWeight: "700", margin: "0 0 4px" };
const tagline: React.CSSProperties = { color: "rgba(255,255,255,0.85)", fontSize: "16px", margin: "0" };
const content: React.CSSProperties = { padding: "32px 40px" };
const greeting: React.CSSProperties = { fontSize: "18px", fontWeight: "600", color: "#1a1a2e", margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", color: "#4a4a68", lineHeight: "1.6", margin: "0 0 16px" };
const orderBox: React.CSSProperties = { backgroundColor: "#f0f4ff", borderRadius: "8px", padding: "16px", textAlign: "center", margin: "16px 0" };
const orderLabel: React.CSSProperties = { fontSize: "12px", fontWeight: "600", color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0" };
const orderNum: React.CSSProperties = { fontSize: "22px", fontWeight: "700", color: "#1a1a2e", margin: "4px 0 0" };
const divider: React.CSSProperties = { borderColor: "#e8e8f0", margin: "20px 0" };
const sectionTitle: React.CSSProperties = { fontSize: "14px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" };
const itemRow: React.CSSProperties = { marginBottom: "8px" };
const itemInfo: React.CSSProperties = { width: "70%" };
const itemName: React.CSSProperties = { fontSize: "15px", fontWeight: "500", color: "#1a1a2e", margin: "0 0 2px" };
const itemMeta: React.CSSProperties = { fontSize: "13px", color: "#6b7280", margin: "0" };
const itemPrice: React.CSSProperties = { width: "30%", textAlign: "right" };
const priceText: React.CSSProperties = { fontSize: "15px", color: "#1a1a2e", margin: "0" };
const totalRow: React.CSSProperties = { marginTop: "8px" };
const totalLabel: React.CSSProperties = { fontSize: "16px", fontWeight: "600", color: "#1a1a2e", margin: "0" };
const totalValue: React.CSSProperties = { fontSize: "20px", fontWeight: "700", color: "#4f46e5", margin: "0", textAlign: "right" };
const addressText: React.CSSProperties = { fontSize: "14px", color: "#4a4a68", lineHeight: "1.6", margin: "0 0 16px" };
const ctaSection: React.CSSProperties = { textAlign: "center", margin: "28px 0" };
const ctaButton: React.CSSProperties = { backgroundColor: "#4f46e5", color: "#ffffff", padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer: React.CSSProperties = { backgroundColor: "#f6f9fc", padding: "24px 40px", textAlign: "center" };
const footerText: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", margin: "4px 0" };
const footerLink: React.CSSProperties = { color: "#6366f1", textDecoration: "none" };
