import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back nav */}
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-block border-2 border-foreground bg-background px-4 py-2 text-sm font-bold uppercase tracking-wider shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150"
          >
            ← Back to Home
          </Link>
        </nav>

        {/* Header */}
        <div className="border-2 border-foreground bg-primary p-6 shadow-brutal-lg mb-8">
          <h1 className="text-4xl font-extrabold uppercase tracking-wider text-primary-foreground">
            Privacy Policy
          </h1>
          <p className="text-primary-foreground/80 mt-2 font-medium">
            Effective Date: April 1, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <p className="text-base leading-relaxed">
              My Third Place (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when you use our community platform.
              By using My Third Place, you agree to the practices described in this policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">1. Information We Collect</h2>
            <p className="text-base font-bold mb-2">Information you provide directly:</p>
            <ul className="space-y-2 text-base mb-4">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Email address and display name (when you create an account)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Profile information you choose to add
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Content you post in discussions or event listings
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Event registration details (name, contact info for RSVP)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Referral codes you enter or share
              </li>
            </ul>
            <p className="text-base font-bold mb-2">Information collected automatically:</p>
            <ul className="space-y-2 text-base mb-4">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Device and browser type, operating system
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Pages visited, features used, and time spent on the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                IP address and approximate location (city-level)
              </li>
            </ul>
            <p className="text-base font-bold mb-2">Information from third-party sign-in (Google OAuth):</p>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-secondary border border-foreground flex-shrink-0" />
                Name, email address, and profile picture from your Google account
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-secondary border border-foreground flex-shrink-0" />
                We do not receive your Google password
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">2. How We Use Your Information</h2>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To create and manage your account
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To provide access to communities, events, and discussions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To send event confirmation emails and platform notifications (if opted in)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To personalise your experience (recommended events, communities)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To track platform usage for product improvements via Google Analytics (GTM)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To process referrals and apply associated benefits
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                To detect and prevent fraud, abuse, and security incidents
              </li>
            </ul>
          </section>

          {/* 3. Sharing */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">3. Information Sharing</h2>
            <p className="text-base leading-relaxed mb-3">
              We do not sell your personal information. We share your data only in the following limited circumstances:
            </p>
            <ul className="space-y-2 text-base mb-3">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                <span><strong>Supabase</strong> — our database and authentication provider, which stores your account data securely</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                <span><strong>Google (GTM/Analytics)</strong> — anonymised usage analytics to understand platform behaviour</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                <span><strong>Payment processors</strong> — only when you make a payment for a paid event (we do not store card details)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                <span><strong>Event organisers</strong> — your registration information is shared with the organiser of events you register for</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                <span><strong>Legal requirements</strong> — if required by law or to protect our legal rights</span>
              </li>
            </ul>
          </section>

          {/* 4. Cookies */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">4. Cookies & Tracking</h2>
            <p className="text-base leading-relaxed mb-3">
              We use the following types of cookies and tracking technologies:
            </p>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                <span><strong>Authentication cookies</strong> — essential for keeping you signed in (provided by Supabase)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                <span><strong>Preference cookies</strong> — store your theme preference (light/dark mode)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                <span><strong>Analytics (Google Tag Manager)</strong> — collects anonymised data about how you use the platform to help us improve it</span>
              </li>
            </ul>
          </section>

          {/* 5. Data Retention */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">5. Data Retention</h2>
            <p className="text-base leading-relaxed">
              We retain your account information for as long as your account is active or as needed to provide our
              services. If you delete your account, we will delete or anonymise your personal information within 30
              days, except where we are required to retain it for legal, fraud-prevention, or accounting purposes.
              Content you have posted (discussions, event listings) may persist in anonymised form.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">6. Your Rights</h2>
            <p className="text-base leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="space-y-2 text-base mb-3">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Access the personal information we hold about you
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Correct inaccurate or incomplete information
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Request deletion of your account and personal data
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Opt out of non-essential communications
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Object to processing of your data for analytics purposes
              </li>
            </ul>
            <p className="text-base leading-relaxed">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:hello@mythirdplace.in" className="font-bold underline hover:text-primary">
                hello@mythirdplace.in
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* 7. Security */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">7. Security</h2>
            <p className="text-base leading-relaxed">
              We use industry-standard security measures to protect your data, including encrypted data transmission
              (HTTPS), secure authentication via Supabase, and access controls limiting who can access your data.
              However, no method of transmission over the internet is 100% secure. We encourage you to use a strong,
              unique password and to sign out when using shared devices.
            </p>
          </section>

          {/* 8. Changes */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">8. Changes to This Policy</h2>
            <p className="text-base leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting a notice on the platform or by email. Your continued use of My Third Place after any changes
              indicates your acceptance of the updated policy. The &quot;Effective Date&quot; at the top of this page shows
              when the policy was last updated.
            </p>
          </section>

          {/* 9. Contact */}
          <section className="border-2 border-foreground bg-accent p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">9. Contact Us</h2>
            <p className="text-base leading-relaxed">
              If you have questions or concerns about this Privacy Policy or how we handle your data, please
              contact us at{" "}
              <a
                href="mailto:hello@mythirdplace.in"
                className="font-bold underline hover:text-primary"
              >
                hello@mythirdplace.in
              </a>
            </p>
          </section>

          {/* Footer nav */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/terms"
              className="text-sm font-bold uppercase tracking-wider underline hover:text-primary"
            >
              ← Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
