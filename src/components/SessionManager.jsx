import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { apiConfig } from '../config/api';

const SessionManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiConfig.endpoints.auth.sessions);
      setSessions(response.data.data.sessions);
      setError('');
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch active sessions');
    } finally {
      setLoading(false);
    }
  };

  const logoutAllSessions = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? This will end all your active sessions.')) {
      return;
    }

    try {
      setLoading(true);
      await api.post(apiConfig.endpoints.auth.logoutAll);
      setSuccess('Logged out from all devices successfully');
      
      // Log out the current user as well
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error('Error logging out all sessions:', err);
      setError('Failed to log out from all devices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceInfo = (userAgent) => {
    // Simple device detection
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown Device';
  };

  const getBrowserInfo = (userAgent) => {
    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Active Sessions</h2>
        <button
          onClick={logoutAllSessions}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Processing...' : 'Logout All Devices'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active sessions found</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 ${
                session.isCurrent 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">
                      {getDeviceInfo(session.userAgent)}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      {getBrowserInfo(session.userAgent)}
                    </span>
                    {session.isCurrent && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Current Session
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">IP Address:</span> {session.ipAddress}
                    </div>
                    <div>
                      <span className="font-medium">Login Time:</span> {formatDate(session.loginTime)}
                    </div>
                    <div>
                      <span className="font-medium">Last Activity:</span> {formatDate(session.lastActivity)}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {formatDate(session.expiresAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Security Information</h3>
        <p className="text-sm text-yellow-700">
          For security reasons, when you log in from a new device or browser, 
          all your other active sessions will be automatically logged out. 
          This prevents unauthorized access to your account.
        </p>
      </div>
    </div>
  );
};

export default SessionManager;