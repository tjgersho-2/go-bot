'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, ArrowLeft, Shield, Lock } from 'lucide-react';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const plan = searchParams.get('plan') || 'pro';
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const price = plan === 'pro' ? 5 : 30;
  const clarifications = plan === 'pro' ? 100 : 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Create subscription on backend
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?session_id=${data.subscriptionId}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Payment successful!
      setSuccess(true);
      
      // Redirect to success page after a moment
      setTimeout(() => {
        router.push(`/checkout/success?session_id=${data.subscriptionId}`);
      }, 1500);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{planName} Plan</h3>
            <p className="text-slate-400 text-sm">{clarifications} clarifications per month</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">${price}</p>
            <p className="text-slate-400 text-sm">/month</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>First payment today, then ${price}/month</span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Payment Details</h3>
        </div>
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                email: '',
              }
            }
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Payment successful! Redirecting...</span>
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || success}
        className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : success ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Payment Successful!
          </span>
        ) : (
          `Subscribe for $${price}/month`
        )}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe • Cancel anytime</span>
      </div>
    </form>
  );
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plan = searchParams.get('plan') || 'pro';
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  useEffect(() => {
    // Create payment intent when page loads
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
        setLoading(false);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to initialize payment. Please try again.');
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [plan]);

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
              Go Bot
            </a>
            <Button 
              variant="ghost" 
              className="text-slate-300"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <Badge className="mb-4 px-4 py-2 bg-indigo-500/10 border-indigo-500/30">
              Secure Checkout
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-2">
              Subscribe to {planName}
            </h1>
            <p className="text-slate-400">
              Complete your payment to get started
            </p>
          </div>

          {/* Payment Form Card */}
          <Card className="p-8 bg-slate-900/90 backdrop-blur-xl border-slate-800">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400">Setting up secure payment...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Payment Setup Failed</h3>
                <p className="text-slate-400 mb-6">{error}</p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#6366f1',
                      colorBackground: '#1e293b',
                      colorText: '#f1f5f9',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm />
              </Elements>
            ) : null}
          </Card>

          {/* Trust Signals */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-400" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Lock className="w-8 h-8 text-purple-400" />
              <span>Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}