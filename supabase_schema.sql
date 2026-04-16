-- PROFILES TABLE (updated for email auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('student', 'vendor', 'admin')),
  full_name text,
  email text unique,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CATEGORIES TABLE
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null
);

-- MENU ITEMS TABLE
create table menu_items (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  name text not null,
  description text,
  price decimal not null,
  image_url text,
  is_available boolean default true,
  rating decimal default 5.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDERS TABLE
create table orders (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id),
  vendor_id uuid references profiles(id),
  total_amount decimal not null,
  status text check (status in ('pending', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDER ITEMS TABLE
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  quantity integer not null,
  price_at_order decimal not null
);

-- REALTIME SETUP
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- RLS POLICIES (Simplified for dev)
alter table profiles enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Profile policies
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can insert profiles" on profiles for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Menu item policies
create policy "Menu items are viewable by everyone" on menu_items for select using (true);
create policy "Vendors can insert menu items" on menu_items for insert with check (auth.uid() = vendor_id);
create policy "Vendors can update their menu items" on menu_items for update using (auth.uid() = vendor_id);
create policy "Vendors can delete their menu items" on menu_items for delete using (auth.uid() = vendor_id);

-- Order policies
create policy "Users can view their own orders" on orders for select using (auth.uid() = student_id or auth.uid() = vendor_id);
create policy "Students can insert orders" on orders for insert with check (auth.uid() = student_id);
create policy "Vendors can update their orders" on orders for update using (auth.uid() = vendor_id);

-- Order items policies
create policy "Order items are viewable by order participants" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and (orders.student_id = auth.uid() or orders.vendor_id = auth.uid()))
);
create policy "Students can insert order items" on order_items for insert with check (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.student_id = auth.uid())
);
