'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bot, Shield, Eye, Database, Lock, Globe, Mail } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: `We collect information you provide directly, including: account information (name, email, password), billing information (processed securely via Stripe), Jira ticket data you choose to analyze, and usage data about how you interact with our Service. We also automatically collect certain technical information such as IP address, browser type, and device information.`
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      content: `We use your information to: provide and maintain the Service, process your transactions, analyze and improve our AI models, send you service-related communications, respond to your requests and support needs, and ensure the security of our platform. We do not sell your personal information to third parties.`
    },
    {
      icon: Lock,
      title: '3. Data Security',
      content: `We implement industry-standard security measures to protect your data, including encryption in transit (TLS 1.3) and at rest (AES-256), secure cloud infrastructure with SOC 2 compliance, regular security audits and penetration testing, and access controls and authentication protocols. While we strive to protect your data, no method of transmission over the internet is 100% secure.`
    },
    {
      icon: Globe,
      title: '4. Data Sharing',
      content: `We may share your information with: service providers who assist in operating our Service (e.g., Stripe for payments, cloud hosting providers), legal authorities when required by law or to protect our rights, and business partners with your explicit consent. We require all third parties to respect the security of your data and treat it in accordance with the law.`
    },
    {
      icon: Shield,
      title: '5. Your Rights',
      content: `Depending on your location, you may have rights including: access to your personal data, correction of inaccurate data, deletion of your data, data portability, objection to certain processing, and withdrawal of consent. To exercise these rights, contact us at privacy@gobot.dev.`
    },
    {
      icon: Database,
      title: '6. Data Retention',
      content: `We retain your personal information for as long as your account is active or as needed to provide services. Ticket data processed through our Service is retained for 90 days to enable features and improve our AI, after which it is automatically deleted. You may request earlier deletion at any time.`
    },
    {
      icon: Globe,
      title: '7. International Transfers',
      content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including Standard Contractual Clauses approved by relevant authorities.`
    },
    {
      icon: Eye,
      title: '8. Cookies & Tracking',
      content: `We use cookies and similar technologies to: keep you logged in, remember your preferences, analyze usage patterns, and improve our Service. You can control cookies through your browser settings, though some features may not function properly if cookies are disabled.`
    },
    {
      icon: Shield,
      title: '9. Children\'s Privacy',
      content: `Our Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.`
    },
    {
      icon: Mail,
      title: '10. Contact Us',
      content: `For privacy-related inquiries, contact our Data Protection Officer at privacy@gobot.dev or write to: GoBot Privacy Team, 123 Tech Street, San Francisco, CA 94105.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                GoBot
              </span>
            </a>
            <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => window.location.href = '/'}>
              ← Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-6">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-slate-400">
              Last updated: January 2025
            </p>
          </div>

          {/* Privacy Highlights */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
              <Lock className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-1">Encrypted</h3>
              <p className="text-sm text-slate-400">All data encrypted at rest and in transit</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
              <Eye className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-1">No Selling</h3>
              <p className="text-sm text-slate-400">We never sell your personal data</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
              <Shield className="w-8 h-8 text-teal-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-1">Your Control</h3>
              <p className="text-sm text-slate-400">Delete your data anytime</p>
            </div>
          </div>

          {/* Privacy Content */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12">
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                At GoBot, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our Service.
              </p>

              <div className="space-y-10">
                {sections.map((section, i) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-slate-700 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-white mb-3">
                            {section.title}
                          </h2>
                          <p className="text-slate-300 leading-relaxed">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GDPR/CCPA Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-2">GDPR & CCPA Compliance</h3>
            <p className="text-slate-300 text-sm">
              GoBot complies with GDPR (for EU users) and CCPA (for California residents). You have the right to access, correct, delete, and port your data. To make a request, email privacy@gobot.dev.
            </p>
          </motion.div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90"
            >
              Back to Home
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 relative z-10 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-sm">© 2025 GoBot. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/terms" className="text-slate-400 hover:text-white transition">Terms</a>
              <a href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition">Privacy</a>
              <a href="/support" className="text-slate-400 hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}