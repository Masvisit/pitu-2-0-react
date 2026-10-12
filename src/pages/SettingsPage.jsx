import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useTrainingStore } from '../store/trainingStore';

export default function SettingsPage() {
  const { currentUser, logout, users } = useAuthStore();
  const { clearUserData } = useTrainingStore();

  const handleExportData = () => {
    const trainingData = localStorage.getItem(`pitu_training_${currentUser.id}`);
    const dataStr = trainingData || '{}';
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pitu-training-${currentUser.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('This will delete ALL training data. Are you sure?')) {
      clearUserData();
      alert('All data has been cleared.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Settings</h1>
        <p className="text-gray-600">Manage your PITU 2.0 account and data</p>
      </div>

      {/* User Profile */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current User</h2>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{currentUser.name}</p>
            <p className="text-gray-600">ID: {currentUser.id}</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Management</h2>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition flex items-center justify-center gap-2"
          >
            📥 Export Training Data (JSON)
          </button>
          <p className="text-xs text-gray-500 text-center">Download your training data as a JSON file</p>
        </div>
      </div>

      {/* Other Users */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Users ({users.length})</h2>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: user.color }}
              >
                {user.name[0].toUpperCase()}
              </div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              {user.id === currentUser.id && (
                <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Currently logged in</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">About PITU 2.0</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Version:</strong> 1.3.0</p>
          <p><strong>Built with:</strong> React 18 + Vite 5</p>
          <p><strong>State Management:</strong> Zustand</p>
          <p><strong>Styling:</strong> Tailwind CSS</p>
          <p><strong>Storage:</strong> Browser localStorage (offline-first)</p>
          <p><strong>Target:</strong> Agent Rural Oposiciones Physical Test Preparation</p>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Session</h2>
        <button
          onClick={handleLogout}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded transition"
        >
          🚪 Logout
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-3">⚠️ Danger Zone</h2>
        <p className="text-sm text-red-800 mb-4">These actions cannot be undone.</p>
        <button
          onClick={handleClearAllData}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded transition"
        >
          🗑️ Clear All Training Data
        </button>
      </div>
    </div>
  );
}
