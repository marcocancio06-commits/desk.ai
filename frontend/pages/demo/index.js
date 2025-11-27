// ============================================================================
// DEMO LANDING PAGE - Entry point for demo flows
// ============================================================================
// A clean, professional landing page that directs users to:
// - Customer chat experience
// - Owner view (with intelligence panel)
// - Owner dashboard
// ============================================================================

import Head from 'next/head';
import Link from 'next/link';
import { DEMO_BUSINESS } from '../../config/demoConfig';

export default function DemoLanding() {
  return (
    <>
      <Head>
        <title>Demo | Desk.ai for {DEMO_BUSINESS.name}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              Live Demo
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              See Desk.ai in Action
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Watch how AI handles customer inquiries for <span className="text-white font-medium">{DEMO_BUSINESS.name}</span>, 
              qualifying leads and capturing details automatically.
            </p>
          </div>

          {/* Demo Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Customer View */}
            <Link href="/demo/chat" className="group block">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all h-full">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  Customer View
                </h3>
                <p className="text-gray-400 mb-4">
                  Experience the chat as a customer would. Try booking a detailing service and see how the AI qualifies the lead.
                </p>
                <div className="text-blue-400 text-sm flex items-center font-medium">
                  Try it
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Owner View */}
            <Link href="/demo-chat/owner" className="group block">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all h-full">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-green-400 transition-colors">
                  Owner View
                </h3>
                <p className="text-gray-400 mb-4">
                  See how business owners see AI-extracted info in real-time as customers chat. Watch the intelligence panel update live.
                </p>
                <div className="text-green-400 text-sm flex items-center font-medium">
                  Try it
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Dashboard Link */}
          <div className="text-center">
            <Link 
              href="/demo/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              View Owner Dashboard
            </Link>
          </div>

          {/* Features List */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium mb-1">Instant Responses</h4>
              <p className="text-sm text-gray-500">AI responds in seconds, 24/7</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h4 className="font-medium mb-1">Lead Qualification</h4>
              <p className="text-sm text-gray-500">Captures all booking details</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium mb-1">Time Savings</h4>
              <p className="text-sm text-gray-500">No more phone tag or missed calls</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center">
            <p className="text-sm text-gray-500">
              Powered by <Link href="/" className="text-blue-400 hover:underline">Desk.ai</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
