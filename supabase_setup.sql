-- Setup SQL Script for Coffee Shop POS Database (Supabase)
-- คัดลอกสคริปต์นี้ไปรันใน SQL Editor ของ Supabase Project ของคุณ

-- 1. สร้างตารางสินค้า (Products Table)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL CHECK (category IN ('coffee', 'tea', 'bakery', 'others')),
    stock INTEGER NOT NULL DEFAULT 100 CHECK (stock >= 0),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. สร้างตารางสมาชิกสำหรับสะสมแต้ม (Members Table)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. สร้างตารางธุรกรรมการขาย (Transactions Table)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_name TEXT NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    discount_applied NUMERIC NOT NULL DEFAULT 0 CHECK (discount_applied >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'promptpay', 'card')),
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    points_used INTEGER NOT NULL DEFAULT 0 CHECK (points_used >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. สร้างตารางรายละเอียดสินค้าในแต่ละธุรกรรม (Transaction Items Table)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. เพิ่มข้อมูลสินค้าเริ่มต้น (Sample Data)
INSERT INTO public.products (name, price, category, stock, image_url) VALUES
('Espresso', 55.00, 'coffee', 150, 'https://images.unsplash.com/photo-1510707513156-466d1cf937a7?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Americano', 60.00, 'coffee', 200, 'https://images.unsplash.com/photo-1551046713-b45fdb3a479a?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Iced Latte', 65.00, 'coffee', 120, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Cappuccino', 65.00, 'coffee', 100, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Caramel Macchiato', 75.00, 'coffee', 80, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Thai Tea Latte', 60.00, 'tea', 150, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Matcha Green Tea', 70.00, 'tea', 90, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Peach Iced Tea', 65.00, 'tea', 100, 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Butter Croissant', 65.00, 'bakery', 45, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Chocolate Fudge Cake', 80.00, 'bakery', 20, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Strawberry Cheesecake', 85.00, 'bakery', 15, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Blueberry Muffin', 55.00, 'bakery', 30, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Soft Chocolate Chip Cookie', 45.00, 'bakery', 50, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Mineral Water', 15.00, 'others', 100, 'https://images.unsplash.com/photo-1616119118554-e4610490b0e5?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3');

-- 6. เพิ่มข้อมูลสมาชิกเริ่มต้น (Sample Data)
INSERT INTO public.members (name, phone, email, points) VALUES
('สมชาย ใจดี', '0812345678', 'somchai@gmail.com', 120),
('สมหญิง รักดี', '0898765432', 'somying@yahoo.com', 45),
('วิชัย ตั้งใจ', '0855551234', 'wichai@outlook.com', 8)
ON CONFLICT (phone) DO NOTHING;

-- 7. เปิดการเข้าถึงผ่านนโยบาย Row Level Security (RLS) เพื่อให้ Client-side คิวรีตรงได้
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- สร้างสิทธิ์เข้าถึงทั้งหมดสำหรับ Anonymous / Authenticated Roles
DROP POLICY IF EXISTS "Allow all read access to products" ON public.products;
CREATE POLICY "Allow all read access to products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write access to products" ON public.products;
CREATE POLICY "Allow all write access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all read access to members" ON public.members;
CREATE POLICY "Allow all read access to members" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write access to members" ON public.members;
CREATE POLICY "Allow all write access to members" ON public.members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all read access to transactions" ON public.transactions;
CREATE POLICY "Allow all read access to transactions" ON public.transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write access to transactions" ON public.transactions;
CREATE POLICY "Allow all write access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all read access to transaction_items" ON public.transaction_items;
CREATE POLICY "Allow all read access to transaction_items" ON public.transaction_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all write access to transaction_items" ON public.transaction_items;
CREATE POLICY "Allow all write access to transaction_items" ON public.transaction_items FOR ALL USING (true) WITH CHECK (true);
