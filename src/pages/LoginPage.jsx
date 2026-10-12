import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const { login, addUser, deleteUser, users } = useAuthStore();
  const [selectedPin, setSelectedPin] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0066cc');

  const colors = [
    '#0066cc', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  const handleLogin = (userId) => {
    if (selectedPin) {
      login(userId, selectedPin);
      setSelectedPin('');
    }
  };

  const handleCreateUser = () => {
    if (newUserName && newUserPin) {
      addUser(newUserName, newUserPin, selectedColor);
      setNewUserName('');
      setNewUserPin('');
      setSelectedColor('#0066cc');
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PITU 2.0</h1>
          <p className="text-gray-600">Agent Rural Training System</p>
        </div>

        {!isCreatingUser ? (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select User</h2>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No users yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {users.map(user => (
                  <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{user.name}</span>
                      </div>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter PIN"
                      value={selectedPin}
                      onChange={(e) => setSelectedPin(e.target.value)}
                      className="w-full border rounded px-3 py-2 mb-3 text-center text-2xl tracking-widest"
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin(user.id)}
                    />
                    <button
                      onClick={() => handleLogin(user.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
                    >
                      Login
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsCreatingUser(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition"
            >
              + Create New User
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New User</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full border rounded px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">PIN (4 digits)</label>
                <input
                  type="password"
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="0000"
                  maxLength="4"
                  className="w-full border rounded px-4 py-2 text-center text-2xl tracking-widest"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-3">Choose Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full transition ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateUser}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition"
              >
                Create User
              </button>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
