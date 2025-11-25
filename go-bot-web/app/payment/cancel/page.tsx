'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="p-12 bg-slate-900/90 backdrop-blur-xl border-slate-800 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 bg-orange-500/20 border-2 border-orange-500/50 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-orange-400" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Checkout Cancelled
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-300 mb-8"
          >
            No worries! Your payment was not processed. You can try again whenever you're ready.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-4"
          >
            <Button
              onClick={() => window.location.href = '/checkout'}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              Try Again
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 pt-8 border-t border-slate-800"
          >
            <p className="text-sm text-slate-400 mb-4">
              Having trouble with checkout?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@jiraclarifier.com"
                className="text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </a>
              <span className="hidden sm:inline text-slate-600">•</span>
              <a
                href="/faq"
                className="text-indigo-400 hover:text-indigo-300"
              >
                View FAQ
              </a>
            </div>
          </motion.div>

          {/* Still interested message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg"
          >
            <p className="text-sm text-slate-300">
              💡 <strong>Remember:</strong> You can start with our Free plan (5 clarifications/month) with no credit card required!
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}