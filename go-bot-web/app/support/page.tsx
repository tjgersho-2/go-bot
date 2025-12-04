'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bot, Mail, MessageCircle, Book, HelpCircle, ChevronDown, ExternalLink, Zap, Users } from 'lucide-react';
import { useState } from 'react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      question: 'How do I install GoBot in Jira?',
      answer: 'After purchasing a plan, you\'ll receive a license key via email. Go to your Jira settings, navigate to "Manage Apps", search for GoBot, and install it. Then enter your license key when prompted to activate the app.'
    },
    {
      question: 'What counts as a "ticket" in my plan?',
      answer: 'A ticket is consumed each time you use GoBot to analyze and generate code from a Jira issue. Viewing previously generated code does not consume additional tickets. Your ticket count resets at the beginning of each billing cycle.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes! You can change your plan at any time from your account settings. Upgrades take effect immediately with prorated billing. Downgrades take effect at the start of your next billing cycle.'
    },
    {
      question: 'How does the 30-day money-back guarantee work?',
      answer: 'If you\'re not satisfied with GoBot within 30 days of purchase, contact us at support@gobot.dev for a full refund. No questions asked. This applies to your first purchase only.'
    },
    {
      question: 'What programming languages and frameworks are supported?',
      answer: 'GoBot supports all major languages including JavaScript/TypeScript, Python, Java, Go, Rust, C#, and more. It works with popular frameworks like React, Next.js, Django, Spring Boot, Express, and many others.'
    },
    {
      question: 'Is my code and ticket data secure?',
      answer: 'Absolutely. All data is encrypted in transit and at rest. We\'re SOC 2 compliant and never share your code with third parties. Ticket data is automatically deleted after 90 days, or sooner upon request.'
    },
    {
      question: 'Can I use GoBot with Jira Cloud and Jira Data Center?',
      answer: 'GoBot currently supports Jira Cloud. Jira Data Center support is coming soon. Contact our sales team for enterprise on-premise solutions.'
    },
    {
      question: 'What if the generated code has errors?',
      answer: 'While our AI strives for accuracy, we recommend reviewing all generated code. You can provide feedback within the app to improve future generations. If you consistently experience issues, our support team can help troubleshoot.'
    }
  ];

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help from our team',
      action: 'support@gobot.dev',
      href: 'mailto:gobot@gobot.ai',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Guides and tutorials',
      action: 'View Docs',
      href: '/docs',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: MessageCircle,
      title: 'Community',
      description: 'Join our Discord',
      action: 'Join Discord',
      href: 'https://discord.gg/gobot',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, you would send this to your backend
    console.log('Form submitted:', formData);
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
          className="max-w-5xl mx-auto"
        >
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-6">
              <HelpCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How can we help?
            </h1>
            <p className="text-xl text-slate-300">
              Get support, browse FAQs, or reach out to our team
            </p>
          </div>

          {/* Support Channels */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {supportChannels.map((channel, i) => {
              const Icon = channel.icon;
              return (
                <motion.a
                  key={i}
                  href={channel.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{channel.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{channel.description}</p>
                    <span className="text-emerald-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      {channel.action}
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </Card>
                </motion.a>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left"
                  >
                    <Card className={`p-5 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all ${openFaq === i ? 'border-emerald-500/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium pr-4">{faq.question}</h3>
                        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                      </div>
                      {openFaq === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-slate-300 mt-4 pt-4 border-t border-slate-800"
                        >
                          {faq.answer}
                        </motion.p>
                      )}
                    </Card>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Send us a message
            </h2>
            
            <Card className="p-8 bg-slate-900/50 border-slate-800 max-w-2xl mx-auto">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Message sent!</h3>
                  <p className="text-slate-400 mb-6">We'll get back to you within 24 hours.</p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-slate-700"
                  >
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="" className="bg-slate-800">Select a topic</option>
                      <option value="technical" className="bg-slate-800">Technical Support</option>
                      <option value="billing" className="bg-slate-800">Billing Question</option>
                      <option value="feature" className="bg-slate-800">Feature Request</option>
                      <option value="enterprise" className="bg-slate-800">Enterprise Inquiry</option>
                      <option value="other" className="bg-slate-800">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>

          {/* Response Time */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">
                Average response time: <span className="text-white font-medium">under 4 hours</span>
              </span>
            </div>
          </motion.div>
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
              <a href="/privacy" className="text-slate-400 hover:text-white transition">Privacy</a>
              <a href="/support" className="text-emerald-400 hover:text-emerald-300 transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}