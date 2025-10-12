import { User } from "@/lib/types";
import { useMemo } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface UserActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  initialize: (initialUser?: User) => void;
  initializeUser: () => Promise<void>;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        // State
        user: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        // Actions
        setUser: user => set({ user, error: null }),

        setLoading: isLoading => set({ isLoading }),

        setError: error => set({ error, isLoading: false }),

        logout: () => {
          set({
            user: null,
            error: null,
            isLoading: false,
            isInitialized: false,
          });
          // Clear persisted state
          if (typeof window !== "undefined") {
            localStorage.removeItem("user-store");
          }
        },

        initialize: initialUser => {
          if (initialUser) {
            set({
              user: initialUser,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
          } else {
            // If there's no initial user, mark as initialized but user is empty
            // Don't make API calls on the client side
            set({
              user: null,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
          }
        },

        initializeUser: async () => {
          set({ isLoading: true, error: null });
          try {
            // Fetch user data from API using httpOnly cookie
            // The cookie will be automatically included in the request
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/users/me`, {
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Include httpOnly cookies in request
            });

            if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                throw new Error('Authentication failed');
              }
              throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();
            set({
              user: userData,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Failed to initialize user:', error);
            set({
              user: null,
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to load user data',
            });
          }
        },
      }),
      {
        name: "user-store",
        // Only persist user data, not loading states
        partialize: state => ({
          user: state.user,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    {
      name: "user-store",
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useUserStore(state => state.user);
export const useUserLoading = () => useUserStore(state => state.isLoading);
export const useUserError = () => useUserStore(state => state.error);

// create separate hooks for actions to avoid object reconstruction
export const useSetUser = () => useUserStore(state => state.setUser);
export const useSetLoading = () => useUserStore(state => state.setLoading);
export const useSetError = () => useUserStore(state => state.setError);
export const useLogout = () => useUserStore(state => state.logout);
export const useInitializeUser = () => useUserStore(state => state.initialize);
export const useInitializeUserFromAPI = () => useUserStore(state => state.initializeUser);

// if you need to get multiple actions, use useMemo or shallow comparison
export const useUserActions = () => {
  return useMemo(
    () => ({
      setUser: useUserStore.getState().setUser,
      setLoading: useUserStore.getState().setLoading,
      setError: useUserStore.getState().setError,
      logout: useUserStore.getState().logout,
      initialize: useUserStore.getState().initialize,
    }),
    []
  );
};

// or use shallow comparison (recommended)
// export const useUserActionsShallow = () =>
//   useUserStore(
//     state => ({
//       setUser: state.setUser,
//       setLoading: state.setLoading,
//       setError: state.setError,
//       logout: state.logout,
//       initialize: state.initialize,
//     }),
//     shallow
//   );
