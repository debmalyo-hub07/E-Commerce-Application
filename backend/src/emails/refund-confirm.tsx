import { Html, Head, Body, Container, Section, Text, Button, Hr, Heading } from "@react-email/components";
import * as React from "react";

interface RefundConfirmEmailProps {
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  refundMethod: string;
  processingDays: number;
}

export function RefundConfirmEmail({ customerName, orderNumber, refundAmount, refundMethod, processingDays }: RefundConfirmEmailProps) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "32px 40px", textAlign: "center" }}>
            <Heading style={{ color: "#fff", fontSize: "28px", margin: "0 0 4px" }}>NexMart</Heading>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", margin: 0 }}>Refund Initiated ✓</Text>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: "18px", fontWeight: "600", color: "#1a1a2e", margin: "0 0 12px" }}>Hi {customerName},</Text>
            <Text style={{ fontSize: "15px", color: "#4a4a68", lineHeight: "1.6", margin: "0 0 20px" }}>
              Your refund for order <strong>{orderNumber}</strong> has been initiated. Here are the details:
            </Text>
            <Section style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "20px", margin: "0 0 20px" }}>
              <Text style={{ fontSize: "14px", color: "#065f46", margin: "0 0 8px" }}>💰 <strong>Refund Amount:</strong> ₹{refundAmount.toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: "14px", color: "#065f46", margin: "0 0 8px" }}>💳 <strong>Refund to:</strong> {refundMethod}</Text>
              <Text style={{ fontSize: "14px", color: "#065f46", margin: "0" }}>📅 <strong>Processing Time:</strong> {processingDays}–7 business days</Text>
            </Section>
            <Text style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6", margin: "0 0 20px" }}>
              Once processed, the refund will appear in your account within the stated period depending on your bank.
            </Text>
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              <Button style={{ backgroundColor: "#10b981", color: "#fff", padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "600" }} href={`${process.env.APP_URL}/account/orders`}>
                View Order →
              </Button>
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
export default RefundConfirmEmail;
