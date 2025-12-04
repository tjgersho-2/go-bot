'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ArrowRight, Shield, Zap, Users, Star, Sparkles, TrendingUp, Bot, Code, Rocket, X, Mail } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // Free plan modal state
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [freeEmail, setFreeEmail] = useState('');
  const [freeEmailError, setFreeEmailError] = useState<string | null>(null);
  const [isSubmittingFree, setIsSubmittingFree] = useState(false);

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
        'Full clarification',
        'Full code generation',
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
      price: 29,
      period: '/month',
      tickets: 50,
      description: 'Perfect for individual developers',
      features: [
        '50 tickets per month',
        'Full clarification',
        'Full code generation',
        'Priority email support'
      ],
      cta: 'Get Pro',
      highlight: true,
      priceId: "price_YOUR_NEW_PRO_PRICE_ID",
      popular: true,
      color: 'from-emerald-600 to-cyan-600'
    },
    {
      id: 'team',
      name: 'Team',
      price: 99,
      period: '/month',
      tickets: 200,
      description: 'For growing engineering teams',
      features: [
        '200 tickets per month',
        'Full clarification',
        'Full code generation',
        'Priority email support'
      ],
      cta: 'Get Team',
      highlight: false,
      priceId: "price_YOUR_NEW_TEAM_PRICE_ID",
      popular: false,
      color: 'from-cyan-600 to-teal-600'
    }
  ];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFreeSubmit = async () => {
    setFreeEmailError(null);
    
    if (!freeEmail.trim()) {
      setFreeEmailError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(freeEmail)) {
      setFreeEmailError('Please enter a valid email address');
      return;
    }
    
    setIsSubmittingFree(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_GOBOT_URL}/create-free-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: freeEmail.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create license key');
      }
      
      const data = await response.json();
      
      // Redirect to success page with key info
      router.push(`/success?key=${data.keyCode}&plan=free&email=${encodeURIComponent(data.email)}&existing=${data.isExisting}`);
      
    } catch (err: any) {
      console.error('Error creating free key:', err);
      setFreeEmailError(err.message || 'Failed to create license key. Please try again.');
    } finally {
      setIsSubmittingFree(false);
    }
  };

  const handleCheckout = async (planId: string, priceId: string | null) => {
    // Handle free plan - show email modal
    if (planId === 'free') {
      setShowFreeModal(true);
      return;
    }

    // Handle paid plans (Pro and Team) - Navigate to payment page
    if (!priceId) {
      alert('Price ID not configured. Please contact support.');
      return;
    }

    setIsLoading(planId);
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

      {/* Free Plan Email Modal */}
      <AnimatePresence>
        {showFreeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFreeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="p-8 bg-slate-900/95 backdrop-blur-xl border-slate-700">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Get Started Free</h2>
                      <p className="text-sm text-slate-400">5 tickets/month included</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFreeModal(false)}
                    className="text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-slate-300 mb-6">
                  Enter your email to receive your free license key. We'll send it right away!
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={freeEmail}
                        onChange={(e) => {
                          setFreeEmail(e.target.value);
                          setFreeEmailError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleFreeSubmit();
                          }
                        }}
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                    {freeEmailError && (
                      <p className="text-sm text-red-400 mt-2">{freeEmailError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleFreeSubmit}
                    disabled={isSubmittingFree}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                  >
                    {isSubmittingFree ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating your key...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Get Free License Key
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="text-emerald-400 hover:underline">Terms</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a>
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Upgrade anytime to unlock more tickets</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              After signup, you'll receive a license key via email
            </p>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
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
                    <td className="p-4 text-center text-white font-medium">50</td>
                    <td className="p-4 text-center text-white font-medium">200</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">AI Clarification</td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Full Code Generation</td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">All Frameworks</td>
                    <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" /></td>
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