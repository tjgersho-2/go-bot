'use client';

import { useState, FormEvent } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface CheckoutFormProps {
  planId: string;
  planName: string;
}

export default function CheckoutForm({ planId, planName }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success?plan=${planId}`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred.');
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, redirect to success page
        window.location.href = `/success?payment_intent=${paymentIntent.id}&plan=${planId}`;
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <p className="text-xs text-slate-500 mt-2">
          Your license key will be sent to this email
        </p>
      </div>

      {/* Payment Element (Card Details) */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Card Information
        </label>
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Billing Address */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Billing Address
        </label>
        <AddressElement 
          options={{ 
            mode: 'billing',
          }} 
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Subscribe to {planName}
          </span>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-slate-500 text-center">
        By confirming your subscription, you agree to our{' '}
        <a href="/terms" className="text-indigo-400 hover:text-indigo-300">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">
          Privacy Policy
        </a>
        . Your subscription will automatically renew monthly.
      </p>
    </form>
  );
}