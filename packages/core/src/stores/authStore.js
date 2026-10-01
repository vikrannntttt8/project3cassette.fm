import { createStore } from './playerStore.js';

export const useAuthStore = createStore({
  user: null,
  session: null,
  isLoading: true,
});

export const authActions = {
  setUser: (user) => useAuthStore.setState({ user }),
  setSession: (session) => useAuthStore.setState({ session, user: session?.user || null }),
  setLoading: (isLoading) => useAuthStore.setState({ isLoading }),
};
