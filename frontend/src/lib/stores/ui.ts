import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  currentPortal: 'lenders' | 'developers' | 'buyers' | null
  theme: 'light' | 'dark'
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCurrentPortal: (portal: 'lenders' | 'developers' | 'buyers' | null) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentPortal: null,
  theme: 'light',

  setSidebarOpen: (open) =>
    set(() => ({
      sidebarOpen: open,
    })),

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setCurrentPortal: (portal) =>
    set(() => ({
      currentPortal: portal,
    })),

  setTheme: (theme) =>
    set(() => ({
      theme,
    })),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}))