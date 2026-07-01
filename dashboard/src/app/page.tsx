'use client';

import Link from 'next/link';
import { Bot, Cloud, MessageSquare, Shield, Users, Layers, ArrowRight, Check, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-dark-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-accent" />
              <span className="text-xl font-bold tracking-tight">Hunter's<span className="text-dark-100">AutoAdv</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-dark-100 hover:text-accent transition-colors">Services</a>
              <a href="#pricing" className="text-dark-100 hover:text-accent transition-colors">Pricing</a>
              <a href="#faq" className="text-dark-100 hover:text-accent transition-colors">FAQ</a>
              <Link href="/login" className="text-dark-100 hover:text-accent transition-colors">Sign In</Link>
              <Link href="/login" className="btn-primary text-sm">Get Started</Link>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-dark-600">
            <div className="px-4 py-4 space-y-4">
              <a href="#services" className="block text-dark-100 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Services</a>
              <a href="#pricing" className="block text-dark-100 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#faq" className="block text-dark-100 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <Link href="/login" className="block text-dark-100 hover:text-accent">Sign In</Link>
              <Link href="/login" className="btn-primary text-sm inline-block">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-dark-700 border border-dark-500 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-dark-100">24/7 Cloud Execution</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Discord Auto Messenger
            <br />
            <span className="text-dark-100">24/7 cloud runner</span>
          </h1>
          
          <p className="text-xl text-dark-100 max-w-2xl mx-auto mb-10">
            Send messages to multiple Discord channels, auto-reply to DMs, manage several accounts from one dashboard, and keep every campaign running server-side even when your browser is closed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="btn-primary text-lg flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#services" className="btn-secondary text-lg">Learn More</a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-3xl mx-auto">
            {[
              { label: 'Cloud Execution', value: '24/7' },
              { label: 'Free Trial', value: '10 min' },
              { label: 'Multi-Account', value: 'Up to 5' },
              { label: 'Encrypted Storage', value: 'AES-256' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-dark-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything needed to automate Discord outreach</h2>
          <p className="text-dark-100 text-center mb-16 max-w-2xl mx-auto">Built around channel automation, DM replies, account management, cloud execution, and safer token handling.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: 'Auto-send to channels', desc: 'Schedule and send messages across multiple Discord channels without manual posting.' },
              { icon: Users, title: 'DM auto-reply', desc: 'Reply automatically to incoming DMs once per user and keep your response flow active all day.' },
              { icon: Layers, title: 'Multiple Discord accounts', desc: 'Run more than one account from the same dashboard with independent settings and campaign control.' },
              { icon: Cloud, title: 'Cloud runner', desc: 'Everything keeps working server-side, so closing your browser does not stop your campaigns.' },
              { icon: Shield, title: 'Encrypted token storage', desc: 'Tokens are stored with safer handling and paired with rate-limiting style protection logic.' },
              { icon: Bot, title: 'Web dashboard access', desc: 'Manage your setup from desktop, tablet, and phone with a mobile-optimized front end.' },
            ].map((service) => (
              <div key={service.title} className="card hover:border-accent-dark/50 transition-colors group cursor-default">
                <service.icon className="w-10 h-10 mb-4 text-accent-dark group-hover:text-accent transition-colors" />
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-dark-100 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Choose Your Plan</h2>
          <p className="text-dark-100 text-center mb-12">Monthly subscriptions and a lifetime option. Pay with Litecoin.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Starter', version: 'v1', price: '$1', period: '/month', accounts: 1, features: [{ text: 'Channel messaging', included: true }, { text: 'Image attachments', included: false }, { text: 'Send all at once', included: true }, { text: 'Auto-reply to DMs', included: false }] },
              { name: 'Professional', version: 'v2', price: '$2', period: '/month', accounts: 3, popular: true, features: [{ text: 'Channel messaging', included: true }, { text: 'Image attachments', included: true }, { text: 'Send all at once', included: true }, { text: 'Auto-reply to DMs', included: false }] },
              { name: 'Elite Monthly', version: 'v3', price: '$3', period: '/month', accounts: 5, features: [{ text: 'Channel messaging', included: true }, { text: 'Image attachments', included: true }, { text: 'Send all at once', included: true }, { text: 'Auto-reply to DMs', included: true }] },
              { name: 'Elite Forever', version: 'Lifetime', price: '$30', period: 'one-time', accounts: 5, lifetime: true, features: [{ text: '5 Accounts forever', included: true }, { text: 'All features forever', included: true }, { text: 'Image attachments', included: true }, { text: 'Auto-reply to DMs', included: true }] },
            ].map((plan) => (
              <div key={plan.name} className={`card relative flex flex-col ${plan.popular ? 'border-accent-dark/50 bg-dark-700/50' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-dark text-dark-900 text-xs font-bold px-4 py-1 rounded-full">POPULAR</div>
                )}
                <div className="mb-4">
                  <div className="text-sm text-dark-100 mb-1">{plan.version}</div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-dark-100 ml-1">{plan.period}</span>
                </div>
                <div className="text-sm text-dark-100 mb-6"><Check className="w-4 h-4 inline mr-1 text-green-500" /> {plan.accounts} Discord Account{plan.accounts > 1 ? 's' : ''}</div>
                <div className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <div key={feat.text} className="flex items-center gap-2 text-sm">
                      {feat.included ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-dark-400 shrink-0" />}
                      <span className={feat.included ? 'text-accent' : 'text-dark-200'}>{feat.text}</span>
                    </div>
                  ))}
                </div>
                <Link href="/login" className={`w-full py-2.5 rounded-lg text-center font-semibold transition-all ${plan.lifetime ? 'bg-amber-900/20 text-amber-400 border border-amber-800/50 hover:bg-amber-900/30' : 'bg-dark-100 text-dark-900 hover:bg-white'}`}>Get Started</Link>
              </div>
            ))}
          </div>

          <div className="mt-8 card text-center border-dashed border-accent-dark/30 bg-dark-700/30">
            <h3 className="text-xl font-bold mb-2">Free Trial</h3>
            <p className="text-dark-100 mb-4">10 minutes full access to all features</p>
            <Link href="/login" className="btn-primary inline-block">Start Trial</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Answers to common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How does it work?', a: "Log in with Discord, choose a plan or start a trial, then configure your automation settings in the dashboard." },
              { q: 'Does it keep running if I close my browser?', a: 'Yes. Campaigns and reply systems continue through cloud execution 24/7.' },
              { q: 'Can I use more than one account?', a: 'Yes. v1 includes 1 account, v2 includes 3, and v3 includes 5 accounts. You can also purchase additional slots.' },
              { q: 'What crypto do you accept?', a: 'We accept Litecoin (LTC) only. A unique address is generated for each purchase.' },
              { q: 'What if I send the wrong amount?', a: 'We accept up to $0.10 under or over the required amount. Anything else, contact support on Discord.' },
              { q: 'Is this affiliated with Discord?', a: "No. Hunter's Auto Adv is not affiliated with Discord Inc. Use at your own risk." },
            ].map((faq, i) => (
              <details key={i} className="card group cursor-pointer">
                <summary className="font-medium flex items-center justify-between list-none">{faq.q}<span className="text-dark-100 group-open:rotate-45 transition-transform text-xl leading-none">+</span></summary>
                <p className="mt-4 text-dark-100 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-dark-600">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <span className="font-semibold">Hunter's<span className="text-dark-100">AutoAdv</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-dark-100">
            <span>Built by Hunter</span>
            <a href="#" className="hover:text-accent transition-colors underline underline-offset-2">Need help? Join our Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
