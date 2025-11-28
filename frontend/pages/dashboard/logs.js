import { useState, useEffect } from 'react';
import Layout from '../../components/dashboard/Layout';
import { withAuth } from '../../contexts/AuthContext';
import { BACKEND_URL } from '../../lib/config';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorOnly, setErrorOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [smsQueueStatus, setSmsQueueStatus] = useState(null);
  const [numLines, setNumLines] = useState(500);

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${BACKEND_URL}/api/admin/logs?lines=${numLines}&errorOnly=${errorOnly}`,
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      if (data.ok) {
        setLogs(data.logs);
      } else {
        throw new Error(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SMS queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/sms-queue`, {
        credentials: 'include'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.ok) {
        setSmsQueueStatus(data);
      }
    } catch (err) {
      console.error('Error fetching queue status:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
    fetchQueueStatus();
  }, [errorOnly, numLines]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
      fetchQueueStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, errorOnly, numLines]);

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.message?.toLowerCase().includes(search) ||
      log.level?.toLowerCase().includes(search) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(search)
    );
  });

  // Get color for log level
  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'DEBUG': return 'text-gray-500';
      case 'INFO': return 'text-blue-600';
      case 'WARN': return 'text-yellow-600';
      case 'ERROR': return 'text-red-600';
      case 'CRITICAL': return 'text-red-800 font-bold';
      default: return 'text-gray-600';
    }
  };

  // Get badge color for log level
  const getLevelBadgeColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'DEBUG': return 'bg-gray-100 text-gray-700';
      case 'INFO': return 'bg-blue-100 text-blue-700';
      case 'WARN': return 'bg-yellow-100 text-yellow-700';
      case 'ERROR': return 'bg-red-100 text-red-700';
      case 'CRITICAL': return 'bg-red-200 text-red-900 font-bold';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Export logs to CSV
  const exportToCSV = () => {
    const csv = [
      ['Timestamp', 'Level', 'Message', 'Metadata'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        JSON.stringify(log.metadata || {})
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desk-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor system activity and troubleshoot issues
          </p>
        </div>

        {/* SMS Queue Status */}
        {smsQueueStatus && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SMS Queue Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{smsQueueStatus.pending || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sent</p>
                <p className="text-2xl font-bold text-green-600">{smsQueueStatus.sent || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">{smsQueueStatus.failed || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{smsQueueStatus.total || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search logs
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search message, level, or metadata..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Number of lines */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of logs
              </label>
              <select
                value={numLines}
                onChange={(e) => setNumLines(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={5000}>5000</option>
              </select>
            </div>

            {/* Filter toggles */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={errorOnly}
                  onChange={(e) => setErrorOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Errors only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Auto-refresh (5s)</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Logs table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading logs...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${getLevelColor(log.level)}`}>
                        {log.message}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              Show details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Results info */}
          {filteredLogs.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Logs);
