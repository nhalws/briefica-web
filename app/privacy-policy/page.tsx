"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <Image
            src="/logo_6.png"
            alt="briefica"
            width={140}
            height={42}
            className="object-contain"
          />
        </div>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/70 mb-8">Effective Date: January 10, 2026</p>

          <div className="space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p>
                Welcome to briefica ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1 Account Information</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Email address:</strong> Used for authentication and account recovery</li>
                <li><strong>Username:</strong> Your public identifier on the platform</li>
                <li><strong>Password:</strong> Encrypted using bcrypt (never stored in plaintext)</li>
                <li><strong>Law school:</strong> Optional, used for school community features</li>
                <li><strong>Bio:</strong> Optional profile information</li>
                <li><strong>Profile picture:</strong> Optional, stored securely</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.2 Content You Create</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Artifacts:</strong> Files you upload (.bset, .bmod, .tbank)</li>
                <li><strong>Metadata:</strong> Titles, descriptions, visibility settings</li>
                <li><strong>Subject preferences:</strong> Up to 3 subjects you're interested in</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.3 Activity Data</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Interactions:</strong> Likes, downloads, shares</li>
                <li><strong>Friend connections:</strong> Friend requests and accepted friendships</li>
                <li><strong>Chat messages:</strong> Messages sent in community chats</li>
                <li><strong>Usage timestamps:</strong> When you create or interact with content</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.4 Technical Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>IP address:</strong> Collected by our infrastructure providers</li>
                <li><strong>Device information:</strong> Browser type, operating system</li>
                <li><strong>Usage analytics:</strong> How you navigate and use the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain the briefica platform</li>
                <li>To authenticate your identity and secure your account</li>
                <li>To enable social features (friends, school communities, chat)</li>
                <li>To display your public profile and content</li>
                <li>To send important service updates (via email)</li>
                <li>To improve our services and develop new features</li>
                <li>To prevent fraud, abuse, and ensure platform security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Storage and Security</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1 Where Your Data is Stored</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Supabase (PostgreSQL):</strong> User accounts, profiles, artifact metadata, relationships</li>
                <li><strong>Supabase Storage:</strong> Uploaded files (.bset, .bmod, .tbank)</li>
                <li><strong>Vercel:</strong> Application hosting (no user data stored)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.2 Security Measures</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Password encryption:</strong> bcrypt hashing (industry-standard, one-way encryption)</li>
                <li><strong>Data encryption:</strong> TLS/HTTPS for all data in transit</li>
                <li><strong>Database security:</strong> Row Level Security (RLS) policies enforce access control</li>
                <li><strong>Authentication:</strong> Secure session management via Supabase Auth</li>
                <li><strong>File storage:</strong> Isolated storage with signed URLs for temporary access</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.3 Third-Party Security Compliance</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase:</strong> SOC 2 Type II compliant, GDPR-ready</li>
                <li><strong>Vercel:</strong> ISO 27001 certified, SOC 2 compliant</li>
                <li><strong>All providers:</strong> Data encrypted at rest and in transit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold mb-3">5.1 Public Information</h3>
              <p className="mb-4">
                The following information is publicly visible on your profile:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Username</li>
                <li>Bio (if provided)</li>
                <li>Law school (if provided)</li>
                <li>Profile picture (if uploaded)</li>
                <li>Public artifacts you've uploaded</li>
                <li>Upload count, like count, download count</li>
                <li>Friend count (but not your friends list)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.2 Limited Sharing</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>School community:</strong> Members of your law school can see you're a member</li>
                <li><strong>Friends:</strong> Can see your friend count and accepted friendships</li>
                <li><strong>Chat messages:</strong> Visible to all users in the chat channel</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.3 We Never Share</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Your email address (kept private)</li>
                <li>Your password (encrypted and never accessible)</li>
                <li>Private or unlisted artifacts (only you or link-holders can access)</li>
                <li>Your data with advertisers or third parties for marketing</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.4 Legal Disclosure</h3>
              <p>
                We may disclose your information if required by law, subpoena, court order, or to protect the rights, property, or safety of briefica, our users, or others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> View your profile and all data we store about you</li>
                <li><strong>Edit:</strong> Update your profile information, bio, and school at any time</li>
                <li><strong>Delete content:</strong> Remove any artifacts you've uploaded</li>
                <li><strong>Control visibility:</strong> Set artifacts to public, unlisted, or private</li>
                <li><strong>Manage friends:</strong> Accept, reject, or remove friend connections</li>
                <li><strong>Account deletion:</strong> Contact support to permanently delete your account</li>
                <li><strong>Opt-out of emails:</strong> Unsubscribe from non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Active accounts:</strong> We retain your data as long as your account is active</li>
                <li><strong>Deleted accounts:</strong> All data permanently deleted within 30 days</li>
                <li><strong>Chat messages:</strong> Retained indefinitely unless the channel is deleted</li>
                <li><strong>Artifacts:</strong> Deleted immediately when you remove them</li>
                <li><strong>Backups:</strong> May persist in backups for up to 90 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
              <p>
                briefica is intended for users age 18 and older. We do not knowingly collect information from children under 18. If we learn we have collected information from a child under 18, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. International Users</h2>
              <p>
                briefica is hosted in the United States. If you access the platform from outside the US, your information will be transferred to, stored, and processed in the United States. By using briefica, you consent to this transfer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the platform or sending you an email. Your continued use of briefica after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or your data:
              </p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <li><strong>Email:</strong> privacy@briefica.com</li>
                <li><strong>Support:</strong> support@briefica.com</li>
              </ul>
            </section>

            <div className="mt-8 pt-8 border-t border-white/10 text-sm text-white/60">
              <p>Last updated: January 10, 2026</p>
              <p className="mt-2">© 2026 briefica. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}