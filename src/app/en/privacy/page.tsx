import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Vectorial Data",
  description: "Vectorial Data privacy policy — what data we collect and how we use it.",
  alternates: { canonical: "https://vectorialdata.com/en/privacy" },
};

export default function EnPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-faint mb-8">Last updated: 2026-06-12</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">
          Your privacy matters to us. This policy explains what data we collect and how we use it.
        </p>

        <section>
          <h2>1. Data We Collect</h2>
          <p>
            Email address (for authentication, communication, and pick delivery), payment
            information (processed by Stripe or Apple — we never store card data), and
            usage data (page visit analytics).
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <p>
            To deliver the service (picks, dashboard access), communicate with you about your
            subscription, and improve our service through aggregated analytics.
          </p>
        </section>

        <section>
          <h2>3. Third Parties</h2>
          <p>
            We share data with: Apple (In-App Purchase processing), Stripe (web payment
            processing), Supabase (database and authentication), Vercel (hosting), and
            Resend (email delivery). Each provider has their own privacy policy.
          </p>
        </section>

        <section>
          <h2>4. Data Retention</h2>
          <p>
            We retain your data while your subscription is active. If you cancel, we delete
            your personal data within 30 days, except as required by law.
          </p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-3">
            <li>Access, correct, or delete your personal data (GDPR — EU/EEA)</li>
            <li>Request data portability (LGPD — Brazil)</li>
            <li>Opt out of data sales (CCPA — California)</li>
            <li>Request data deletion (DPDP — India)</li>
          </ul>
          <p className="mt-3">
            Contact{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>{" "}
            to exercise these rights.
          </p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            We use essential cookies for functionality (authentication, language preferences).
            We do not use third-party tracking cookies for advertising purposes.
          </p>
        </section>

        <section>
          <h2>7. Children</h2>
          <p>
            Our service is not intended for anyone under 18 years of age. We do not knowingly
            collect data from minors.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            For privacy questions:{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
