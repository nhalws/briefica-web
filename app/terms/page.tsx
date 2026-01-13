"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-white/70 mb-8">Effective Date: January 10, 2026</p>

          <div className="space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using briefica ("the Platform"), a product of VanHuxt, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the Platform.
              </p>
              <p className="mt-4">
                These Terms constitute a legally binding agreement between you and VanHuxt ("we," "our," or "us"). We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to use briefica</li>
                <li>You must be a current or prospective law student</li>
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>You must provide a valid email address and create a unique username</li>
                <li>You may only create one account per person</li>
                <li>You may not impersonate others or create accounts on behalf of others without permission</li>
                <li>You may not use offensive, misleading, or inappropriate usernames</li>
                <li>Profile pictures must not violate our content restrictions (see Section 4.2)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.2 Account Security</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>You are solely responsible for all activity under your account</li>
                <li>Choose a strong, unique password and keep it confidential</li>
                <li>We will never ask for your password via email or chat</li>
                <li>Report any suspected security breaches immediately</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.3 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms, engage in abusive behavior, or compromise platform security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. User Content</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1 Content You Upload</h3>
              <p className="mb-4">
                You retain ownership of content you upload (briefs, files, messages, profile pictures, profile information). By uploading content to briefica, you grant us a non-exclusive, worldwide, royalty-free license to store, display, and distribute your content as necessary to provide the Platform services.
              </p>

              <h3 className="text-xl font-semibold mb-3">4.2 Content Restrictions</h3>
              <p className="mb-2">You agree NOT to upload, post, or share content (including profile pictures) that:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Violates any law, regulation, or third-party rights</li>
                <li>Infringes on copyrights, trademarks, or intellectual property</li>
                <li>Contains malware, viruses, or malicious code</li>
                <li>Is hateful, threatening, harassing, or discriminatory</li>
                <li>Contains explicit sexual content or child exploitation material</li>
                <li>Promotes violence, self-harm, or illegal activities</li>
                <li>Contains personal information of others without consent</li>
                <li>Is spam, advertising, or commercial solicitation</li>
                <li>Impersonates others or misrepresents your identity</li>
                <li>Depicts individuals without their consent (for profile pictures, use only images of yourself or images you have rights to use)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.3 Academic Integrity</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Content should be your original work or properly attributed</li>
                <li>Do not upload copyrighted materials without permission</li>
                <li>Do not share exam questions, answers, or materials that violate academic honor codes</li>
                <li>Use briefica to supplement your studies, not to facilitate academic dishonesty</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.4 Content Moderation</h3>
              <p>
                We reserve the right to review, remove, or restrict access to any content (including profile pictures) that violates these Terms. We may also report illegal content to appropriate authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Privacy and Data</h2>
              <p>
                Your use of briefica is also governed by our <button onClick={() => router.push("/privacy-policy")} className="text-blue-400 hover:underline">Privacy Policy</button>, which explains how we collect, use, and protect your information. By using briefica, you consent to our privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Prohibited Conduct</h2>
              <p className="mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Attempt to gain unauthorized access to the Platform or other users' accounts</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
                <li>Use bots, scrapers, or automated tools without permission</li>
                <li>Interfere with or disrupt the Platform's operation</li>
                <li>Circumvent security measures or access controls</li>
                <li>Collect or harvest user information without consent</li>
                <li>Use the Platform for illegal or unauthorized purposes</li>
                <li>Create multiple accounts to manipulate likes, downloads, or rankings</li>
                <li>Harass, bully, or threaten other users</li>
                <li>Sell, rent, or commercialize access to the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold mb-3">7.1 VanHuxt's Rights</h3>
              <p className="mb-4">
                The briefica Platform, including its design, logo, features, and underlying code, is owned by VanHuxt and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.
              </p>

              <h3 className="text-xl font-semibold mb-3">7.2 User Content Rights</h3>
              <p>
                You retain ownership of your uploaded content. Other users may view, download, and use your public content for personal educational purposes in accordance with your chosen visibility settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Third-Party Services</h2>
              <p>
                briefica uses third-party services (Supabase for data storage, Vercel for hosting) to provide the Platform. These services have their own terms and privacy policies. We are not responsible for third-party services' practices or availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-semibold mb-3">9.1 No Warranties</h3>
              <p className="mb-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, ERROR-FREE OPERATION, OR THAT THE PLATFORM WILL MEET YOUR REQUIREMENTS.
              </p>

              <h3 className="text-xl font-semibold mb-3">9.2 Educational Tool</h3>
              <p className="mb-4">
                briefica is an educational tool. Content on the Platform is user-generated and may contain errors or inaccuracies. We do not guarantee the accuracy, completeness, or quality of user-generated content. Always verify information independently.
              </p>

              <h3 className="text-xl font-semibold mb-3">9.3 Not Legal Advice</h3>
              <p className="mb-4">
                briefica does not provide legal advice. Content on the Platform is for educational purposes only and should not be relied upon as legal advice for any matter.
              </p>

              <h3 className="text-xl font-semibold mb-3">9.4 Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, VANHUXT AND BRIEFICA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM. OUR TOTAL LIABILITY SHALL NOT EXCEED $100.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless VanHuxt, briefica, and their respective officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Content you upload or share (including profile pictures)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold mb-3">11.1 Governing Law</h3>
              <p className="mb-4">
                These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mb-3">11.2 Arbitration</h3>
              <p className="mb-4">
                Any disputes arising from these Terms or your use of briefica shall be resolved through binding arbitration in Delaware, except for claims that may be brought in small claims court.
              </p>

              <h3 className="text-xl font-semibold mb-3">11.3 Class Action Waiver</h3>
              <p>
                You agree to resolve disputes individually and waive any right to participate in class actions or class arbitrations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Miscellaneous</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect</li>
                <li><strong>Entire Agreement:</strong> These Terms and the Privacy Policy constitute the entire agreement</li>
                <li><strong>No Waiver:</strong> Our failure to enforce any right does not waive that right</li>
                <li><strong>Assignment:</strong> You may not assign these Terms; we may assign them without notice</li>
                <li><strong>Force Majeure:</strong> We are not liable for failures due to circumstances beyond our control</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
              <p>
                For questions about these Terms:
              </p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <li><strong>Email:</strong> legal@briefica.com</li>
                <li><strong>Support:</strong> support@briefica.com</li>
              </ul>
            </section>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="font-semibold mb-4">By using briefica, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
            </div>

            <div className="mt-8 text-sm text-white/60">
              <p>Last updated: January 10, 2026</p>
              <p className="mt-2">© 2026 VanHuxt. All rights reserved.</p>
              <p className="mt-1">briefica is a product of VanHuxt.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}