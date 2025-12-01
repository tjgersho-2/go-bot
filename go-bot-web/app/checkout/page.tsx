'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Shield, Zap, Users, Star, Sparkles, TrendingUp, Bot, Code, Rocket } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  // const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // const preSelectedPlan = searchParams.get('plan') || 'pro';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/month',
      tickets: 5,
      description: 'Try GoBot free',
      features: [
        '5 tickets per month',
        'Basic clarification',
        'Simple code snippets',
        'Community support',
        'Perfect for trying it out'
      ],
      cta: 'Start Free',
      highlight: false,
      priceId: null,
      popular: false,
      color: 'from-slate-600 to-slate-700'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      period: '/month',
      tickets: 100,
      description: 'Perfect for individual developers',
      features: [
        '100 tickets per month',
        'Full code generation',
        'All frameworks supported',
        'Edge cases & test scenarios',
        'Priority email support',
        'Export to any format'
      ],
      cta: 'Get Pro',
      highlight: true,
      priceId: "price_1SW1moRU6Di3TZwT442hMmUr",
      popular: true,
      color: 'from-emerald-600 to-cyan-600'
    },
    {
      id: 'team',
      name: 'Team',
      price: 79,
      period: '/month',
      tickets: null,
      description: 'For growing engineering teams',
      features: [
        'Unlimited tickets',
        'Everything in Pro',
        'Custom code templates',
        'Team analytics dashboard',
        'API access',
        'Dedicated support channel'
      ],
      cta: 'Get Team',
      highlight: false,
      priceId: "price_1SW1nYRU6Di3TZwTgaZ6uGvE",
      popular: false,
      color: 'from-cyan-600 to-teal-600'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      period: '',
      tickets: null,
      description: 'Custom solutions for large orgs',
      features: [
        'Unlimited everything',
        'Everything in Team',
        'SSO & SCIM provisioning',
        'SOC2, GDPR compliance',
        'Dedicated account manager',
        'Custom integrations'
      ],
      cta: 'Contact Sales',
      highlight: false,
      priceId: null,
      popular: false,
      color: 'from-teal-600 to-emerald-600'
    }
  ];

  const handleCheckout = async (planId: string, priceId: string | null) => {
    // Handle free plan
    if (planId === 'free') {
      window.location.href = 'https://developer.atlassian.com/console/install/bada8dda-801f-4a83-84eb-efd1800033a0?signature=AYABeAT71EgvXekiKwmJpduqx%2B0AAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4IOp8r3eKNYw8z2v%2FEq3%2FfvrZguoGsXpNSaDveR%2FF%2Fo0BUN4ZU97WKKMDQ7ILu2MAVQAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDA0a%2FMQZHjpdqBuAYAIBEIA7oUEjNpdWL355lFAgOBgQq7E3vbz%2B1nlrmFkv80L9ldIGSWu%2FozfcLcY%2FW8vKjVYddM8eyvF8K4kyrSwAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHijmwVTMt6Oj3F%2B0%2B0cVrojrS8yZ9ktpdfDxqPMSIkvHAGNU02wXE2IAHx%2FsaqvbriCAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMcfGVT1jB1SZz59MnAgEQgDvLI35N086g6pTvEMblitvsEqH3NgcM7fNSVQMPHxz4QdaczmIZVXNeq6ugkOyzBAlR%2FECsscbUelOTngAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeLKa7Dfn9BgbXaQmJGrkKztjV4vrreTkqr7wGwhqIYs5ATp%2F%2B5H4nJ2Zj9TVPqz%2BKf0AAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxdd8v4oydTbVovr9cCARCAO5EoRTKqX1DCoCPeJ6ebvVAwATeF5QYiSXPjTLdBh7we8UoEhrCnvFFNsk2Ve0GavqQvp8KRR404DbQiAgAAAAAMAAAQAAAAAAAAAAAAAAAAALiv0kuT%2BKg8OtcV9hZbrGT%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADJYhTGd2uk6Z1KKOGyDPQ7ptxcdcYQ2dcqHbcnK1pLLxqOJch1qaIXAhKK8hyLt%2FfAMQP9se3UKRXG2uEyfo98YBKU%3D&product=jira';
      return;
    }
    
    // Handle enterprise
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@gobot.dev?subject=Enterprise%20Inquiry';
      return;
    }

    // Handle paid plans (Pro and Team) - Navigate to payment page
    if (!priceId) {
      alert('Price ID not configured. Please contact support.');
      return;
    }

    setIsLoading(planId);
    
    // Navigate to the payment page with the selected plan
    router.push(`/payment?plan=${planId}`);
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
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-6 px-4 py-2 bg-emerald-500/10 border-emerald-500/30 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple Monthly Subscriptions
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          
          <p className="text-xl text-slate-300 leading-relaxed">
            Go from ticket to working code. Start free, upgrade anytime.
          </p>

          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-300">
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              After purchase, you'll receive a license key via email
            </p>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative"
            >
              {plan.popular && (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600 rounded-3xl blur-lg opacity-75" />
                  <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-cyan-600 border-0 z-20">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </>
              )}
              
              <Card className={`relative p-8 h-full bg-slate-900/90 backdrop-blur-xl ${
                plan.highlight 
                  ? 'border-emerald-500/50' 
                  : 'border-slate-800'
              }`}>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    {plan.price !== null ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-white">${plan.price}</span>
                          <span className="text-slate-400">{plan.period}</span>
                        </div>
                        {plan.tickets && (
                          <p className="text-sm text-emerald-400 mt-2 font-medium">
                            {plan.tickets} tickets/month
                          </p>
                        )}
                        {plan.tickets === null && plan.id !== 'enterprise' && (
                          <p className="text-sm text-emerald-400 mt-2 font-medium">
                            Unlimited tickets
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-white">Custom</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleCheckout(plan.id, plan.priceId || null)}
                  disabled={isLoading === plan.id}
                  className={`w-full h-12 ${
                    plan.highlight 
                      ? `bg-gradient-to-r ${plan.color} hover:opacity-90` 
                      : ''
                  }`}
                  variant={plan.highlight ? 'default' : 'outline'}
                >
                  {isLoading === plan.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Plan Comparison
          </h2>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left p-4 text-slate-300 font-medium">Feature</th>
                  <th className="text-center p-4 text-slate-300 font-medium">Free</th>
                  <th className="text-center p-4 text-emerald-400 font-medium">Pro</th>
                  <th className="text-center p-4 text-cyan-400 font-medium">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-4 text-slate-300">Tickets/month</td>
                  <td className="p-4 text-center text-slate-400">5</td>
                  <td className="p-4 text-center text-white font-medium">100</td>
                  <td className="p-4 text-center text-white font-medium">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300">AI Clarification</td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300">Full Code Generation</td>
                  <td className="p-4 text-center text-slate-600">—</td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300">All Frameworks</td>
                  <td className="p-4 text-center text-slate-600">—</td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-300">API Access</td>
                  <td className="p-4 text-center text-slate-600">—</td>
                  <td className="p-4 text-center text-slate-600">—</td>
                  <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-10 h-10 text-emerald-400" />
              <h4 className="font-semibold text-white">Secure Payments</h4>
              <p className="text-sm text-slate-400">Powered by Stripe</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-cyan-400" />
              <h4 className="font-semibold text-white">12,847+ Developers</h4>
              <p className="text-sm text-slate-400">Ship faster with GoBot</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="w-10 h-10 text-teal-400" />
              <h4 className="font-semibold text-white">Cancel Anytime</h4>
              <p className="text-sm text-slate-400">No long-term commitment</p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">30-Day Money-Back Guarantee</h3>
            <p className="text-slate-300">
              Not satisfied? Get a full refund within 30 days, no questions asked.
            </p>
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
              <a href="/privacy" className="text-slate-400 hover:text-white transition">Privacy</a>
              <a href="/support" className="text-slate-400 hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}