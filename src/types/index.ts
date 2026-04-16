export type UserRole = 'student' | 'vendor' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  is_available: boolean;
  rating?: number;
  vendor_id: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'collected' | 'cancelled';

export interface Order {
  id: string;
  student_id: string;
  vendor_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
  menu_items?: {
    name: string;
    image_url: string;
  };
}
