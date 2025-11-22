import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from './components/Layout';

export default function Settings() {
  const router = useRouter();
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  const businessId = 'demo-business-001';
  
  const businessInfo = {
    name: 'Your Service Business',
    phone: '+1-555-123-4567',
    email: 'owner@business.com',
    serviceAreas: ['77005', '77030', '77098'],
  };
  
  const businessHours = {
    weekdays: '8:00 AM - 6:00 PM',
    saturday: '9:00 AM - 4:00 PM',
    sunday: 'Closed',
  };

  const aiSettings = {
    greeting: 'Hello! Thanks for reaching out. How can I help you today?',
    tone: 'professional',
    requiredFields: ['name', 'phone', 'service'],
  };

  // Check for OAuth callback messages
  useEffect(() => {
    if (router.query.calendar === 'connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      router.replace('/dashboard/settings', undefined, { shallow: true });
      fetchCalendarStatus();
    } else if (router.query.calendar === 'error') {
      setMessage({ type: 'error', text: 'Failed to connect Google Calendar. Please try again.' });
      router.replace('/dashboard/settings', undefined, { shallow: true });
    }
  }, [router.query]);

  // Fetch calendar connection status
  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/google/status?businessId=${businessId}`
      );
      const data = await response.json();
      
      if (data.ok) {
        setCalendarStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    fetchCalendarStatus();
  }, []);

  // Connect Google Calendar
  const handleConnect = async () => {
    setConnecting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/google/connect?businessId=${businessId}`
      );
      const data = await response.json();

      if (data.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Failed to initiate Google Calendar connection' });
        setConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setMessage({ type: 'error', text: 'An error occurred while connecting' });
      setConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    setDisconnecting(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const data = await response.json();

      if (data.ok) {
        setMessage({ type: 'success', text: 'Google Calendar disconnected successfully' });
        setCalendarStatus({ connected: false });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect' });
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setMessage({ type: 'error', text: 'An error occurred while disconnecting' });
    } finally {
      setDisconnecting(false);
    }
  };

  // Trigger manual sync
  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const data = await response.json();

      if (data.ok) {
        const { eventsPushed, eventsPulled, conflictsDetected } = data.data;
        setMessage({ 
          type: 'success', 
          text: `Sync complete! Pushed: ${eventsPushed}, Pulled: ${eventsPulled}, Conflicts: ${conflictsDetected}` 
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setMessage({ type: 'error', text: 'An error occurred during sync' });
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <Layout>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 -m-8 p-8 mb-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Configure your business and AI preferences</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-xl border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Business Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-lg font-bold text-slate-900">Business Information</h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                defaultValue={businessInfo.name}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                disabled
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Settings are read-only in this demo
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue={businessInfo.phone}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={businessInfo.email}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Service Areas (ZIP Codes)
              </label>
              <div className="flex flex-wrap gap-2">
                {businessInfo.serviceAreas.map((zip) => (
                  <span
                    key={zip}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold shadow-sm"
                  >
                    {zip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-lg font-bold text-slate-900">AI Assistant Settings</h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Greeting Message
              </label>
              <textarea
                defaultValue={aiSettings.greeting}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all resize-none"
                disabled
              />
              <p className="text-xs text-slate-500 mt-2">First message customers see when they start a conversation</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Conversation Tone
              </label>
              <select
                defaultValue={aiSettings.tone}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all"
                disabled
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Required Information Fields
              </label>
              <div className="space-y-3">
                {[
                  { id: 'name', label: 'Customer Name', checked: aiSettings.requiredFields.includes('name') },
                  { id: 'phone', label: 'Phone Number', checked: aiSettings.requiredFields.includes('phone') },
                  { id: 'service', label: 'Service Type', checked: aiSettings.requiredFields.includes('service') },
                  { id: 'zip', label: 'ZIP Code', checked: false },
                  { id: 'urgency', label: 'Urgency Level', checked: false },
                ].map((field) => (
                  <label key={field.id} className="flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={field.checked}
                      disabled
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-slate-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Integrations - Google Calendar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                <h2 className="text-lg font-bold text-slate-900">Google Calendar Integration</h2>
              </div>
              
              {/* Status Badge */}
              {!loadingCalendar && calendarStatus && (
                <div>
                  {calendarStatus.connected ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-green-100 text-green-700 border-2 border-green-200">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-700 border-2 border-gray-200">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Not Connected
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-6">
            {loadingCalendar ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading calendar status...</p>
              </div>
            ) : calendarStatus && calendarStatus.connected ? (
              // Connected State
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center mr-4">
                      <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Connected to Google Calendar</div>
                      <div className="text-sm text-slate-600">{calendarStatus.email}</div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900 mb-3">Active Features:</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Push appointments to Google Calendar
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Pull external events for conflict detection
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Auto-sync every 5 minutes
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Conflict warnings on appointments
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex-1 inline-flex justify-center items-center px-4 py-3 border-2 border-blue-300 rounded-xl shadow-sm text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {syncing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-700 border-r-transparent"></div>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync Now
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="inline-flex justify-center items-center px-6 py-3 border-2 border-red-300 rounded-xl shadow-sm text-sm font-bold text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ) : (
              // Not Connected State  
              <div className="text-center py-8">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No calendar connected
                </h3>
                
                <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                  Connect your Google Calendar to automatically sync appointments, 
                  detect conflicts, and keep everything in one place.
                </p>

                <div className="mt-6">
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex items-center px-8 py-4 border-2 border-transparent text-base font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {connecting ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="mr-3 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z"/>
                        </svg>
                        Connect Google Calendar
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  <p>🔒 Secure OAuth 2.0 authentication</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integrations - Other */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-bold text-slate-900">Other Integrations</h2>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-slate-600">
              More integrations coming soon: Slack, SMS providers, Email, CRM systems...
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-bold text-slate-900 mb-2">More Settings Coming Soon</h3>
              <div className="text-sm text-slate-700 leading-relaxed">
                <p className="mb-3">
                  Full settings management will be available in the production version. This includes:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Editable business information and operating hours</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Customizable AI conversation flows and prompts</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Additional integrations (Slack, SMS, Email, CRM)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Team member roles and permissions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Billing and subscription management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}