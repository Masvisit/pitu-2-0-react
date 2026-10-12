import React, { useState } from 'react';
import { useTrainingStore } from '../store/trainingStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProgressPage() {
  const { baselineData } = useTrainingStore();
  const [chartType, setChartType] = useState('sector');

  // Mock chart data
  const sectorData = [
    { week: 1, sector: 6.0 },
    { week: 2, sector: 6.1 },
    { week: 3, sector: 6.2 },
    { week: 4, sector: 6.4 },
    { week: 5, sector: 6.6 },
    { week: 6, sector: 6.8 },
    { week: 7, sector: 7.0 },
    { week: 8, sector: 7.3 },
  ];

  const hrData = [
    { week: 1, avgHR: 140, maxHR: 180 },
    { week: 2, avgHR: 138, maxHR: 182 },
    { week: 3, avgHR: 135, maxHR: 180 },
    { week: 4, avgHR: 133, maxHR: 185 },
    { week: 5, avgHR: 130, maxHR: 188 },
    { week: 6, avgHR: 128, maxHR: 190 },
    { week: 7, avgHR: 125, maxHR: 192 },
    { week: 8, avgHR: 122, maxHR: 195 },
  ];

  const volumeData = [
    { week: 'W1', volume: 45 },
    { week: 'W2', volume: 48 },
    { week: 'W3', volume: 50 },
    { week: 'W4', volume: 55 },
    { week: 'W5', volume: 60 },
    { week: 'W6', volume: 65 },
    { week: 'W7', volume: 70 },
    { week: 'W8', volume: 68 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Progress Tracking</h1>
        <p className="text-gray-600">Monitor your training improvements</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Current Sector</p>
          <p className="text-3xl font-bold text-blue-600">{baselineData.currentSector}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-4 border border-red-200">
          <p className="text-sm text-gray-600 mb-1">Avg Heart Rate</p>
          <p className="text-3xl font-bold text-red-600">{baselineData.avgHR} bpm</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Weekly Volume</p>
          <p className="text-3xl font-bold text-green-600">65 km</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-purple-600">{baselineData.totalSessions}</p>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setChartType('sector')}
            className={`px-4 py-2 rounded font-semibold transition ${
              chartType === 'sector'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Sector Progress
          </button>
          <button
            onClick={() => setChartType('hr')}
            className={`px-4 py-2 rounded font-semibold transition ${
              chartType === 'hr'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Heart Rate
          </button>
          <button
            onClick={() => setChartType('volume')}
            className={`px-4 py-2 rounded font-semibold transition ${
              chartType === 'volume'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Weekly Volume
          </button>
        </div>

        {chartType === 'sector' && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Sector Level', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sector" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Sector Level" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === 'hr' && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hrData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'BPM', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgHR" stroke="#22c55e" strokeWidth={2} name="Average HR" />
              <Line type="monotone" dataKey="maxHR" stroke="#ef4444" strokeWidth={2} name="Max HR" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === 'volume' && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="volume" fill="#f59e0b" name="Weekly Distance" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Progress Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Progress Analysis</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-700">Advancement</p>
              <p className="text-sm text-gray-600">65%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-700">Consistency</p>
              <p className="text-sm text-gray-600">82%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-700">Improvement Rate</p>
              <p className="text-sm text-gray-600">78%</p>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-purple-500 h-3 rounded-full" style={{ width: '78%' }} />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-900 mb-2">🤖 Coach Recommendation</p>
          <p className="text-sm text-blue-800">You're on track! Maintain current intensity and focus on consistency. Consider increasing weekly volume by 5% next week if recovery is good.</p>
        </div>
      </div>
    </div>
  );
}
