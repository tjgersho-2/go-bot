'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Book, 
  Search, 
  ChevronRight, 
  Home,
  Rocket,
  Settings,
  Code,
  Zap,
  Shield,
  HelpCircle,
  FileText,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  Menu,
  X,
  ExternalLink,
  Key,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ClipboardCheck,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const navigation = [
    {
      title: 'Getting Started',
      icon: Rocket,
      items: [
        { title: 'Introduction', href: '#introduction', active: true },
        { title: 'Installation', href: '#installation' },
        { title: 'Activating Your License', href: '#activation' },
      ]
    },
    {
      title: 'Using GoBot',
      icon: Bot,
      items: [
        { title: 'Step 1: Clarify Tickets', href: '#clarify-tickets' },
        { title: 'Step 2: Generate Code', href: '#generate-code' },
        { title: 'Custom Prompts', href: '#custom-prompts' },
      ]
    },
    {
      title: 'Features',
      icon: Sparkles,
      items: [
        { title: 'Apply to Ticket', href: '#apply-to-ticket' },
        { title: 'Regenerate & Reset', href: '#regenerate' },
        { title: 'Feedback System', href: '#feedback' },
      ]
    },
    {
      title: 'Reference',
      icon: Book,
      items: [
        { title: 'Plans & Limits', href: '#plans' },
        { title: 'Troubleshooting', href: '#troubleshooting' },
        { title: 'FAQ', href: '#faq' },
      ]
    }
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const CodeBlock = ({ code, language = 'bash', index }: { code: string; language?: string; index: number }) => (
    <div className="relative group">
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => copyToClipboard(code, index)}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition opacity-0 group-hover:opacity-100"
        >
          {copiedIndex === index ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-800">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">{language}</span>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm text-slate-300">{code}</code>
        </pre>
      </div>
    </div>
  );

  const Callout = ({ type, title, children }: { type: 'info' | 'warning' | 'tip'; title: string; children: React.ReactNode }) => {
    const styles = {
      info: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        icon: AlertCircle,
        iconColor: 'text-cyan-400'
      },
      warning: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        icon: AlertCircle,
        iconColor: 'text-amber-400'
      },
      tip: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        icon: Lightbulb,
        iconColor: 'text-emerald-400'
      }
    };
    
    const style = styles[type];
    const Icon = style.icon;
    
    return (
      <div className={`${style.bg} ${style.border} border rounded-lg p-4 my-6`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className="font-medium text-white mb-1">{title}</h4>
            <div className="text-sm text-slate-300">{children}</div>
          </div>
        </div>
      </div>
    );
  };

  const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
          {number}
        </div>
      </div>
      <div className="flex-1 pb-8 border-l border-slate-800 pl-6 -ml-4">
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <div className="text-slate-300 space-y-4">{children}</div>
      </div>
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <Card className="p-4 bg-slate-900/50 border-slate-800">
      <Icon className="w-6 h-6 text-emerald-400 mb-2" />
      <h4 className="font-medium text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                  GoBot
                </span>
              </a>
              <Badge className="hidden md:flex bg-slate-800 border-slate-700 text-slate-300">
                <Book className="w-3 h-3 mr-1" />
                Documentation
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg w-64">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
                />
                <kbd className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded">⌘K</kbd>
              </div>
              
              <Button
                variant="ghost"
                className="md:hidden text-slate-300"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <Button variant="ghost" className="hidden md:flex text-slate-300 hover:text-white" onClick={() => window.location.href = '/'}>
                ← Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-[73px]">
        {/* Sidebar */}
        <aside className={`
          fixed md:sticky top-[73px] left-0 z-40 w-72 h-[calc(100vh-73px)] 
          bg-slate-950 md:bg-transparent border-r border-slate-800 
          overflow-y-auto transition-transform md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-6 space-y-8">
            {navigation.map((section, i) => {
              const Icon = section.icon;
              return (
                <div key={i}>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-3">
                    <Icon className="w-4 h-4" />
                    {section.title}
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item, j) => (
                      <li key={j}>
                        <a
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            block px-3 py-2 rounded-lg text-sm transition
                            ${item.active 
                              ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' 
                              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                            }
                          `}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            
            {/* Quick Links */}
            <div className="pt-6 border-t border-slate-800">
              <div className="text-sm font-medium text-slate-400 mb-3">Resources</div>
              <ul className="space-y-1">
                <li>
                  <a href="/support" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition">
                    <HelpCircle className="w-4 h-4" />
                    Support
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </li>
                <li>
                  <a href="/checkout" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition">
                    <Key className="w-4 h-4" />
                    Get a License
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
                <a href="/docs" className="hover:text-white transition">
                  <Home className="w-4 h-4" />
                </a>
                <ChevronRight className="w-4 h-4" />
                <span>Getting Started</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">Introduction</span>
              </div>

              {/* Page Title */}
              <div className="mb-12">
                <Badge className="mb-4 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                  <Rocket className="w-3 h-3 mr-1" />
                  Getting Started
                </Badge>
                <h1 className="text-4xl font-bold text-white mb-4">
                  Introduction to GoBot
                </h1>
                <p className="text-xl text-slate-300">
                  Transform your Jira tickets into crystal-clear scope and production-ready code with GoBot's two-step AI workflow.
                </p>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none space-y-12">
                
                {/* Overview Section */}
                <section id="introduction">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    What is GoBot?
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    GoBot is a Jira app that uses AI to help developers ship faster. It works in two powerful steps:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          1
                        </div>
                        <h4 className="font-semibold text-white">Clarify Tickets</h4>
                      </div>
                      <p className="text-sm text-slate-400">
                        Transform vague tickets into crystal-clear scope with acceptance criteria, edge cases, success metrics, and test scenarios.
                      </p>
                    </Card>
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold">
                          2
                        </div>
                        <h4 className="font-semibold text-white">Generate Code</h4>
                      </div>
                      <p className="text-sm text-slate-400">
                        Turn clarified scope into an initial AI-generated implementation, ready for review and refinement.
                      </p>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <FeatureCard 
                      icon={CheckCircle2}
                      title="Acceptance Criteria"
                      description="Clear, testable requirements"
                    />
                    <FeatureCard 
                      icon={AlertCircle}
                      title="Edge Cases"
                      description="Catch issues before coding"
                    />
                    <FeatureCard 
                      icon={Zap}
                      title="Success Metrics"
                      description="Measurable outcomes"
                    />
                    <FeatureCard 
                      icon={Code}
                      title="Test Scenarios"
                      description="Ready-to-implement tests"
                    />
                  </div>
                </section>

                {/* Installation Section */}
                <section id="installation">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-emerald-400" />
                    </div>
                    Installation
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Install GoBot from the Atlassian Marketplace to add it to your Jira Cloud instance.
                  </p>

                  <div className="space-y-0">
                    <Step number={1} title="Install from Atlassian Marketplace">
                      <p>Go to your Jira settings → Apps → Find new apps, then search for "GoBot" and click Install.</p>
                      <p>Alternatively, use the direct installation link from your purchase confirmation email.</p>
                    </Step>

                    <Step number={2} title="Grant Required Permissions">
                      <p>GoBot needs read access to your Jira tickets to analyze requirements, and write access to update ticket descriptions with clarified scope.</p>
                      <Callout type="info" title="Permissions">
                        GoBot only accesses tickets you explicitly analyze. We never modify tickets without your action.
                      </Callout>
                    </Step>

                    <Step number={3} title="Open Any Jira Ticket">
                      <p>Once installed, you'll see the GoBot panel in the right sidebar of any Jira issue. You're ready to activate your license!</p>
                    </Step>
                  </div>
                </section>

                {/* Activation Section */}
                <section id="activation">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Key className="w-4 h-4 text-emerald-400" />
                    </div>
                    Activating Your License
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Enter your access key to unlock GoBot features. You'll receive your key via email after purchase.
                  </p>

                  <div className="space-y-0">
                    <Step number={1} title="Open the GoBot Panel">
                      <p>Navigate to any Jira issue and find the GoBot panel in the right sidebar.</p>
                    </Step>

                    <Step number={2} title="Click 'Enter Access Key'">
                      <p>If you haven't activated yet, you'll see an option to enter your access key.</p>
                    </Step>

                    <Step number={3} title="Enter Your License Key">
                      <p>Enter your key in the format shown below and click "Validate Key".</p>
                      <CodeBlock 
                        code="GOBOT-XXXX-XXXX-XXXX"
                        language="text"
                        index={0}
                      />
                      <Callout type="tip" title="Pro Tip">
                        Your key is tied to your Jira account. Each team member needs their own license for paid plans.
                      </Callout>
                    </Step>

                    <Step number={4} title="Start Using GoBot">
                      <p>Once validated, your plan will be displayed and you can start clarifying tickets immediately!</p>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">You're all set!</span>
                      </div>
                    </Step>
                  </div>

                  <Callout type="info" title="Don't have a key?">
                    Purchase a license at <a href="/checkout" className="text-emerald-400 hover:text-emerald-300 underline">gobot.ai/checkout</a> to get your access key instantly via email.
                  </Callout>
                </section>

                {/* Step 1: Clarify Tickets */}
                <section id="clarify-tickets">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    Step 1: Clarify Tickets
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Transform vague tickets into crystal-clear scope. This is the first step in the GoBot workflow.
                  </p>

                  <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
                    <h4 className="font-semibold text-white mb-4">How it works:</h4>
                    <ol className="space-y-3 text-slate-300">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">1</span>
                        <span>Open a Jira ticket and find the GoBot panel</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">2</span>
                        <span>Click the <strong className="text-white">"GoBot"</strong> button</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">3</span>
                        <span>Wait ~30 seconds while AI analyzes your ticket</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">4</span>
                        <span>Review the generated scope breakdown</span>
                      </li>
                    </ol>
                  </Card>

                  <h4 className="font-semibold text-white mb-3">What you'll get:</h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium text-white">Acceptance Criteria</span>
                      </div>
                      <p className="text-sm text-slate-400">Clear, testable requirements that define "done"</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <span className="font-medium text-white">Edge Cases</span>
                      </div>
                      <p className="text-sm text-slate-400">Potential issues and corner cases to consider</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-cyan-400" />
                        <span className="font-medium text-white">Success Metrics</span>
                      </div>
                      <p className="text-sm text-slate-400">Measurable outcomes to track success</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-5 h-5 text-teal-400" />
                        <span className="font-medium text-white">Test Scenarios</span>
                      </div>
                      <p className="text-sm text-slate-400">Ready-to-implement test cases</p>
                    </div>
                  </div>

                  <Callout type="tip" title="Next Step">
                    After reviewing, click <strong>"Apply to Ticket"</strong> to save the clarified scope to your Jira ticket description. This unlocks Step 2: Code Generation.
                  </Callout>
                </section>

                {/* Step 2: Generate Code */}
                <section id="generate-code">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    Step 2: Generate Code
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Once you've clarified your ticket and applied it, you can generate an initial code implementation.
                  </p>

                  <Callout type="warning" title="Prerequisite">
                    You must complete Step 1 and click "Apply to Ticket" before code generation becomes available.
                  </Callout>

                  <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
                    <h4 className="font-semibold text-white mb-4">How it works:</h4>
                    <ol className="space-y-3 text-slate-300">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-medium">1</span>
                        <span>After applying clarified scope, you'll see <strong className="text-white">"GoBot Code!"</strong> button</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-medium">2</span>
                        <span>Optionally add a <strong className="text-white">Custom Prompt</strong> (e.g., "Use Python" or "Include TypeScript types")</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-medium">3</span>
                        <span>Click <strong className="text-white">"GoBot Code!"</strong> and wait for generation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-medium">4</span>
                        <span>Review the generated implementation</span>
                      </li>
                    </ol>
                  </Card>

                  <Callout type="info" title="Code Quality">
                    Generated code is a starting point. Always review, test, and refine before using in production.
                  </Callout>
                </section>

                {/* Custom Prompts */}
                <section id="custom-prompts">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                    </div>
                    Custom Prompts
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Guide the AI with custom instructions for both clarification and code generation.
                  </p>

                  <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
                    <h4 className="font-semibold text-white mb-4">How to use:</h4>
                    <ol className="space-y-3 text-slate-300">
                      <li>1. Click the <strong className="text-white">"Custom Prompt"</strong> button before running GoBot</li>
                      <li>2. Enter your custom instructions in the text field</li>
                      <li>3. Click <strong className="text-white">"GoBot"</strong> or <strong className="text-white">"GoBot Code!"</strong> as usual</li>
                    </ol>
                  </Card>

                  <h4 className="font-semibold text-white mb-3">Example prompts:</h4>
                  <div className="space-y-3">
                    <CodeBlock code="Satisfy with Python" language="prompt" index={1} />
                    <CodeBlock code="Use TypeScript with strict types" language="prompt" index={2} />
                    <CodeBlock code="Focus on security requirements" language="prompt" index={3} />
                    <CodeBlock code="Include error handling for API calls" language="prompt" index={4} />
                  </div>
                </section>

                {/* Apply to Ticket */}
                <section id="apply-to-ticket">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    Apply to Ticket
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Save the clarified scope directly to your Jira ticket description.
                  </p>

                  <p className="text-slate-300 mb-4">
                    When you click <strong className="text-white">"Apply to Ticket"</strong>, GoBot updates your Jira issue description with formatted sections:
                  </p>

                  <ul className="space-y-2 text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ✅ Acceptance Criteria
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ⚠️ Edge Cases
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      📊 Success Metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      🧪 Test Scenarios
                    </li>
                  </ul>

                  <Callout type="tip" title="Refresh to See Changes">
                    After applying, refresh your browser to see the updated ticket description.
                  </Callout>
                </section>

                {/* Regenerate & Reset */}
                <section id="regenerate">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                    </div>
                    Regenerate & Reset
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Not happy with the results? You can regenerate or start over.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-5 bg-slate-900/50 border-slate-800">
                      <h4 className="font-medium text-white mb-2">GoBot Again</h4>
                      <p className="text-sm text-slate-400">Re-run clarification on the same ticket to get a fresh analysis. Great if you've updated the ticket or want different results.</p>
                    </Card>
                    <Card className="p-5 bg-slate-900/50 border-slate-800">
                      <h4 className="font-medium text-white mb-2">Reset</h4>
                      <p className="text-sm text-slate-400">Clear all generated content and start fresh. Use this to begin the workflow from scratch.</p>
                    </Card>
                  </div>
                </section>

                {/* Feedback */}
                <section id="feedback">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    Feedback System
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Help us improve GoBot by rating the quality of generated content.
                  </p>

                  <p className="text-slate-300 mb-4">
                    After each clarification, you'll see <strong className="text-white">"Scope clarification Good?"</strong> with thumbs up/down buttons. Your feedback helps us improve the AI.
                  </p>

                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <span className="text-slate-300">Scope clarification Good?</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-slate-600">
                        👍 Yes
                      </Button>
                      <Button variant="outline" size="sm" className="border-slate-600">
                        👎 No
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Plans */}
                <section id="plans">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    Plans & Limits
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    GoBot offers different plans to match your needs. Your current plan is displayed in the GoBot panel.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-3 text-slate-400 font-medium">Plan</th>
                          <th className="text-left py-3 text-slate-400 font-medium">Tickets/Month</th>
                          <th className="text-left py-3 text-slate-400 font-medium">Code Generation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        <tr>
                          <td className="py-3 text-white">Free</td>
                          <td className="py-3 text-slate-300">5</td>
                          <td className="py-3 text-slate-400">Basic snippets</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-white">Pro</td>
                          <td className="py-3 text-slate-300">100</td>
                          <td className="py-3 text-slate-300">Full generation</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-white">Team</td>
                          <td className="py-3 text-slate-300">Unlimited</td>
                          <td className="py-3 text-slate-300">Full generation + API</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6">
                    <Button 
                      onClick={() => window.location.href = '/checkout'}
                      className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90"
                    >
                      View All Plans
                    </Button>
                  </div>
                </section>

                {/* Troubleshooting */}
                <section id="troubleshooting">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    Troubleshooting
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-white mb-2">"Invalid access key" error</h4>
                      <p className="text-slate-300 text-sm mb-2">Make sure you're entering the key in the correct format: <code className="px-2 py-1 bg-slate-800 rounded text-emerald-400">GOBOT-XXXX-XXXX-XXXX</code></p>
                      <p className="text-slate-300 text-sm">Keys are case-insensitive but must match your purchase email.</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">"Failed to clarify ticket" error</h4>
                      <p className="text-slate-300 text-sm">This usually means a temporary issue. Wait a moment and try clicking "GoBot Again".</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">Changes not showing on ticket</h4>
                      <p className="text-slate-300 text-sm">After clicking "Apply to Ticket", refresh your browser to see the updated description.</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">"GoBot Code!" button not appearing</h4>
                      <p className="text-slate-300 text-sm">You must click "Apply to Ticket" after Step 1 clarification before code generation becomes available.</p>
                    </div>
                  </div>
                </section>

                {/* Next Steps */}
                <section className="pt-8 border-t border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6">What's Next?</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <a href="/support" className="group">
                      <Card className="p-5 bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white mb-1">Get Support</h4>
                            <p className="text-sm text-slate-400">Contact our team for help</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition" />
                        </div>
                      </Card>
                    </a>
                    <a href="/checkout" className="group">
                      <Card className="p-5 bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white mb-1">Upgrade Your Plan</h4>
                            <p className="text-sm text-slate-400">Get more tickets and features</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition" />
                        </div>
                      </Card>
                    </a>
                  </div>
                </section>

                {/* Page Feedback */}
                <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Was this page helpful?</h3>
                      <p className="text-sm text-slate-400 mb-4">Help us improve our documentation</p>
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="border-slate-700 hover:border-emerald-500 hover:text-emerald-400">
                          Yes, thanks!
                        </Button>
                        <Button variant="outline" size="sm" className="border-slate-700 hover:border-slate-600">
                          Could be better
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-800">
                <div></div>
                <a href="#clarify-tickets" className="group flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition">
                  Next: Clarify Tickets
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Table of Contents (Desktop) */}
        <aside className="hidden xl:block w-64 flex-shrink-0">
          <div className="sticky top-[97px] p-6">
            <h4 className="text-sm font-medium text-slate-400 mb-4">On this page</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#introduction" className="text-emerald-400 hover:text-emerald-300 transition">
                  What is GoBot?
                </a>
              </li>
              <li>
                <a href="#installation" className="text-slate-400 hover:text-white transition">
                  Installation
                </a>
              </li>
              <li>
                <a href="#activation" className="text-slate-400 hover:text-white transition">
                  Activating Your License
                </a>
              </li>
              <li>
                <a href="#clarify-tickets" className="text-slate-400 hover:text-white transition">
                  Step 1: Clarify Tickets
                </a>
              </li>
              <li>
                <a href="#generate-code" className="text-slate-400 hover:text-white transition">
                  Step 2: Generate Code
                </a>
              </li>
              <li>
                <a href="#custom-prompts" className="text-slate-400 hover:text-white transition">
                  Custom Prompts
                </a>
              </li>
              <li>
                <a href="#apply-to-ticket" className="text-slate-400 hover:text-white transition">
                  Apply to Ticket
                </a>
              </li>
              <li>
                <a href="#plans" className="text-slate-400 hover:text-white transition">
                  Plans & Limits
                </a>
              </li>
              <li>
                <a href="#troubleshooting" className="text-slate-400 hover:text-white transition">
                  Troubleshooting
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 relative z-10">
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