import { Html, Head, Body, Container, Section, Text, Button, Heading } from "@react-email/components";
import * as React from "react";

interface AccountSuspendedEmailProps {
  customerName: string;
  reason?: string;
  supportEmail: string;
}

export function AccountSuspendedEmail({ customerName, reason, supportEmail }: AccountSuspendedEmailProps) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Inter, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", padding: "32px 40px", textAlign: "center" }}>
            <Heading style={{ color: "#fff", fontSize: "28px", margin: "0 0 4px" }}>StyleMart</Heading>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", margin: 0 }}>Account Suspended</Text>
          </Section>
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ fontSize: "18px", fontWeight: "600", color: "#1a1a2e", margin: "0 0 12px" }}>Hi {customerName},</Text>
            <Text style={{ fontSize: "15px", color: "#4a4a68", lineHeight: "1.6", margin: "0 0 20px" }}>
              We regret to inform you that your StyleMart account has been temporarily suspended.
            </Text>
            {reason && (
              <Section style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "16px", margin: "0 0 20px" }}>
                <Text style={{ fontSize: "14px", color: "#7f1d1d", margin: "0" }}><strong>Reason:</strong> {reason}</Text>
              </Section>
            )}
            <Text style={{ fontSize: "15px", color: "#4a4a68", lineHeight: "1.6", margin: "0 0 20px" }}>
              If you believe this is a mistake or would like to appeal this decision, please contact our support team at{" "}
              <a href={`mailto:${supportEmail}`} style={{ color: "#4f46e5" }}>{supportEmail}</a>.
            </Text>
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              <Button style={{ backgroundColor: "#4f46e5", color: "#fff", padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "600" }} href={`mailto:${supportEmail}`}>
                Contact Support
              </Button>
            </Section>
          </Section>
          <Section style={{ backgroundColor: "#f6f9fc", padding: "24px 40px", textAlign: "center" }}>
            <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0" }}>© {new Date().getFullYear()} StyleMart. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
export default AccountSuspendedEmail;
