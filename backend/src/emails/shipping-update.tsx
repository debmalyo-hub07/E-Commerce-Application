import { Html, Head, Body, Container, Section, Text, Button, Hr, Heading } from "@react-email/components";
import * as React from "react";

interface ShippingUpdateEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export function ShippingUpdateEmail({ customerName, orderNumber, trackingNumber, carrier, estimatedDelivery, trackingUrl }: ShippingUpdateEmailProps) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", padding: "32px 40px", textAlign: "center" }}>
            <Heading style={{ color: "#fff", fontSize: "28px", margin: "0 0 4px" }}>NexMart</Heading>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", margin: 0 }}>Your Order is On Its Way! 🚚</Text>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: "18px", fontWeight: "600", color: "#1a1a2e", margin: "0 0 12px" }}>Hi {customerName},</Text>
            <Text style={{ fontSize: "15px", color: "#4a4a68", lineHeight: "1.6", margin: "0 0 20px" }}>
              Your order <strong>{orderNumber}</strong> has been shipped and is on its way to you!
            </Text>
            {trackingNumber && (
              <Section style={{ backgroundColor: "#f0f9ff", borderRadius: "8px", padding: "16px", margin: "0 0 20px" }}>
                <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0ea5e9", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0" }}>TRACKING NUMBER</Text>
                <Text style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a2e", margin: "4px 0 0" }}>{trackingNumber}</Text>
                {carrier && <Text style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>via {carrier}</Text>}
              </Section>
            )}
            {estimatedDelivery && (
              <Text style={{ fontSize: "15px", color: "#4a4a68", margin: "0 0 20px" }}>
                📅 <strong>Estimated Delivery:</strong> {estimatedDelivery}
              </Text>
            )}
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              {trackingUrl ? (
                <Button style={{ backgroundColor: "#0ea5e9", color: "#fff", padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "600" }} href={trackingUrl}>
                  Track Live Location →
                </Button>
              ) : (
                <Button style={{ backgroundColor: "#4f46e5", color: "#fff", padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "600" }} href={`${process.env.APP_URL}/account/orders`}>
                  View Order →
                </Button>
              )}
            </Section>
          </Section>
          <Section style={{ backgroundColor: "#f6f9fc", padding: "24px 40px", textAlign: "center" }}>
            <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0" }}>© {new Date().getFullYear()} NexMart. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
export default ShippingUpdateEmail;
