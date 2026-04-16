"use client";
import { Home, Search, ShoppingCart, User, ClipboardList, Package, ShieldCheck, Store, Users, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = useStore((state) => state.userRole);

  const studentItems = [
    { icon: Home,         label: 'Home',    path: '/home'    },
    { icon: Search,       label: 'Search',  path: '/search'  },
    { icon: ShoppingCart, label: 'Cart',    path: '/cart'    },
    { icon: User,         label: 'Account', path: '/account' },
  ];

  const vendorItems = [
    { icon: Home, label: 'Dashboard', path: '/vendor/dashboard' },
    { icon: ClipboardList, label: 'Orders', path: '/vendor/orders' },
    { icon: Package, label: 'Inventory', path: '/vendor/inventory' },
    { icon: User, label: 'Profile', path: '/vendor/profile' },
  ];

  const adminItems = [
    { icon: ShieldCheck, label: 'Admin', path: '/admin' },
    { icon: Store, label: 'Vendors', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin' },
    { icon: LogOut, label: 'Logout', path: '/' },
  ];

  const navItems = userRole === 'admin' ? adminItems : userRole === 'vendor' ? vendorItems : studentItems;

  // Hide nav on splash, login, register, add-item, item detail, and vendor application pages
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/vendor/add-item' ||
    pathname === '/vendor/register' ||
    pathname.startsWith('/item/')
  ) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white border-t border-slate-100 flex justify-around items-center py-3 pb-6 z-50 rounded-t-[32px] shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary scale-110' : 'text-slate-300'}`}
          >
            <Icon size={22} strokeWidth={isActive ? 3 : 2} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
