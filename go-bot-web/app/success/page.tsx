'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Copy, Mail, ExternalLink, Sparkles, AlertCircle, Bot, Rocket, Code, Gift } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  
  // Check for different flows
  const paymentIntentId = searchParams.get('payment_intent');
  const directKey = searchParams.get('key');
  const planParam = searchParams.get('plan');
  const emailParam = searchParams.get('email');
  const isExisting = searchParams.get('existing') === 'true';
  
  const [licenseKey, setLicenseKey] = useState<string | null>(directKey);
  const [customerEmail, setCustomerEmail] = useState<string | null>(emailParam ? decodeURIComponent(emailParam) : null);
  const [plan, setPlan] = useState<string>(planParam ? planParam.charAt(0).toUpperCase() + planParam.slice(1) : 'Pro');
  const [loading, setLoading] = useState(!directKey); // Don't load if we have direct key
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFreeFlow, setIsFreeFlow] = useState(planParam === 'free');

  useEffect(() => {
    // If we have a direct key (from free flow), we're done
    if (directKey) {
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch from payment intent (paid flow)
    if (paymentIntentId) {
      fetchLicenseKey();
    } else if (!directKey) {
      setError('No payment information found');
      setLoading(false);
    }
  }, [paymentIntentId, directKey]);

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
    const link = "https://developer.atlassian.com/console/install/bada8dda-801f-4a83-84eb-efd1800033a0?signature=AYABeAT71EgvXekiKwmJpduqx%2B0AAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4IOp8r3eKNYw8z2v%2FEq3%2FfvrZguoGsXpNSaDveR%2FF%2Fo0BUN4ZU97WKKMDQ7ILu2MAVQAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDA0a%2FMQZHjpdqBuAYAIBEIA7oUEjNpdWL355lFAgOBgQq7E3vbz%2B1nlrmFkv80L9ldIGSWu%2FozfcLcY%2FW8vKjVYddM8eyvF8K4kyrSwAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHijmwVTMt6Oj3F%2B0%2B0cVrojrS8yZ9ktpdfDxqPMSIkvHAGNU02wXE2IAHx%2FsaqvbriCAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMcfGVT1jB1SZz59MnAgEQgDvLI35N086g6pTvEMblitvsEqH3NgcM7fNSVQMPHxz4QdaczmIZVXNeq6ugkOyzBAlR%2FECsscbUelOTngAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeLKa7Dfn9BgbXaQmJGrkKztjV4vrreTkqr7wGwhqIYs5ATp%2F%2B5H4nJ2Zj9TVPqz%2BKf0AAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxdd8v4oydTbVovr9cCARCAO5EoRTKqX1DCoCPeJ6ebvVAwATeF5QYiSXPjTLdBh7we8UoEhrCnvFFNsk2Ve0GavqQvp8KRR404DbQiAgAAAAAMAAAQAAAAAAAAAAAAAAAAALiv0kuT%2BKg8OtcV9hZbrGT%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADJYhTGd2uk6Z1KKOGyDPQ7ptxcdcYQ2dcqHbcnK1pLLxqOJch1qaIXAhKK8hyLt%2FfAMQP9se3UKRXG2uEyfo98YBKU%3D&product=jira";
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

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
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isFreeFlow 
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            }`}>
              {isFreeFlow ? (
                <Gift className="w-12 h-12 text-white" />
              ) : (
                <CheckCircle2 className="w-12 h-12 text-white" />
              )}
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-center text-white mb-4"
          >
            {isFreeFlow 
              ? (isExisting ? 'Welcome Back! 👋' : 'You\'re All Set! 🎉')
              : 'Payment Successful! 🎉'
            }
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-slate-300 mb-8"
          >
            {isFreeFlow
              ? (isExisting 
                  ? 'Your existing license key is ready to use.'
                  : 'Your free license key has been created and sent to your email.')
              : `Welcome to GoBot ${plan}! Your license key is ready.`
            }
          </motion.p>

          {/* License Key Section */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
              <p className="text-slate-400 mt-4">Generating your license key...</p>
              <p className="text-slate-500 text-sm mt-2">This usually takes just a few seconds</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <p className="text-slate-300 mb-4">{error}</p>
              <p className="text-slate-400 text-sm mb-6">
                Don't worry! Your license key will be sent to your email shortly.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
              >
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
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Your License Key
                  </h3>
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-2xl text-center text-emerald-400 tracking-wider">
                  {licenseKey}
                </div>

                {customerEmail && (
                  <p className="text-sm text-slate-400 mt-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {isExisting 
                      ? `Associated with ${customerEmail}`
                      : `A copy has been sent to ${customerEmail}`
                    }
                  </p>
                )}
              </div>

              {/* Plan Info for Free Users */}
              {isFreeFlow && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Free Plan</p>
                      <p className="text-sm text-slate-400">5 tickets per month • Upgrade anytime for more</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activation Steps */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                  Activate Your License (3 steps)
                </h4>
                <ol className="space-y-3 text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </span>
                    <span>Install GoBot in your Jira workspace (if not already installed)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </span>
                    <span>Open any Jira ticket and find the GoBot panel on the right</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </span>
                    <span>Click "Enter Access Key" and paste your license key</span>
                  </li>
                </ol>
              </div>

              {/* What's next */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-cyan-400" />
                  What happens next?
                </h4>
                <p className="text-slate-300 text-sm">
                  Once activated, GoBot will analyze your Jira tickets and generate clear acceptance criteria plus working MVP code. Just click "GoBot" on any ticket!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={openForgeInstall}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                  size="lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Install in Jira
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1 border-slate-700 hover:border-slate-600"
                  size="lg"
                >
                  Back to Home
                </Button>
              </div>

              {/* Upgrade CTA for Free Users */}
              {isFreeFlow && (
                <div className="mt-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">Need more tickets?</p>
                  <Button
                    onClick={() => window.location.href = '/checkout'}
                    variant="link"
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    Upgrade to Pro for 100 tickets/month →
                  </Button>
                </div>
              )}
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
              
              <a  href="mailto:support@gobot.dev"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Email Support
              </a>
              <span className="text-slate-600">•</span>
              
              <a  href="/docs"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Documentation
              </a>
            </div>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-500 text-sm">GoBot</span>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}