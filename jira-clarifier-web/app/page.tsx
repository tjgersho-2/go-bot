'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap, Clock, CheckCircle2, Users, Star, Code, Target, TrendingUp, Shield, Rocket } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<'before' | 'after'>('before');
  const [count, setCount] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);

  // Smooth parallax
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });
  const y1 = useTransform(smoothProgress, [0, 1], [0, 300]);
  const y2 = useTransform(smoothProgress, [0, 1], [0, -200]);
  const opacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.3], [1, 0.9]);
 

  // Animated counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => (c < 4872 ? c + 89 : 4872));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-slate-950 overflow-hidden relative">
        {/* Animated Background Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
            animate={{
              x: mousePosition.x * 0.02,
              y: mousePosition.y * 0.02,
            }}
            transition={{ type: "spring", stiffness: 50 }}
          />
          <motion.div
            className="absolute top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              x: mousePosition.x * -0.02,
              y: mousePosition.y * 0.03,
            }}
            transition={{ type: "spring", stiffness: 50 }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
            animate={{
              x: mousePosition.x * 0.015,
              y: mousePosition.y * -0.02,
            }}
            transition={{ type: "spring", stiffness: 50 }}
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Hero */}
        <motion.section 
          ref={heroRef}
          style={{ opacity, scale }}
          className="container mx-auto px-4 pt-20 pb-32 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge className="mb-6 px-4 py-2 bg-indigo-500/10 border-indigo-500/30 backdrop-blur-sm" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Clarity Engine
              </Badge>
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-8xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                Stop Writing
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Bad Jira Tickets
              </span>
            </motion.h1>

            <motion.p 
              className="mt-6 text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Turn vague requests into{' '}
              <span className="font-semibold text-indigo-400 relative">
                crystal-clear acceptance criteria
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                />
              </span>{' '}
              in seconds with a click of a button. Save hours of time per sprint.
            </motion.p>

            <motion.div 
              className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
       
                <Button 
                  onClick={() => window.location.href = '/checkout?plan=free&forge=true'} 
                  size="lg" 
                  className="text-lg px-10 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                   Buy Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Button>


                <Button 
                  onClick={() => window.location.href = '/checkout'} 
                  size="lg" 
                  className="text-lg px-10 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/50 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                  View Pricing
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Button>

            </motion.div>

            <motion.div 
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {[
                { icon: CheckCircle2, color: "text-green-400", text: "No credit card" },
                { icon: Clock, color: "text-indigo-400", text: "30-second install" },
                { icon: Users, color: "text-purple-400", text: "Used by 4,872 devs" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-slate-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  {item.text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            className="absolute top-40 right-20 hidden lg:block"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
              <Code className="w-8 h-8 text-indigo-400" />
            </div>
          </motion.div>
          <motion.div
            className="absolute top-60 left-20 hidden lg:block"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-4 shadow-xl">
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>
        </motion.section>

        {/* Live Counter with Parallax */}
        <motion.div
          style={{ y: y2 }}
          className="relative z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-8 shadow-2xl"
        >
          <div className="container mx-auto px-4 text-center">
            <motion.p 
              className="text-4xl font-bold text-white"
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <motion.span
                key={count}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {count.toLocaleString()}+
              </motion.span>
              {' '}tickets clarified this week
            </motion.p>
          </div>
        </motion.div>

        {/* Interactive Before/After with Parallax */}
        <motion.section 
          style={{ y: y1 }}
          className="container mx-auto px-4 py-32 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              See the Magic in Action
            </h2>
            <p className="mt-4 text-xl text-slate-400">Watch vague become crystal clear</p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="flex justify-center gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Button
                variant={activeDemo === 'before' ? 'default' : 'outline'}
                onClick={() => setActiveDemo('before')}
                className={activeDemo === 'before' 
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white" 
                  : "border-slate-700 text-slate-300 hover:border-red-500"
                }
              >
                😵 Vague Ticket
              </Button>
              <Button
                variant={activeDemo === 'after' ? 'default' : 'outline'}
                onClick={() => setActiveDemo('after')}
                className={activeDemo === 'after' 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white" 
                  : "border-slate-700 text-slate-300 hover:border-green-500"
                }
              >
                ✨ AI-Clarified
              </Button>
            </motion.div>

            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-slate-800 relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${activeDemo === 'before' ? 'from-red-500/5 to-orange-500/5' : 'from-green-500/5 to-emerald-500/5'} pointer-events-none`} />
              
              <div className="relative z-10">
                {activeDemo === 'before' ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <span className="text-2xl">😵</span> Original Ticket
                    </h3>
                    <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                      <p className="text-3xl font-medium text-white mb-6">
                        "Fix login bug"
                      </p>
                      <p className="text-lg text-slate-400">
                        Users say they can't log in sometimes. Please look into it.
                      </p>
                      <div className="mt-8 flex gap-2">
                        <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/30">
                          Vague
                        </Badge>
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                          No Criteria
                        </Badge>
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                          Ambiguous
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        AI-Clarified in 3s
                      </h3>
                    </div>

                    <motion.div 
                      className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h4 className="font-semibold text-indigo-400 mb-4 text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Acceptance Criteria
                      </h4>
                      <ul className="space-y-4 text-slate-200">
                        {[
                          "Given valid credentials → login in <3s",
                          "Given invalid password → show clear error",
                          "Given unverified email → prompt verification"
                        ].map((item, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-3 text-lg"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                          >
                            <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div 
                        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h4 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Edge Cases
                        </h4>
                        <ul className="space-y-2 text-slate-300">
                          <li>• Network timeout</li>
                          <li>• Special characters in password</li>
                          <li>• Concurrent login attempts</li>
                        </ul>
                      </motion.div>

                      <motion.div 
                        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Success Metrics
                        </h4>
                        <ul className="space-y-2 text-slate-300">
                          <li>• Login success rate &gt;99.5%</li>
                          <li>• Zero P1 incidents in 30 days</li>
                        </ul>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials with Stagger */}
        <section className="bg-slate-900/50 backdrop-blur-xl py-32 relative z-10">
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-5xl md:text-6xl font-bold text-center mb-16 text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Engineers Love It
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { name: "Sarah Chen", role: "Engineering Manager @ ScaleAI", text: "Saved 8 hours per sprint. Our backlog is finally clean.", color: "from-indigo-500/20" },
                { name: "Mike Torres", role: "Staff Dev @ FinTech", text: "No more 'works on my machine' debates. ACs are now enforceable.", color: "from-purple-500/20" },
                { name: "Alex Kim", role: "PM @ Startup", text: "I write tickets 5x faster. Devs actually read them.", color: "from-pink-500/20" }
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <Card className={`p-8 h-full bg-gradient-to-br ${t.color} to-transparent backdrop-blur-xl border-slate-800 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                      <p className="text-slate-200 text-lg italic leading-relaxed">"{t.text}"</p>
                      <div className="mt-6 pt-6 border-t border-slate-800">
                        <p className="font-semibold text-white">{t.name}</p>
                        <p className="text-sm text-slate-400 mt-1">{t.role}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing with Hover Effects */}
        <section className="container mx-auto px-4 py-32 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-5xl md:text-6xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p 
              className="mt-4 text-xl text-slate-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Start free. Scale as you grow.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                period: "/month",
                features: ["5 clarifies/month", "Community support"],
                cta: "Current Plan",
                variant: "outline" as const,
                highlight: false,
                onClick: ()=> window.location.href = '/checkout?plan=free'
              },
              {
                name: "Pro",
                price: "$5",
                period: "/month",
                features: ["100 Clarifies/month", "Priority support"],
                cta: "Upgrade to Pro",
                variant: "default" as const,
                highlight: true,
                onClick: () => window.location.href = '/checkout?plan=pro'
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                features: ["Unlimited Clarifies", "Dedicated support"],
                cta: "Contact Sales",
                variant: "outline" as const,
                highlight: false,
                onClick: () => window.location.href = 'mailto:sales@jiraclarifier.com?subject=Enterprise%20Inquiry'
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -12, transition: { duration: 0.2 } }}
                className="relative"
              >
                {plan.highlight && (
                  <>
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
                    <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 border-0 z-20">
                      Most Popular
                    </Badge>
                  </>
                )}
                <Card className={`relative p-10 h-full bg-slate-900/50 backdrop-blur-xl ${plan.highlight ? 'border-indigo-500/50' : 'border-slate-800'} hover:border-slate-700 transition-all duration-300`}>
                  <h3 className="text-3xl font-bold text-white">{plan.name}</h3>
                  <div className="mt-6">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-lg text-slate-400">{plan.period}</span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, j) => (
                      <motion.li
                        key={j}
                        className="flex items-center gap-3 text-slate-300"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + j * 0.1 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                  <Button 
                    className={`mt-10 w-full h-14 text-lg ${plan.highlight ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : ''}`}
                    variant={plan.variant}
                    onClick={plan.onClick}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <motion.section 
          className="relative py-32 overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
                Ready to Write Better Tickets?
              </h2>
              <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join 4,872+ engineers saving 10+ hours per sprint.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
               <Button 
                  onClick={() => window.location.href = '/checkout?plan=pro&forge=true'} 
                  size="lg" 
                  className="text-xl px-12 h-16 bg-white text-indigo-600 hover:bg-slate-100 shadow-2xl"
                >
                  <Rocket className="mr-2 w-6 h-6" />
                  Get Started Now
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <footer className="py-12 border-t border-slate-800 relative z-10">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <p>© 2025 Jira Clarifier. Made with <span className="text-red-500">♥</span> for better software.</p>
          </div>
        </footer>
      </div>
    </>
  );
}