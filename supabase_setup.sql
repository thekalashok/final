-- Create tables for Kalaa Store

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  addresses JSONB DEFAULT '[]',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT REFERENCES categories(id),
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  sku TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  shipping_info TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media table
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create policies (Simplified for now, similar to your Firestore rules)
-- Allow public read for products and categories
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

-- Admin policies (assuming role is checked)
-- Note: In a real app, you'd use a more robust way to check admin status
CREATE POLICY "Admin full access products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admin full access categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admin full access customers" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admin full access media" ON media FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- User profile policy
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
