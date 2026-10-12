import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  currentUser: null,
  users: [],
  isAuthenticated: false,

  initAuth: () => {
    const storedUsers = localStorage.getItem('pitu_users');
    const storedSession = localStorage.getItem('pitu_session');

    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      set({ users });

      if (storedSession) {
        const session = JSON.parse(storedSession);
        const user = users.find(u => u.id === session.userId);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
        }
      }
    } else {
      const demoUsers = [
        { id: 'user_1', name: 'Àlex', pin: '1234', color: '#14532d' },
        { id: 'user_2', name: 'Anna', pin: '5678', color: '#0e7490' }
      ];
      localStorage.setItem('pitu_users', JSON.stringify(demoUsers));
      set({ users: demoUsers });
    }
  },

  login: (userId, pin) => {
    const { users } = get();
    const user = users.find(u => u.id === userId);

    if (user && user.pin === pin) {
      localStorage.setItem('pitu_session', JSON.stringify({ userId }));
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('pitu_session');
    set({ currentUser: null, isAuthenticated: false });
  },

  addUser: (name, pin, color) => {
    const { users } = get();
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      pin,
      color
    };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('pitu_users', JSON.stringify(updatedUsers));
    set({ users: updatedUsers });
  },

  deleteUser: (userId) => {
    const { users, currentUser } = get();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('pitu_users', JSON.stringify(updatedUsers));
    set({ users: updatedUsers });

    if (currentUser?.id === userId) {
      localStorage.removeItem('pitu_session');
      set({ currentUser: null, isAuthenticated: false });
    }
  }
}));