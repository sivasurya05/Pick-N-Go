import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Profile, UserRole } from '@/types';

interface AppState {
  profile: Profile | null;
  userRole: UserRole | null;
  cart: CartItem[];
  setProfile: (profile: Profile | null) => void;
  setUserRole: (role: UserRole | null) => void;
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      userRole: null,
      cart: [],
      setProfile: (profile) => set({ profile, userRole: profile?.role || null }),
      setUserRole: (role) => set({ userRole: role }),
      addToCart: (item) => set((state) => {
        const existing = state.cart.find((i) => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map((i) => 
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
      }),
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((i) => i.id !== id)
      })),
      updateQuantity: (id, delta) => set((state) => ({
        cart: state.cart.map((i) => 
          i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        ).filter(i => i.quantity > 0)
      })),
      clearCart: () => set({ cart: [] }),
      logout: () => set({ profile: null, userRole: null, cart: [] }),
    }),
    {
      name: 'pick-n-go-storage',
    }
  )
);
