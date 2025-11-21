'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Copy, Mail, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const planParam = searchParams.get('plan');
  
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>(planParam || 'Pro');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paymentIntentId) {
      fetchLicenseKey();
    } else {
      setError('No payment information found');
      setLoading(false);
    }
  }, [paymentIntentId]);

  const fetchLicenseKey = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GOBOT_URL}/license-key/payment-intent/${paymentIntentId}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // Key might still be processing, retry after a delay
          setTimeout(fetchLicenseKey, 2000);
          return;
        }
        throw new Error('Failed to fetch license key');
      }

      const data = await response.json();
      
      setLicenseKey(data.keyCode);
      setCustomerEmail(data.email);
      setPlan(data.plan.charAt(0).toUpperCase() + data.plan.slice(1));
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error fetching license key:', err);
      setError(err.message || 'Failed to load license key');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openForgeInstall = () => {
    const link = "https://developer.atlassian.com/console/install/bada8dda-801f-4a83-84eb-efd1800033a0?signature=...";
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card className="p-12 bg-slate-900/90 backdrop-blur-xl border-slate-800">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-center text-white mb-4"
          >
            Payment Successful! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-slate-300 mb-8"
          >
            Thank you for your purchase! Your license key is ready.
          </motion.p>

          {/* License Key Section */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
              <p className="text-slate-400 mt-4">Generating your license key...</p>
              <p className="text-slate-500 text-sm mt-2">This usually takes just a few seconds</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <p className="text-slate-300 mb-4">{error}</p>
              <p className="text-slate-400 text-sm mb-6">
                Don't worry! Your payment was successful. Your license key will be sent to your email shortly.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Return to Home
              </Button>
            </div>
          ) : licenseKey ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* License Key Display */}
              <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Your License Key
                  </h3>
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-2xl text-center text-indigo-400 tracking-wider">
                  {licenseKey}
                </div>

                {customerEmail && (
                  <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    A copy has been sent to {customerEmail}
                  </p>
                )}
              </div>

              {/* Activation Steps */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-white mb-4">
                  🚀 Activate Your License (3 steps)
                </h4>
                <ol className="space-y-3 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </span>
                    <span>Install Jira Clarifier in your Jira workspace (if not already installed)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </span>
                    <span>Open any Jira ticket and find the Jira Clarifier panel on the right</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </span>
                    <span>Click "Enter Access Key" and paste your license key</span>
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={openForgeInstall}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  size="lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Install in Jira
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Back to Home
                </Button>
              </div>
            </motion.div>
          ) : null}

          {/* Support Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-8 border-t border-slate-800 text-center"
          >
            <p className="text-sm text-slate-400 mb-2">
              Need help activating your license?
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a
                href="mailto:support@jiraclarifier.com"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Email Support
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="/docs"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Documentation
              </a>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}