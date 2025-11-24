import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from './components/Layout';
import { withAuth, useAuth } from '../../contexts/AuthContext';

function Settings() {
  const router = useRouter();
  const { currentBusiness, businessLoading, businesses, switchBusiness, getCurrentBusinessId } = useAuth();
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false); // Changed from true
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Twilio SMS state
  const [twilioStatus, setTwilioStatus] = useState(null);
  const [loadingTwilio, setLoadingTwilio] = useState(false); // Changed from true
  
  // Team members state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false); // Changed from true
  
  const businessInfo = currentBusiness ? {
    name: currentBusiness.name,
    phone: currentBusiness.phone,
    email: 'owner@business.com',
    serviceAreas: currentBusiness.service_zip_codes || [],
  } : {
    name: 'Loading...',
    phone: '',
    email: '',
    serviceAreas: [],
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

  // Reload data when business changes
  useEffect(() => {
    if (currentBusiness && !businessLoading) {
      fetchCalendarStatus();
      fetchTwilioStatus();
      fetchTeamMembers();
    }
  }, [currentBusiness, businessLoading]);

  // Fetch calendar connection status
  const fetchCalendarStatus = async () => {
    const businessId = getCurrentBusinessId();
    if (!businessId) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/google/status?businessId=${businessId}`
      );
      const data = await response.json();
      
      if (data.ok) {
        setCalendarStatus(data.data);
      } else {
        // If server returns not configured, treat as "coming soon"
        setCalendarStatus({ connected: false, comingSoon: true });
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error);
      // On error, treat as "coming soon"
      setCalendarStatus({ connected: false, comingSoon: true });
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Fetch Twilio SMS status
  const fetchTwilioStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/twilio/status');
      const data = await response.json();
      
      if (data.ok) {
        setTwilioStatus(data.data);
      } else {
        setTwilioStatus({ configured: false });
      }
    } catch (error) {
      console.error('Error fetching Twilio status:', error);
      setTwilioStatus({ configured: false });
    } finally {
      setLoadingTwilio(false);
    }
  };

  // Fetch team members for current business
  const fetchTeamMembers = async () => {
    const businessId = getCurrentBusinessId();
    if (!businessId) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/business/${businessId}/team`);
      const data = await response.json();
      
      if (data.ok) {
        setTeamMembers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Invite team member
  const handleInviteTeamMember = async (e) => {
    e.preventDefault();
    const businessId = getCurrentBusinessId();
    if (!businessId) return;
    
    setInviting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/business/${businessId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail,
          role: inviteRole 
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setMessage({ type: 'success', text: 'Team member invited successfully!' });
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('staff');
        fetchTeamMembers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to invite team member' });
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      setMessage({ type: 'error', text: 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  // Connect Google Calendar - Disabled for demo
  const handleConnect = async () => {
    // Do nothing - feature is coming soon
    setMessage({ 
      type: 'info', 
      text: 'Google Calendar sync is coming soon. For now, use Desk.ai to track leads and appointments manually.' 
    });
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
      {/* Enhanced Gradient Header */}
      <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-transparent -m-8 p-8 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-slate-600">Configure your business and AI preferences</p>
          </div>
          
          {/* Business Selector (if multiple businesses) */}
          {businesses && businesses.length > 1 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-4 py-3">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Viewing Settings For:</label>
              <select
                value={currentBusiness?.id || ''}
                onChange={(e) => switchBusiness(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                {businesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-xl border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {message.type === 'success' ? '✅' : message.type === 'info' ? 'ℹ️' : '❌'}
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
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 border-2 border-blue-200">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Coming Soon
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
              // Not Connected State - Coming Soon
              <div className="text-center py-8">
                {/* Coming Soon Badge */}
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-2 border-blue-200 mb-4">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Coming Soon
                </div>

                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Google Calendar Sync
                </h3>
                
                {/* Info Banner */}
                <div className="mt-4 max-w-md mx-auto bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-800 text-left font-medium">
                      Google Calendar sync is coming soon. For now, use Desk.ai to track leads and appointments manually.
                    </p>
                  </div>
                </div>

                {/* Upcoming Features */}
                <div className="mt-6 bg-slate-50 rounded-xl p-5 border-2 border-slate-200 max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 text-left">Planned Features:</h4>
                  <ul className="text-sm text-slate-600 space-y-2.5 text-left">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2.5 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Automatically push appointments to Google Calendar</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2.5 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Detect scheduling conflicts with existing events</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2.5 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Two-way sync with automatic updates</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2.5 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Send calendar invites to customers</span>
                    </li>
                  </ul>
                </div>

                {/* Disabled Connect Button */}
                <div className="mt-6">
                  <button
                    onClick={handleConnect}
                    className="inline-flex items-center px-8 py-4 border-2 border-slate-300 text-base font-bold rounded-xl shadow-sm text-slate-500 bg-slate-100 cursor-not-allowed transition-all"
                    disabled
                  >
                    <svg className="mr-3 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z"/>
                    </svg>
                    Feature Coming Soon
                  </button>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  In the meantime, all appointments are securely stored in your Desk.ai dashboard
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Twilio SMS Integration */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h2 className="text-lg font-bold text-slate-900">Twilio SMS Integration</h2>
              </div>
              {loadingTwilio ? (
                <div className="inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : twilioStatus?.configured ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                  <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {twilioStatus?.testMode ? 'Test Mode' : 'Production'}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  Not Configured
                </span>
              )}
            </div>
          </div>
          
          <div className="px-6 py-6 space-y-4">
            {twilioStatus?.configured ? (
              <>
                {/* Connected state */}
                <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 mb-1">Twilio SMS is configured and active</p>
                    <p className="text-sm text-green-700">
                      Desk.ai can now handle customer SMS conversations automatically.
                    </p>
                  </div>
                </div>

                {/* Configuration details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Phone Number</span>
                    <span className="text-sm font-mono text-slate-900">{twilioStatus.phoneNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Account SID</span>
                    <span className="text-sm font-mono text-slate-900">{twilioStatus.accountSid}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Mode</span>
                    <span className={`text-sm font-semibold ${twilioStatus.testMode ? 'text-amber-600' : 'text-green-600'}`}>
                      {twilioStatus.testMode ? 'Sandbox / Test' : 'Production'}
                    </span>
                  </div>
                </div>

                {twilioStatus.testMode && (
                  <div className="flex items-start p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900 mb-1">Test Mode Active</p>
                      <p className="text-sm text-amber-700">
                        SMS will only work with verified phone numbers in your Twilio sandbox. 
                        To enable production SMS, configure a real Twilio phone number and set TWILIO_TEST_MODE=false.
                      </p>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="pt-3">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Active Features:</p>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">Inbound SMS webhook - auto-creates leads and responds with AI</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">Outbound SMS - send replies from lead dashboard</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">SMS conversation logging and history tracking</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">SMS badge on leads with text conversations</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Not configured state */}
                <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Twilio SMS is not configured</p>
                    <p className="text-sm text-blue-700">
                      To enable SMS conversations, add your Twilio credentials to the backend .env file. 
                      See TWILIO_SETUP.md for detailed instructions.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-semibold text-slate-700 mb-3">What you'll get:</p>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-slate-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">Automatic SMS lead capture and AI responses</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-slate-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">Two-way SMS conversations from the dashboard</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-slate-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">Full conversation history and SMS tracking</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-slate-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-600">Test mode for sandbox development</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-lg font-bold text-slate-900">Team Management</h2>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
              >
                + Invite Team Member
              </button>
            </div>
          </div>
          <div className="px-6 py-6">
            {loadingTeam ? (
              <div className="flex justify-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-slate-600 font-medium">No team members yet</p>
                <p className="text-sm text-slate-500 mt-1">Click "Invite Team Member" to add staff or managers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-slate-900">{member.email}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
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

        {/* System Monitoring */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-bold text-slate-900">System Monitoring</h2>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">View System Logs</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Monitor system activity, troubleshoot issues, and view SMS queue status
                  </p>
                  <a
                    href="/dashboard/logs"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Logs
                  </a>
                </div>
              </div>
            </div>
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

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleInviteTeamMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Staff can view leads. Managers can edit settings.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
export default withAuth(Settings);
