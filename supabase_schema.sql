-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    mobile TEXT,
    addresses JSONB DEFAULT '[]'::jsonb,
    role TEXT DEFAULT 'user',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE
);

-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    name TEXT PRIMARY KEY
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT REFERENCES public.categories(name) ON DELETE SET NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    sku TEXT,
    status TEXT DEFAULT 'active',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create Policies (Simplified for hardcoded admin bypass)
-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public full access to products" ON public.products;
DROP POLICY IF EXISTS "Public full access to categories" ON public.categories;
DROP POLICY IF EXISTS "Public full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Public full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Admins have full access" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Users can read their own profile (if they have a session)
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Public access for products, categories, customers, and orders
-- (Required because we are using a hardcoded admin login that bypasses Supabase Auth)
CREATE POLICY "Public full access to products" ON public.products FOR ALL USING (TRUE);
CREATE POLICY "Public full access to categories" ON public.categories FOR ALL USING (TRUE);
CREATE POLICY "Public full access to customers" ON public.customers FOR ALL USING (TRUE);
CREATE POLICY "Public full access to orders" ON public.orders FOR ALL USING (TRUE);
