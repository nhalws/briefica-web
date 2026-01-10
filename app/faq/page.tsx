"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is briefica?",
      answer: "briefica is a social platform for law students to create, share, and collaborate on study materials. You can create brief sets (.bset), brief modules (.bmod), and test banks (.tbank) to help you and your classmates succeed."
    },
    {
      question: "What file types can I upload?",
      answer: "You can upload three types of files: .bset (brief sets), .bmod (brief modules), and .tbank (test banks). These files are created using the briefica desktop application."
    },
    {
      question: "How do I create briefs?",
      answer: "Download the briefica desktop application from the dashboard. The app allows you to create structured briefs with cases, rules, and analysis that you can then upload to the platform."
    },
    {
      question: "Can I make my uploads private?",
      answer: "Yes! When uploading or editing an artifact, you can set it to: Public (anyone can see), Unlisted (only people with the link), or Private (only you can see it)."
    },
    {
      question: "How does the school community work?",
      answer: "Select your law school in your profile settings to join your school's community. You'll see other students from your school, can join school-specific chats, and filter content by subjects relevant to your school."
    },
    {
      question: "What are subject preferences?",
      answer: "Subject preferences let you select up to 3 subjects you're interested in. This creates dedicated chat channels for those subjects within your school community, making it easier to find relevant discussions."
    },
    {
      question: "How do likes and downloads work?",
      answer: "You can like artifacts you find helpful, and download them to use offline. Creators can see how many people have liked or downloaded their work."
    },
    {
      question: "Can I add friends?",
      answer: "Yes! Visit any user's profile and send them a friend request. Once accepted, you'll see each other in your Friends lists and can easily access each other's content."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption, secure authentication through Supabase, and never store passwords in plaintext. Read our Privacy Policy for full details."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes. Contact support through your profile settings to request account deletion. All your data will be permanently removed within 30 days."
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Contact us immediately through your profile settings if you see any content that violates our Terms and Conditions."
    },
    {
      question: "Is briefica free?",
      answer: "Yes! briefica is currently free for all law students. We're committed to keeping core features free as we grow."
    }
  ];

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
            Back to dashboard
          </button>

          <Image
            src="/logo_6.png"
            alt="briefica"
            width={140}
            height={42}
            className="object-contain"
          />
        </div>

        <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-white/70 mb-8">Find answers to common questions about briefica</p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-white/80">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 border border-white/10 bg-[#1e1e1e] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-white/70 mb-4">We're here to help!</p>
          <p className="text-sm text-white/60">Contact us at: <a href="mailto:support@briefica.com" className="text-blue-400 hover:underline">support@briefica.com</a></p>
        </div>
      </div>
    </main>
  );
}