import { create } from 'zustand';

const BASELINE_DATA = {
  totalSessions: 71,
  trainingDays: 88,
  avgSessionMinutes: 45,
  avgHR: 135,
  maxHR: 180,
  restingHR: 60,
  vo2MaxEstimate: 45,
  currentSector: 6,
  targetSector: 10,
  workoutDistribution: {
    extended: 16,
    training: 39,
    long: 3,
    short: 13
  }
};

const EXERCISES = ['Navette', 'Piscina', 'Press Banca', 'Circuit Agilitat'];
const INTENSITIES = ['Easy', 'Moderate', 'Hard', 'Recovery'];

function generateWeekSessions(week) {
  const sessions = [];
  const sessionCount = Math.random() > 0.5 ? 4 : 5;
  
  for (let i = 0; i < sessionCount; i++) {
    sessions.push({
      id: `session_${week}_${i}`,
      week,
      day: i + 1,
      exercise: EXERCISES[Math.floor(Math.random() * EXERCISES.length)],
      intensity: INTENSITIES[Math.floor(Math.random() * INTENSITIES.length)],
      duration: Math.floor(Math.random() * 60 + 30),
      volume: Math.floor(Math.random() * 15 + 5),
      completed: false,
      notes: ''
    });
  }
  return sessions;
}

function generateWeekPlan() {
  return [
    { phase: 1, weeks: [1, 2, 3], targetSector: 6.5 },
    { phase: 2, weeks: [4, 5, 6], targetSector: 7.5 },
    { phase: 3, weeks: [7, 8, 9, 10], targetSector: 8.5 },
    { phase: 4, weeks: [11, 12], targetSector: 10 }
  ];
}

export const useTrainingStore = create((set, get) => ({
  baselineData: BASELINE_DATA,
  weekPlan: generateWeekPlan(),
  recentFiles: [],
  userSessions: {},

  loadUserData: (userId) => {
    const storedData = localStorage.getItem(`pitu_training_${userId}`);
    if (!storedData) {
      const allSessions = {};
      for (let week = 1; week <= 12; week++) {
        allSessions[`week_${week}`] = generateWeekSessions(week);
      }
      const initialData = {
        sessions: allSessions,
        baselineData: BASELINE_DATA
      };
      localStorage.setItem(`pitu_training_${userId}`, JSON.stringify(initialData));
      set({ userSessions: allSessions });
    } else {
      const data = JSON.parse(storedData);
      set({ userSessions: data.sessions });
    }
  },

  getWeekSessions: (week) => {
    const { userSessions } = get();
    return userSessions[`week_${week}`] || [];
  },

  addSession: (session) => {
    const { userSessions } = get();
    const week = session.week;
    const weekKey = `week_${week}`;
    
    if (!userSessions[weekKey]) {
      userSessions[weekKey] = [];
    }
    
    userSessions[weekKey].push(session);
    get().saveUserData();
  },

  updateSession: (sessionId, updates) => {
    const { userSessions } = get();
    
    for (const weekKey in userSessions) {
      const session = userSessions[weekKey].find(s => s.id === sessionId);
      if (session) {
        Object.assign(session, updates);
        break;
      }
    }
    
    get().saveUserData();
    set({ userSessions: { ...userSessions } });
  },

  addFitFile: (fileName, analysis) => {
    const { recentFiles } = get();
    set({ recentFiles: [fileName, ...recentFiles].slice(0, 10) });
  },

  saveUserData: () => {
    const { userSessions } = get();
    const currentUser = localStorage.getItem('pitu_session');
    if (currentUser) {
      const session = JSON.parse(currentUser);
      localStorage.setItem(`pitu_training_${session.userId}`, JSON.stringify({
        sessions: userSessions,
        baselineData: BASELINE_DATA
      }));
    }
  },

  clearUserData: () => {
    const currentUser = localStorage.getItem('pitu_session');
    if (currentUser) {
      const session = JSON.parse(currentUser);
      localStorage.removeItem(`pitu_training_${session.userId}`);
      set({ userSessions: {} });
    }
  }
}));