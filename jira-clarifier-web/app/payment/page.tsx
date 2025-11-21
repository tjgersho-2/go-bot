'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CheckoutForm from '@/components/ui/checkoutform';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planDetails = {
    pro: {
      name: 'Pro',
      price: '$5',
      period: '/month',
      clarifications: 100,
      description: 'Perfect for individual developers',
      color: 'from-indigo-600 to-purple-600'
    },
    team: {
      name: 'Team',
      price: '$30',
      period: '/month',
      clarifications: 1000,
      description: 'For growing engineering teams',
      color: 'from-purple-600 to-pink-600'
    }
  };

  const plan = planDetails[planId as keyof typeof planDetails] || planDetails.pro;

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    createPaymentIntent();
  }, [planId]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("-------------------");
      console.log(process.env);
      console.log(`${process.env.NEXT_PUBLIC_GOBOT_URL}/create-payment-intent`)
      // Call FastAPI backend instead of Next.js API route
      const response = await fetch(`${process.env.NEXT_PUBLIC_GOBOT_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to initialize payment');
      }

      setClientSecret(data.clientSecret);
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#0f172a',
      colorText: '#f1f5f9',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #6366f1',
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
      },
      '.Label': {
        color: '#cbd5e1',
        fontSize: '14px',
        fontWeight: '500',
      },
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Jira Clarifier
            </a>
            <Button 
              variant="ghost" 
              className="text-slate-300"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Complete Your Purchase
            </h1>
            <p className="text-xl text-slate-300">
              You're just moments away from better Jira tickets
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-8 bg-slate-900/50 backdrop-blur-xl border-slate-800 sticky top-8">
                <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
                
                <div className={`bg-gradient-to-r ${plan.color} p-6 rounded-xl mb-6`}>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name} Plan</h3>
                  <p className="text-white/80 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/80">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-300">
                    <span>Clarifications per month</span>
                    <span className="font-semibold text-white">{plan.clarifications}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Billing cycle</span>
                    <span className="font-semibold text-white">Monthly</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Auto-renewal</span>
                    <span className="font-semibold text-white">Yes</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-slate-300">Total due today</span>
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime, no questions asked</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>30-day money-back guarantee</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4" />
                    <p className="text-slate-400">Initializing secure payment...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button 
                      onClick={createPaymentIntent}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : clientSecret ? (
                  <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm planId={planId} planName={plan.name} />
                  </Elements>
                ) : null}

                <div className="mt-8 pt-8 border-t border-slate-800">
                  <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>SSL Secure</span>
                    </div>
                    <span>•</span>
                    <span>PCI Compliant</span>
                    <span>•</span>
                    <span>256-bit Encryption</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="text-slate-400 text-sm mb-4">
              Trusted by 4,872+ developers worldwide
            </p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              <img src="/stripe-badge.svg" alt="Powered by Stripe" className="h-8" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}