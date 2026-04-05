import Link from "next/link";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-primary-foreground/80 mt-2 font-medium">
            Effective Date: April 1, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <p className="text-base leading-relaxed">
              Welcome to My Third Place. By accessing or using our platform, you agree to be bound by these Terms of
              Service. Please read them carefully. If you do not agree, do not use the platform.
            </p>
          </section>

          {/* 1. Acceptance */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">1. Acceptance of Terms</h2>
            <p className="text-base leading-relaxed">
              By creating an account or using any part of My Third Place, you confirm that you are at least 18 years
              old, have read and understood these Terms, and agree to be legally bound by them. These Terms constitute
              a binding agreement between you and My Third Place.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">2. Description of Service</h2>
            <p className="text-base leading-relaxed mb-3">
              My Third Place is a community platform that allows users to:
            </p>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Discover and join local community spaces
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Browse, register for, and host community events
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Participate in community discussions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Connect with people who share local interests
              </li>
            </ul>
            <p className="text-base leading-relaxed mt-3">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time with
              reasonable notice.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">3. User Accounts</h2>
            <p className="text-base leading-relaxed mb-3">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activity that occurs under your account. You agree to:
            </p>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Provide accurate and complete registration information
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Keep your password secure and not share it with others
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Notify us immediately of any unauthorized account access
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Not create multiple accounts to circumvent bans or restrictions
              </li>
            </ul>
          </section>

          {/* 4. Community Guidelines */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">4. Community Guidelines</h2>
            <p className="text-base leading-relaxed mb-3">
              My Third Place is built on respect and belonging. All users must:
            </p>
            <ul className="space-y-2 text-base mb-3">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Treat other members with respect and dignity
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Not post hateful, discriminatory, or harassing content
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Not spam, solicit, or send unsolicited commercial messages
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Not impersonate other users or public figures
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-primary border border-foreground flex-shrink-0" />
                Not share false or misleading information about events or spaces
              </li>
            </ul>
            <p className="text-base leading-relaxed">
              Violations may result in content removal, account suspension, or permanent bans at our discretion.
            </p>
          </section>

          {/* 5. Content Ownership */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">5. Content Ownership & License</h2>
            <p className="text-base leading-relaxed mb-3">
              You retain ownership of any content you submit to the platform, including event descriptions,
              discussion posts, and profile information. By posting content, you grant My Third Place a
              non-exclusive, royalty-free, worldwide license to use, display, and distribute that content
              solely for the purpose of operating and improving the platform.
            </p>
            <p className="text-base leading-relaxed">
              You represent that you have all necessary rights to the content you post and that it does not
              infringe any third-party rights.
            </p>
          </section>

          {/* 6. Event Registration */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">6. Event Registration</h2>
            <p className="text-base leading-relaxed mb-3">
              When registering for events on My Third Place:
            </p>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Event details are provided by organizers and we cannot guarantee accuracy
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Refund and cancellation policies are set by individual event organizers
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                We are not responsible for event cancellations or changes made by organizers
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-accent border border-foreground flex-shrink-0" />
                Any payments are processed through our payment provider and subject to their terms
              </li>
            </ul>
          </section>

          {/* 7. Referral Program */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">7. Referral Program</h2>
            <p className="text-base leading-relaxed">
              My Third Place may offer a referral program from time to time. Referral benefits are subject to change
              and may be revoked if we detect abuse, including generating fraudulent accounts or referrals. We reserve
              the right to modify or discontinue the referral program at any time. Referral rewards have no cash value
              unless explicitly stated.
            </p>
          </section>

          {/* 8. Prohibited Conduct */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">8. Prohibited Conduct</h2>
            <p className="text-base leading-relaxed mb-3">You may not:</p>
            <ul className="space-y-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-destructive border border-foreground flex-shrink-0" />
                Use the platform for any unlawful purpose
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-destructive border border-foreground flex-shrink-0" />
                Scrape, crawl, or systematically extract data from the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-destructive border border-foreground flex-shrink-0" />
                Interfere with the security or integrity of the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-destructive border border-foreground flex-shrink-0" />
                Attempt to gain unauthorized access to any system or data
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 bg-destructive border border-foreground flex-shrink-0" />
                Transmit viruses, malware, or other harmful code
              </li>
            </ul>
          </section>

          {/* 9. Termination */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">9. Termination</h2>
            <p className="text-base leading-relaxed">
              We may suspend or terminate your account at any time, with or without notice, for conduct that we
              believe violates these Terms or is harmful to other users, us, or third parties. You may delete your
              account at any time by contacting us. Upon termination, your right to use the platform ceases
              immediately.
            </p>
          </section>

          {/* 10. Disclaimers */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">10. Disclaimers & Limitation of Liability</h2>
            <p className="text-base leading-relaxed mb-3">
              The platform is provided &quot;as is&quot; without warranties of any kind. We do not warrant that the platform
              will be uninterrupted, error-free, or free of harmful components.
            </p>
            <p className="text-base leading-relaxed">
              To the maximum extent permitted by law, My Third Place shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the platform, including
              damages resulting from events organised through the platform.
            </p>
          </section>

          {/* 11. Governing Law */}
          <section className="border-2 border-foreground bg-background p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">11. Governing Law</h2>
            <p className="text-base leading-relaxed">
              These Terms are governed by the laws of India. Any disputes arising under these Terms shall be
              subject to the exclusive jurisdiction of the courts located in India.
            </p>
          </section>

          {/* 12. Contact */}
          <section className="border-2 border-foreground bg-accent p-6 shadow-brutal">
            <h2 className="text-xl font-extrabold uppercase tracking-wider mb-3">12. Contact Us</h2>
            <p className="text-base leading-relaxed">
              If you have questions about these Terms, please contact us at{" "}
              <a
                href="mailto:hello@rapchai.com"
                className="font-bold underline hover:text-primary"
              >
                hello@rapchai.com
              </a>
            </p>
          </section>

          {/* Footer nav */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/privacy"
              className="text-sm font-bold uppercase tracking-wider underline hover:text-primary"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
