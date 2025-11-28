import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/dashboard/Layout';
import { withAuth, useAuth } from '../../contexts/AuthContext';
import { Users, Mail, Shield, Trash2, X, UserPlus, Clock } from 'lucide-react';
import { BACKEND_URL } from '../../lib/config';

function TeamManagement() {
  const router = useRouter();
  const { currentBusiness, businessLoading, getCurrentBusinessId, userRole } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState(null);

  // Redirect if not owner
  useEffect(() => {
    if (!businessLoading && userRole !== 'owner') {
      router.push('/dashboard');
    }
  }, [userRole, businessLoading, router]);

  useEffect(() => {
    if (currentBusiness && !businessLoading) {
      fetchTeamMembers();
    }
  }, [currentBusiness, businessLoading]);

  const fetchTeamMembers = async () => {
    const businessId = getCurrentBusinessId();
    if (!businessId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/business/${businessId}/team`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.ok) {
        setTeamMembers(data.team || []);
        setPendingInvites(data.pending || []);
      } else {
        console.error('Failed to fetch team members:', data.error);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const businessId = getCurrentBusinessId();
    if (!businessId) return;

    if (!inviteEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setInviting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/business/${businessId}/invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        }
      );

      const data = await response.json();

      if (data.ok) {
        setMessage({
          type: 'success',
          text: data.type === 'direct_add' 
            ? 'Team member added successfully!' 
            : 'Invitation created. User will need to sign up first.',
        });
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('staff');
        fetchTeamMembers(); // Refresh list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to invite team member' });
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    const businessId = getCurrentBusinessId();
    if (!businessId) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/business/${businessId}/team/${userId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.ok) {
        setMessage({ type: 'success', text: 'Team member removed successfully' });
        fetchTeamMembers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove team member' });
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!confirm('Are you sure you want to delete this invitation?')) {
      return;
    }

    const businessId = getCurrentBusinessId();
    if (!businessId) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/business/${businessId}/invite/${inviteId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.ok) {
        setMessage({ type: 'success', text: 'Invitation deleted successfully' });
        fetchTeamMembers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete invitation' });
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700';
      case 'staff':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (businessLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-2">
                Manage who has access to your business dashboard
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Team Member
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <p>{message.text}</p>
          </div>
        )}

        {/* Team Members Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <span className="ml-auto text-sm text-gray-500">
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {member.email?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {member.full_name || member.email}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        {member.is_default && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove team member"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invites Card */}
        {pendingInvites.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-orange-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Pending Invitations</h2>
              <span className="ml-auto text-sm text-gray-500">
                {pendingInvites.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Mail className="w-10 h-10 text-orange-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            invite.role
                          )}`}
                        >
                          {invite.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Invited {new Date(invite.created_at).toLocaleDateString()} • Awaiting signup
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete invitation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Invite Team Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleInvite}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={inviting}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={inviting}
                  >
                    <option value="staff">Staff - View leads & calendar only</option>
                    <option value="owner">Owner - Full access</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={inviting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={inviting}
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(TeamManagement);
