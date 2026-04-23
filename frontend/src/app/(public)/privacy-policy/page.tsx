import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how StyleMart collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 1, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">1. Introduction</h2>
          <p>StyleMart (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website stylemart.in (the &ldquo;Service&rdquo;). Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">2. Information We Collect</h2>
          <p><strong>Personal Data:</strong> We collect personally identifiable information that you voluntarily provide to us when you register on the Service, place an order, subscribe to our newsletter, or contact us. This includes: name, email address, phone number, delivery address, payment information, and profile photo.</p>
          <p><strong>Usage Data:</strong> We automatically collect certain information when you access the Service, including your IP address, browser type, operating system, referring URLs, access times, and pages viewed.</p>
          <p><strong>Payment Data:</strong> Payment card information is processed directly by our payment partner Razorpay and is never stored on our servers. We retain only transaction IDs and payment status records.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processing and fulfilling your orders, including delivery and returns</li>
            <li>Sending order confirmations, shipping updates, and refund notifications</li>
            <li>Communicating about your account, security updates, and policy changes</li>
            <li>Preventing fraud, unauthorized transactions, and abuse</li>
            <li>Improving our website, products, and services through analytics</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">4. Data Retention</h2>
          <p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Order records and financial data are retained for 7 years as required by Indian tax regulations. Account data is retained until you request deletion. You may request account deletion from your profile settings, after which your data is soft-deleted and permanently purged after 30 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">5. Third-Party Sharing</h2>
          <p>We share your data only with service providers essential to operating the platform:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Razorpay</strong> — Payment processing (card data is handled entirely by Razorpay)</li>
            <li><strong>Supabase</strong> — Database hosting (your data is stored on Supabase&rsquo;s managed PostgreSQL)</li>
            <li><strong>Cloudinary</strong> — Image hosting for product photos and user avatars</li>
            <li><strong>Upstash</strong> — Redis caching and rate limiting infrastructure</li>
            <li><strong>Google</strong> — OAuth authentication (if you choose Google Sign-In)</li>
          </ul>
          <p>We never sell your personal data to third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">6. Your Rights</h2>
          <p>Under applicable Indian data protection laws, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Withdraw consent for data processing</li>
            <li>Lodge a complaint with the Data Protection Board of India</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">7. Cookies and Tracking</h2>
          <p>We use cookies for: session authentication (essential), remembering your preferences (theme, cart), and analytics. You can manage cookie preferences through our cookie consent banner. Third-party services like Razorpay may set their own cookies for payment processing.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">8. Data Security</h2>
          <p>We implement industry-standard security measures including: TLS/SSL encryption for all data in transit, bcrypt password hashing with 12 salt rounds, httpOnly/Secure/SameSite cookies for sessions, rate limiting to prevent brute-force attacks, regular security audits, and strict access controls. However, no method of transmission over the Internet is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-8 mb-3">9. Data Protection Officer</h2>
          <p>For privacy-related inquiries, contact our Data Protection Officer at: <strong>privacy@stylemart.in</strong></p>
        </section>
      </div>
    </div>
  );
}
