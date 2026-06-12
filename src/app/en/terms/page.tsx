import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Vectorial Data",
  description: "Vectorial Data terms of service, subscription auto-renewal disclosure, and legal notices.",
};

export default function EnTermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-text-faint mb-8">Last updated: 2026-06-12</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">
          Welcome to Vectorial Data. By using our service, you agree to these terms.
        </p>

        <section>
          <h2>1. The Service</h2>
          <p>
            Vectorial Data is a publishing service that provides educational and informational
            content about stocks and investing. We publish stock selections ("picks") with
            accompanying analysis. This is NOT personalized investment advice. We operate
            under the publisher's exclusion (Section 202(a)(11)(D) of the U.S. Investment
            Advisers Act), providing impersonal, general financial information.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use this service. The service is not available
            to residents of countries subject to OFAC sanctions, including Cuba, Iran, North
            Korea, Syria, and the Crimea region.
          </p>
        </section>

        <section>
          <h2>3. Subscription &amp; Auto-Renewal (Apple In-App Purchase)</h2>
          <p>
            Vectorial Data Premium is available as an auto-renewing subscription through Apple
            In-App Purchase.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Subscription price:</strong> USD $0.99 per month.</li>
            <li>
              <strong>Auto-renewal:</strong> Your subscription automatically renews each month
              unless you cancel at least 24 hours before the end of the current billing period.
            </li>
            <li>
              <strong>Billing:</strong> Your Apple ID account will be charged for renewal within
              24 hours prior to the end of the current period.
            </li>
            <li>
              <strong>How to cancel:</strong> Manage or cancel your subscription at any time
              in your Apple ID Account Settings (Settings → [your name] → Subscriptions) or
              at settings.apple.com.
            </li>
            <li>
              <strong>No partial refunds:</strong> Cancellation takes effect at the end of the
              current billing period. No refunds are given for unused portions of a subscription
              period.
            </li>
            <li>
              <strong>Web subscriptions</strong> are processed by Stripe and can be cancelled
              at any time with no long-term contracts or cancellation fees.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Limitation of Liability</h2>
          <p>
            Vectorial Data is not liable for any investment losses. All content is provided
            "as is" without warranties of any kind. Investment decisions are solely yours.
            Past performance shown in our portfolio does not guarantee future results.
          </p>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            All research content, written materials, and visual assets are the property of
            Vectorial Data and protected by copyright. You may share links to our content but
            may not reproduce, distribute, or resell our research.
          </p>
        </section>

        <section>
          <h2>6. Governing Law</h2>
          <p>
            These terms are governed by the laws of Mexico. Any disputes will be resolved
            through arbitration.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
