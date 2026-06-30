/**
 * Caffeine POS - Application Core Logic
 * Handles Authentication, Database connection, POS operations,
 * Loyalty Points, and SVG Dashboard rendering.
 * Pure Vanilla JS, highly compatible with local file execution and static web hosts.
 */

// Global State
let supabaseClient = null;
let dbConnected = false;

let state = {
    currentUser: null, // { email, role: 'admin'|'cashier', name }
    products: [],
    members: [],
    transactions: [],
    cart: [],
    activeMember: null,
    activeCategory: 'all',
    activeView: 'pos',
    pointsRedemptionUsed: false,
    paymentMethod: 'cash',
    pointsRatio: 20, // 20 Baht = 1 point
    redeemRatio: 1   // 1 point = 1 Baht discount
};

// Initial Sample Data (for Offline / LocalStorage mode)
const INITIAL_PRODUCTS = [
    { id: 'p1', name: 'Espresso', price: 55.00, category: 'coffee', stock: 150, image_url: 'https://images.unsplash.com/photo-1510707513156-466d1cf937a7?w=300&auto=format&fit=crop&q=60' },
    { id: 'p2', name: 'Americano', price: 60.00, category: 'coffee', stock: 200, image_url: 'https://images.unsplash.com/photo-1551046713-b45fdb3a479a?w=300&auto=format&fit=crop&q=60' },
    { id: 'p3', name: 'Iced Latte', price: 65.00, category: 'coffee', stock: 120, image_url: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=300&auto=format&fit=crop&q=60' },
    { id: 'p4', name: 'Cappuccino', price: 65.00, category: 'coffee', stock: 100, image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=300&auto=format&fit=crop&q=60' },
    { id: 'p5', name: 'Caramel Macchiato', price: 75.00, category: 'coffee', stock: 8, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300&auto=format&fit=crop&q=60' },
    { id: 'p6', name: 'Thai Tea Latte', price: 60.00, category: 'tea', stock: 150, image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=60' },
    { id: 'p7', name: 'Matcha Green Tea', price: 70.00, category: 'tea', stock: 90, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&auto=format&fit=crop&q=60' },
    { id: 'p8', name: 'Peach Iced Tea', price: 65.00, category: 'tea', stock: 100, image_url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=300&auto=format&fit=crop&q=60' },
    { id: 'p9', name: 'Butter Croissant', price: 65.00, category: 'bakery', stock: 45, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60' },
    { id: 'p10', name: 'Chocolate Fudge Cake', price: 80.00, category: 'bakery', stock: 20, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=60' },
    { id: 'p11', name: 'Strawberry Cheesecake', price: 85.00, category: 'bakery', stock: 5, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&auto=format&fit=crop&q=60' },
    { id: 'p12', name: 'Blueberry Muffin', price: 55.00, category: 'bakery', stock: 30, image_url: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&auto=format&fit=crop&q=60' },
    { id: 'p13', name: 'Mineral Water', price: 15.00, category: 'others', stock: 100, image_url: 'https://images.unsplash.com/photo-1616119118554-e4610490b0e5?w=300&auto=format&fit=crop&q=60' }
];

const INITIAL_MEMBERS = [
    { id: 'm1', name: 'สมชาย ใจดี', phone: '0812345678', email: 'somchai@gmail.com', points: 120, created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
    { id: 'm2', name: 'สมหญิง รักดี', phone: '0898765432', email: 'somying@yahoo.com', points: 45, created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
    { id: 'm3', name: 'วิชัย ตั้งใจ', phone: '0855551234', email: 'wichai@outlook.com', points: 8, created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() }
];

const INITIAL_TRANSACTIONS = [
    { id: 'tx-8271', cashier_name: 'Cashier User', member_id: 'm1', total_amount: 180.00, discount_applied: 0.00, payment_method: 'cash', points_earned: 9, points_used: 0, created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), items: [{ name: 'Iced Latte', qty: 2, price: 65 }, { name: 'Espresso', qty: 1, price: 50 }] },
    { id: 'tx-8272', cashier_name: 'Cashier User', member_id: 'm2', total_amount: 145.00, discount_applied: 10.00, payment_method: 'promptpay', points_earned: 7, points_used: 10, created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), items: [{ name: 'Strawberry Cheesecake', qty: 1, price: 85 }, { name: 'Thai Tea Latte', qty: 1, price: 60 }] },
    { id: 'tx-8273', cashier_name: 'Admin User', member_id: null, total_amount: 110.00, discount_applied: 0.00, payment_method: 'card', points_earned: 0, points_used: 0, created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), items: [{ name: 'Blueberry Muffin', qty: 2, price: 55 }] },
    { id: 'tx-8274', cashier_name: 'Cashier User', member_id: 'm1', total_amount: 125.00, discount_applied: 20.00, payment_method: 'cash', points_earned: 6, points_used: 20, created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), items: [{ name: 'Caramel Macchiato', qty: 1, price: 75 }, { name: 'Peach Iced Tea', qty: 1, price: 65 }] }
];

/* ==========================================================================
   1. Initialize App & DB Connections
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLocalData();
    checkAuthSession();
    initializeSupabase();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('caffeine-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('caffeine-theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

// Local Database Fallback Initialization
function initLocalData() {
    if (!localStorage.getItem('caffeine_products')) {
        localStorage.setItem('caffeine_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem('caffeine_members')) {
        localStorage.setItem('caffeine_members', JSON.stringify(INITIAL_MEMBERS));
    }
    if (!localStorage.getItem('caffeine_transactions')) {
        localStorage.setItem('caffeine_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }
    
    // Load config settings
    const pointsRatio = localStorage.getItem('caffeine_points_ratio');
    if (pointsRatio) state.pointsRatio = parseFloat(pointsRatio);
    const redeemRatio = localStorage.getItem('caffeine_redeem_ratio');
    if (redeemRatio) state.redeemRatio = parseFloat(redeemRatio);
    
    document.getElementById('setting-points-ratio').value = state.pointsRatio;
    document.getElementById('setting-redeem-ratio').value = state.redeemRatio;
}

// Supabase Init Wrapper
function initializeSupabase() {
    // 1. Check for placeholders replaced by Vercel deployment
    const envUrl = '%%VITE_SUPABASE_URL%%';
    const envKey = '%%VITE_SUPABASE_ANON_KEY%%';
    
    // 2. Read from localStorage next
    const localUrl = localStorage.getItem('caffeine_supabase_url');
    const localKey = localStorage.getItem('caffeine_supabase_key');
    
    // If the placeholder hasn't been replaced by a deployment script, ignore it
    const url = (envUrl && !envUrl.startsWith('%%')) ? envUrl : localUrl;
    const key = (envKey && !envKey.startsWith('%%')) ? envKey : localKey;
    
    if (url && key) {
        document.getElementById('setting-supabase-url').value = url;
        document.getElementById('setting-supabase-key').value = key;
        
        try {
            // Initialize connection using CDN global object window.supabase
            if (window.supabase) {
                supabaseClient = window.supabase.createClient(url, key);
                verifySupabaseConnection();
            } else {
                console.warn('Supabase SDK not loaded yet');
                setOfflineMode();
            }
        } catch (e) {
            console.error('Failed to initialize Supabase client:', e);
            setOfflineMode();
        }
    } else {
        setOfflineMode();
    }
}

async function verifySupabaseConnection() {
    try {
        if (!supabaseClient) throw new Error('Client not initialized');
        // Query product limit 1 to verify credentials
        const { data, error } = await supabaseClient.from('products').select('id').limit(1);
        if (error) throw error;
        
        dbConnected = true;
        updateConnectionStatus(true);
        loadAllData();
    } catch (e) {
        console.warn('Supabase credentials invalid or unreachable, running in local fallback:', e);
        setOfflineMode();
    }
}

function setOfflineMode() {
    dbConnected = false;
    updateConnectionStatus(false);
    loadAllData();
}

function updateConnectionStatus(connected) {
    const badge = document.getElementById('db-status-badge');
    const text = document.getElementById('db-status-text');
    if (connected) {
        badge.className = 'db-status connected';
        text.innerText = 'เชื่อมต่อฐานข้อมูล (Supabase)';
    } else {
        badge.className = 'db-status offline';
        text.innerText = 'โหมดจำลอง (Offline)';
    }
}

// Data Loader
async function loadAllData() {
    if (dbConnected && supabaseClient) {
        try {
            // Load products
            let { data: productsData, error: err1 } = await supabaseClient.from('products').select('*').order('name');
            if (err1) throw err1;
            state.products = productsData;
            
            // Load members
            let { data: membersData, error: err2 } = await supabaseClient.from('members').select('*').order('name');
            if (err2) throw err2;
            state.members = membersData;

            // Load transactions (join items)
            let { data: txsData, error: err3 } = await supabaseClient.from('transactions').select(`
                *,
                members ( name ),
                transaction_items ( * )
            `).order('created_at', { ascending: false });
            if (err3) throw err3;
            
            // Map to unified transactions state
            state.transactions = txsData.map(tx => ({
                id: tx.id,
                cashier_name: tx.cashier_name,
                member_id: tx.member_id,
                member_name: tx.members ? tx.members.name : null,
                total_amount: parseFloat(tx.total_amount),
                discount_applied: parseFloat(tx.discount_applied),
                payment_method: tx.payment_method,
                points_earned: tx.points_earned,
                points_used: tx.points_used,
                created_at: tx.created_at,
                items: tx.transaction_items.map(item => ({
                    name: item.product_name,
                    qty: item.quantity,
                    price: parseFloat(item.price)
                }))
            }));
            
            showToast('ดาวน์โหลดข้อมูลจาก Supabase สำเร็จ', 'success');
        } catch (e) {
            console.error('Error fetching data from Supabase, loading LocalStorage:', e);
            showToast('ไม่สามารถดึงข้อมูลจาก Cloud ได้ สลับไปใช้ข้อมูลจำลอง', 'warning');
            loadLocalStorageData();
        }
    } else {
        loadLocalStorageData();
    }
    
    // Refresh current view content
    renderPOSProducts();
    renderProductTable();
    renderMemberTable();
    renderDashboard();
}

function loadLocalStorageData() {
    state.products = JSON.parse(localStorage.getItem('caffeine_products')) || [];
    state.members = JSON.parse(localStorage.getItem('caffeine_members')) || [];
    state.transactions = JSON.parse(localStorage.getItem('caffeine_transactions')) || [];
}

function saveLocalStorageData() {
    if (!dbConnected) {
        localStorage.setItem('caffeine_products', JSON.stringify(state.products));
        localStorage.setItem('caffeine_members', JSON.stringify(state.members));
        localStorage.setItem('caffeine_transactions', JSON.stringify(state.transactions));
    }
}

/* ==========================================================================
   2. Authentication Logic
   ========================================================================== */
function checkAuthSession() {
    const session = JSON.parse(localStorage.getItem('caffeine_session'));
    if (session) {
        state.currentUser = session;
        document.getElementById('auth-overlay').classList.add('hidden');
        updateUserHeader();
    } else {
        document.getElementById('auth-overlay').classList.remove('hidden');
    }
}

function switchAuthTab(tab) {
    const demoBtn = document.querySelector('[onclick="switchAuthTab(\'demo\')"]');
    const supabaseBtn = document.querySelector('[onclick="switchAuthTab(\'supabase\')"]');
    const demoForm = document.getElementById('demo-login-form');
    const supabaseForm = document.getElementById('supabase-login-form');
    
    if (tab === 'demo') {
        demoBtn.classList.add('active');
        supabaseBtn.classList.remove('active');
        demoForm.classList.remove('hidden');
        supabaseForm.classList.add('hidden');
    } else {
        demoBtn.classList.remove('active');
        supabaseBtn.classList.add('active');
        demoForm.classList.add('hidden');
        supabaseForm.classList.remove('hidden');
    }
}

function handleDemoLogin(e) {
    e.preventDefault();
    const role = document.getElementById('demo-role').value;
    const name = role === 'admin' ? 'Admin Manager' : 'Cashier User';
    
    state.currentUser = { email: 'demo@cafe.com', role: role, name: name };
    localStorage.setItem('caffeine_session', JSON.stringify(state.currentUser));
    document.getElementById('auth-overlay').classList.add('hidden');
    updateUserHeader();
    showToast('เข้าสู่ระบบแบบ Demo แล้ว', 'success');
}

async function handleSupabaseLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!supabaseClient) {
        showToast('กรุณากรอกข้อมูล Supabase URL & Key ในการตั้งค่าก่อนใช้งาน', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Simulating role based on email or default admin
        const role = email.includes('admin') ? 'admin' : 'cashier';
        const name = data.user.email.split('@')[0];
        
        state.currentUser = { email: data.user.email, role: role, name: name };
        localStorage.setItem('caffeine_session', JSON.stringify(state.currentUser));
        document.getElementById('auth-overlay').classList.add('hidden');
        updateUserHeader();
        showToast('ลงชื่อเข้าใช้งาน Supabase สำเร็จ', 'success');
        loadAllData();
    } catch (error) {
        console.error(error);
        showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง: ' + error.message, 'error');
    }
}

async function handleSupabaseSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!supabaseClient) {
        showToast('กรุณากรอกข้อมูล Supabase URL & Key ในการตั้งค่าก่อนสมัครสมาชิก', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        showToast('สมัครสมาชิกสำเร็จแล้ว! คุณสามารถใช้ข้อมูลนี้ลงชื่อเข้าใช้งานได้', 'success');
    } catch (error) {
        console.error(error);
        showToast('สมัครสมาชิกไม่สำเร็จ: ' + error.message, 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('caffeine_session');
    state.currentUser = null;
    state.cart = [];
    state.activeMember = null;
    document.getElementById('auth-overlay').classList.remove('hidden');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
}

function updateUserHeader() {
    if (!state.currentUser) return;
    
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    const avatarEl = document.getElementById('current-user-avatar');
    
    nameEl.innerText = state.currentUser.name;
    roleEl.innerText = state.currentUser.role === 'admin' ? 'ผู้จัดการร้าน (Admin)' : 'พนักงานขาย (Cashier)';
    avatarEl.innerText = state.currentUser.name.charAt(0).toUpperCase();
    
    // Toggle Admin Only view constraints
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (state.currentUser.role === 'admin') {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

/* ==========================================================================
   3. View Router Management
   ========================================================================== */
function switchView(viewName) {
    // Check permission
    if (viewName === 'dashboard' && state.currentUser && state.currentUser.role !== 'admin') {
        showToast('ขออภัย เฉพาะระดับผู้จัดการ (Admin) เท่านั้นที่สามารถดูแดชบอร์ดได้', 'warning');
        return;
    }
    
    state.activeView = viewName;
    
    // View IDs mapping
    const views = ['pos', 'dashboard', 'products', 'members', 'settings'];
    views.forEach(v => {
        const container = document.getElementById(`view-${v}-container`);
        const navItem = document.getElementById(`nav-${v}`);
        
        if (v === viewName) {
            container.classList.remove('hidden');
            navItem.classList.add('active');
        } else {
            container.classList.add('hidden');
            navItem.classList.remove('active');
        }
    });
    
    // Title mappings
    const titleEl = document.getElementById('view-title');
    const subtitleEl = document.getElementById('view-subtitle');
    
    switch (viewName) {
        case 'pos':
            titleEl.innerText = 'ขายหน้าร้าน (POS)';
            subtitleEl.innerText = 'เลือกสินค้า ค้นหาสมาชิก และทำรายการชำระเงิน';
            renderPOSProducts();
            break;
        case 'dashboard':
            titleEl.innerText = 'แดชบอร์ด & รายงาน';
            subtitleEl.innerText = 'วิเคราะห์ยอดขายและประวัติการทำรายการแบบเรียลไทม์';
            renderDashboard();
            break;
        case 'products':
            titleEl.innerText = 'จัดการสินค้า';
            subtitleEl.innerText = 'เพิ่ม ลบ แก้ไข รายการและจำนวนสต็อกเครื่องดื่ม/เบเกอรี่';
            renderProductTable();
            break;
        case 'members':
            titleEl.innerText = 'สมาชิก & ระบบสะสมแต้ม';
            subtitleEl.innerText = 'ตรวจสอบรายชื่อลูกค้าสะสมคะแนน และลงทะเบียนสมาชิกใหม่';
            renderMemberTable();
            break;
        case 'settings':
            titleEl.innerText = 'ตั้งค่าระบบ';
            subtitleEl.innerText = 'จัดการการตั้งค่าฐานข้อมูล อัตราสะสมคะแนน และรีเซ็ตข้อมูล';
            break;
    }
    
    lucide.createIcons();
}

/* ==========================================================================
   4. POS Cart & Loyalty Point Calculations
   ========================================================================== */
function filterPOSCategory(category) {
    state.activeCategory = category;
    
    // Toggle active classes
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Find matching tab
    if (window.event) {
        window.event.currentTarget.classList.add('active');
    }
    
    filterPOSProducts();
}

function filterPOSProducts() {
    const searchQuery = document.getElementById('pos-search-input').value.toLowerCase();
    const filtered = state.products.filter(p => {
        const matchesCategory = state.activeCategory === 'all' || p.category === state.activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });
    
    renderPOSGrid(filtered);
}

function renderPOSProducts() {
    filterPOSProducts();
}

function renderPOSGrid(productList) {
    const grid = document.getElementById('pos-products-grid');
    grid.innerHTML = '';
    
    if (productList.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; color: var(--text-muted);">
                <i data-lucide="info" style="width:36px; height:36px; margin-bottom:10px;"></i>
                <span>ไม่พบข้อมูลสินค้า</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    productList.forEach(p => {
        const isLowStock = p.stock <= 10;
        const stockLabelClass = isLowStock ? 'product-stock low-stock' : 'product-stock';
        const cardHtml = `
            <div class="product-card" onclick="addToCart('${p.id}')">
                <div class="product-image-container">
                    <span class="product-badge ${p.category}">${p.category}</span>
                    <img src="${p.image_url || 'https://via.placeholder.com/300?text=' + p.name}" alt="${p.name}">
                </div>
                <div class="product-info">
                    <h4 class="product-name">${p.name}</h4>
                    <div class="product-footer">
                        <span class="product-price">${p.price.toFixed(2)} ฿</span>
                        <span class="${stockLabelClass}">คงเหลือ: ${p.stock}</span>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        showToast('สินค้าหมดชั่วคราว ไม่สามารถขายได้', 'error');
        return;
    }
    
    const cartItem = state.cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.qty + 1 > product.stock) {
            showToast(`สินค้าชิ้นนี้มีในสต็อกเพียง ${product.stock} ชิ้นเท่านั้น`, 'warning');
            return;
        }
        cartItem.qty += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1
        });
    }
    
    showToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
    renderCart();
}

function updateCartItemQty(productId, delta) {
    const cartItem = state.cart.find(item => item.id === productId);
    const product = state.products.find(p => p.id === productId);
    
    if (cartItem) {
        const newQty = cartItem.qty + delta;
        
        if (newQty <= 0) {
            removeCartItem(productId);
            return;
        }
        
        if (newQty > product.stock) {
            showToast(`สินค้ามีสต็อกจำกัดเพียง ${product.stock} ชิ้น`, 'warning');
            return;
        }
        
        cartItem.qty = newQty;
        renderCart();
    }
}

function removeCartItem(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    renderCart();
}

function clearCart() {
    state.cart = [];
    state.pointsRedemptionUsed = false;
    const checkbox = document.getElementById('use-points-checkbox');
    if (checkbox) checkbox.checked = false;
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    
    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-state">
                <i data-lucide="shopping-bag" style="width: 48px; height: 48px;"></i>
                <span>ตะกร้าสินค้าว่างเปล่า</span>
            </div>
        `;
        document.getElementById('cart-subtotal').innerText = '0.00 บาท';
        document.getElementById('cart-vat').innerText = '0.00 บาท';
        document.getElementById('cart-total').innerText = '0.00 บาท';
        document.getElementById('cart-checkout-btn').disabled = true;
        document.getElementById('cart-points-row').classList.add('hidden');
        document.getElementById('cart-discount-row').classList.add('hidden');
        document.getElementById('points-redemption-panel').classList.add('hidden');
        lucide.createIcons();
        return;
    }
    
    let subtotal = 0;
    
    state.cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        
        const itemHtml = `
            <div class="cart-item">
                <div class="cart-item-details">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${item.price.toFixed(2)} ฿ / ชิ้น</span>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
                    <span class="cart-item-total">${itemTotal.toFixed(2)}</span>
                    <button class="delete-item-btn" onclick="removeCartItem('${item.id}')">
                        <i data-lucide="trash-2" style="width:16px;"></i>
                    </button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
    
    // Member Points Panel toggle
    const redemptionPanel = document.getElementById('points-redemption-panel');
    if (state.activeMember) {
        redemptionPanel.classList.remove('hidden');
        
        // Calculate max points they can redeem based on their points and subtotal
        const maxRedeemPoints = Math.min(state.activeMember.points, Math.floor(subtotal / state.redeemRatio));
        const discountValue = maxRedeemPoints * state.redeemRatio;
        
        document.getElementById('redemption-display-text').innerText = `ใช้ ${maxRedeemPoints} แต้ม (-${discountValue.toFixed(2)}฿)`;
    } else {
        redemptionPanel.classList.add('hidden');
        state.pointsRedemptionUsed = false;
        const checkbox = document.getElementById('use-points-checkbox');
        if (checkbox) checkbox.checked = false;
    }
    
    // Calculation variables
    let discount = 0;
    if (state.activeMember && state.pointsRedemptionUsed) {
        const maxRedeemPoints = Math.min(state.activeMember.points, Math.floor(subtotal / state.redeemRatio));
        discount = maxRedeemPoints * state.redeemRatio;
    }
    
    const discountedTotal = Math.max(0, subtotal - discount);
    const vat = discountedTotal * 0.07;
    const finalTotal = discountedTotal;
    
    // Points earned logic (e.g. 20 Baht = 1 point, points only earned on net cash paid)
    const pointsEarned = Math.floor(finalTotal / state.pointsRatio);
    
    // UI Update
    document.getElementById('cart-subtotal').innerText = `${subtotal.toFixed(2)} บาท`;
    
    if (discount > 0) {
        document.getElementById('cart-discount-row').classList.remove('hidden');
        document.getElementById('cart-discount').innerText = `-${discount.toFixed(2)} บาท`;
    } else {
        document.getElementById('cart-discount-row').classList.add('hidden');
    }
    
    document.getElementById('cart-vat').innerText = `${vat.toFixed(2)} บาท`;
    document.getElementById('cart-total').innerText = `${finalTotal.toFixed(2)} บาท`;
    document.getElementById('cart-checkout-btn').disabled = false;
    
    if (state.activeMember) {
        document.getElementById('cart-points-row').classList.remove('hidden');
        document.getElementById('cart-points').innerText = `+${pointsEarned} แต้ม`;
    } else {
        document.getElementById('cart-points-row').classList.add('hidden');
    }
    
    lucide.createIcons();
}

function handleMemberSearchKeyPress(e) {
    if (e.key === 'Enter') {
        searchCartMember();
    }
}

function searchCartMember() {
    const phoneInput = document.getElementById('cart-member-phone').value.trim();
    if (!phoneInput) {
        showToast('กรุณากรอกเบอร์โทรสมาชิก', 'warning');
        return;
    }
    
    const member = state.members.find(m => m.phone === phoneInput);
    
    if (member) {
        state.activeMember = member;
        document.getElementById('cart-member-phone').value = '';
        document.getElementById('member-search-container').classList.add('hidden');
        document.getElementById('cart-member-info').classList.remove('hidden');
        document.getElementById('cart-member-name').innerText = member.name;
        document.getElementById('cart-member-points').innerText = `แต้มสะสมคงเหลือ: ${member.points} แต้ม`;
        
        showToast(`สมาชิก: ${member.name} (มี ${member.points} แต้ม)`, 'success');
        renderCart();
    } else {
        showToast('ไม่พบเบอร์โทรสมาชิกนี้ในระบบ', 'error');
    }
}

function removeCartMember() {
    state.activeMember = null;
    state.pointsRedemptionUsed = false;
    document.getElementById('use-points-checkbox').checked = false;
    document.getElementById('member-search-container').classList.remove('hidden');
    document.getElementById('cart-member-info').classList.add('hidden');
    showToast('ยกเลิกการใช้รหัสสมาชิกเรียบร้อย', 'info');
    renderCart();
}

function togglePointsRedemption() {
    state.pointsRedemptionUsed = document.getElementById('use-points-checkbox').checked;
    renderCart();
}

/* ==========================================================================
   5. Checkout Flow & Receipts
   ========================================================================== */
function openCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('active');
    
    // Update amount values in modal
    const total = parseFloat(document.getElementById('cart-total').innerText);
    document.getElementById('promptpay-amount-text').innerText = total.toFixed(2);
    document.getElementById('cash-received-input').value = '';
    document.getElementById('cash-change-display').innerText = '0.00 บาท';
    
    // Load PromptPay Mock QR
    const qrPlaceholder = document.getElementById('promptpay-qr-placeholder');
    qrPlaceholder.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://promptpay.io/0812345678/${total.toFixed(2)}" width="180" height="180">`;
    
    selectPaymentMethod('cash');
}

function selectPaymentMethod(method) {
    state.paymentMethod = method;
    
    // Toggle active tabs
    ['cash', 'promptpay', 'card'].forEach(m => {
        const btn = document.getElementById(`pay-opt-${m}`);
        const panel = document.getElementById(`payment-panel-${m}`);
        
        if (m === method) {
            btn.classList.add('active');
            panel.classList.remove('hidden');
        } else {
            btn.classList.remove('active');
            panel.classList.add('hidden');
        }
    });
}

function addQuickCash(amount) {
    const input = document.getElementById('cash-received-input');
    const currentVal = parseFloat(input.value) || 0;
    input.value = currentVal + amount;
    calculateCashChange();
}

function calculateCashChange() {
    const total = parseFloat(document.getElementById('cart-total').innerText);
    const received = parseFloat(document.getElementById('cash-received-input').value) || 0;
    const change = Math.max(0, received - total);
    
    document.getElementById('cash-change-display').innerText = `${change.toFixed(2)} บาท`;
}

async function processCheckout() {
    const total = parseFloat(document.getElementById('cart-total').innerText);
    const subtotal = parseFloat(document.getElementById('cart-subtotal').innerText);
    const discount = subtotal - total;
    
    // Cash validation check
    if (state.paymentMethod === 'cash') {
        const received = parseFloat(document.getElementById('cash-received-input').value) || 0;
        if (received < total) {
            showToast('จำนวนเงินสดที่ได้รับ น้อยกว่ายอดชำระเงิน', 'error');
            return;
        }
    }
    
    // Calculate points details
    const pointsEarned = state.activeMember ? Math.floor(total / state.pointsRatio) : 0;
    let pointsUsed = 0;
    if (state.activeMember && state.pointsRedemptionUsed) {
        pointsUsed = Math.min(state.activeMember.points, Math.floor(subtotal / state.redeemRatio));
    }
    
    // Generate transaction ID
    const txId = 'tx-' + Math.floor(1000 + Math.random() * 9000);
    const cashierName = state.currentUser ? state.currentUser.name : 'Cashier User';
    
    const transaction = {
        id: txId,
        cashier_name: cashierName,
        member_id: state.activeMember ? state.activeMember.id : null,
        member_name: state.activeMember ? state.activeMember.name : null,
        total_amount: total,
        discount_applied: discount,
        payment_method: state.paymentMethod,
        points_earned: pointsEarned,
        points_used: pointsUsed,
        created_at: new Date().toISOString(),
        items: state.cart.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price
        }))
    };
    
    // Write changes - Database / Offline Local Storage
    if (dbConnected && supabaseClient) {
        try {
            // 1. Insert Transaction
            const { data: txData, error: txErr } = await supabaseClient.from('transactions').insert([{
                cashier_name: cashierName,
                member_id: state.activeMember ? state.activeMember.id : null,
                total_amount: total,
                discount_applied: discount,
                payment_method: state.paymentMethod,
                points_earned: pointsEarned,
                points_used: pointsUsed
            }]).select();
            
            if (txErr) throw txErr;
            const newTxId = txData[0].id;
            
            // 2. Insert items
            const itemsToInsert = state.cart.map(item => ({
                transaction_id: newTxId,
                product_id: item.id,
                product_name: item.name,
                quantity: item.qty,
                price: item.price
            }));
            
            const { error: itemsErr } = await supabaseClient.from('transaction_items').insert(itemsToInsert);
            if (itemsErr) throw itemsErr;
            
            // 3. Update stock and points in Parallel
            for (let item of state.cart) {
                const product = state.products.find(p => p.id === item.id);
                if (product) {
                    const newStock = Math.max(0, product.stock - item.qty);
                    await supabaseClient.from('products').update({ stock: newStock }).eq('id', product.id);
                }
            }
            
            if (state.activeMember) {
                const finalPoints = Math.max(0, state.activeMember.points - pointsUsed + pointsEarned);
                await supabaseClient.from('members').update({ points: finalPoints }).eq('id', state.activeMember.id);
            }
            
            showToast('บันทึกคำสั่งซื้อลงฐานข้อมูล Supabase สำเร็จ', 'success');
        } catch (e) {
            console.error('Database write error, using offline localdb backup:', e);
            showToast('บันทึกฐานข้อมูลล้มเหลว ทำการบันทึกเข้า Offline LocalDB แทน', 'warning');
            processOfflineCheckout(transaction, pointsUsed, pointsEarned);
        }
    } else {
        processOfflineCheckout(transaction, pointsUsed, pointsEarned);
    }
    
    // Open receipt model
    generateDigitalReceipt(transaction, pointsUsed, pointsEarned);
    
    // Reload state and clear cart
    loadAllData();
    clearCart();
    removeCartMember();
    
    closeModal('checkout-modal');
    openModal('receipt-modal');
}

function processOfflineCheckout(transaction, pointsUsed, pointsEarned) {
    // 1. Stock deduction
    state.cart.forEach(item => {
        const prod = state.products.find(p => p.id === item.id);
        if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
    });
    
    // 2. Member point adjustment
    if (state.activeMember) {
        const member = state.members.find(m => m.id === state.activeMember.id);
        if (member) {
            member.points = Math.max(0, member.points - pointsUsed + pointsEarned);
        }
    }
    
    // 3. Save transactions
    state.transactions.unshift(transaction);
    
    // 4. Commit to localStorage
    saveLocalStorageData();
}

function generateDigitalReceipt(tx, pointsUsed, pointsEarned) {
    const container = document.getElementById('receipt-content');
    
    const itemsHtml = tx.items.map(item => `
        <div class="receipt-row">
            <span>${item.name} (x${item.qty})</span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
        </div>
    `).join('');
    
    const memberName = tx.member_name || 'ลูกค้าทั่วไป';
    let pointsHtml = '';
    if (tx.member_id) {
        // Find member points to show remaining
        const member = state.members.find(m => m.id === tx.member_id);
        const currentPoints = member ? member.points : 0;
        pointsHtml = `
            <div class="receipt-divider"></div>
            <div class="receipt-row">
                <span>แต้มที่แลกใช้:</span>
                <span>-${pointsUsed} แต้ม</span>
            </div>
            <div class="receipt-row">
                <span>แต้มที่ได้รับบิลนี้:</span>
                <span>+${pointsEarned} แต้ม</span>
            </div>
            <div class="receipt-row bold">
                <span>แต้มคงเหลือสะสม:</span>
                <span>${currentPoints} แต้ม</span>
            </div>
        `;
    }
    
    const dateStr = new Date(tx.created_at).toLocaleString('th-TH');
    
    container.innerHTML = `
        <div class="receipt-header">
            <span class="receipt-shop-name">CAFFEINE COFFEE SHOP</span><br>
            <span>123 ถ.สุขุมวิท กรุงเทพฯ 10110</span><br>
            <span>เบอร์โทร: 02-123-4567</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row">
            <span>Receipt ID:</span>
            <span>${tx.id}</span>
        </div>
        <div class="receipt-row">
            <span>เวลาสั่งซื้อ:</span>
            <span>${dateStr}</span>
        </div>
        <div class="receipt-row">
            <span>แคชเชียร์:</span>
            <span>${tx.cashier_name}</span>
        </div>
        <div class="receipt-row">
            <span>ลูกค้า:</span>
            <span>${memberName}</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-items">
            ${itemsHtml}
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row">
            <span>ยอดรวม (Subtotal)</span>
            <span>${(tx.total_amount + tx.discount_applied).toFixed(2)}</span>
        </div>
        ${tx.discount_applied > 0 ? `
        <div class="receipt-row" style="color:#d50000">
            <span>ส่วนลดแลกแต้ม (Discount)</span>
            <span>-${tx.discount_applied.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="receipt-row">
            <span>VAT (7%)</span>
            <span>${(tx.total_amount * 0.07).toFixed(2)}</span>
        </div>
        <div class="receipt-row bold" style="font-size:14px;">
            <span>ยอดชำระสุทธิ (Net Total)</span>
            <span>${tx.total_amount.toFixed(2)} บาท</span>
        </div>
        <div class="receipt-row">
            <span>ช่องทางจ่ายเงิน:</span>
            <span>${tx.payment_method.toUpperCase()}</span>
        </div>
        ${pointsHtml}
        <div class="receipt-divider"></div>
        <div class="receipt-footer">
            <span>*** ขอบคุณที่ใช้บริการ ***</span><br>
            <span>คะแนนสะสมแลกรับส่วนลดได้ในบิลถัดไป</span>
        </div>
    `;
}

function printReceipt() {
    window.print();
}

/* ==========================================================================
   6. Dashboard Rendering (Dynamic SVG Charts)
   ========================================================================== */
function renderDashboard() {
    const today = new Date().toDateString();
    
    // Calculate stats
    let totalSalesToday = 0;
    let totalOrdersToday = 0;
    let bakerySalesToday = 0;
    
    state.transactions.forEach(tx => {
        const txDate = new Date(tx.created_at).toDateString();
        if (txDate === today) {
            totalSalesToday += tx.total_amount;
            totalOrdersToday += 1;
            
            // Check bakery category products inside items
            tx.items.forEach(item => {
                const prod = state.products.find(p => p.name === item.name);
                if (prod && prod.category === 'bakery') {
                    bakerySalesToday += item.price * item.qty;
                }
            });
        }
    });
    
    // Update stats cards UI
    document.getElementById('dash-total-sales').innerText = `${totalSalesToday.toFixed(2)} ฿`;
    document.getElementById('dash-total-orders').innerText = `${totalOrdersToday} บิล`;
    document.getElementById('dash-total-members').innerText = `${state.members.length} คน`;
    document.getElementById('dash-bakery-sales').innerText = `${bakerySalesToday.toFixed(2)} ฿`;
    
    // Render SVG Bar Chart
    renderSalesChartSVG();
    
    // Render Best Sellers Progress list
    renderBestSellersDashboard();
    
    // Render Dashboard orders table
    renderDashboardOrdersTable();
}

function renderSalesChartSVG() {
    const chartContainer = document.getElementById('sales-svg-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';
    
    // 1. Group transaction sales by past 7 days
    const dailySales = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailySales[date.toDateString()] = {
            label: date.toLocaleDateString('th-TH', { weekday: 'short' }),
            sales: 0
        };
    }
    
    state.transactions.forEach(tx => {
        const txDate = new Date(tx.created_at).toDateString();
        if (dailySales[txDate]) {
            dailySales[txDate].sales += tx.total_amount;
        }
    });
    
    const values = Object.values(dailySales);
    const maxSales = Math.max(...values.map(v => v.sales), 500); // minimum scale limit
    
    // 2. Y-Axis construction
    const yAxisContainer = document.createElement('div');
    yAxisContainer.className = 'chart-y-axis';
    const splits = 4;
    for (let i = splits; i >= 0; i--) {
        const yVal = (maxSales / splits) * i;
        const tick = document.createElement('span');
        tick.innerText = Math.round(yVal);
        yAxisContainer.appendChild(tick);
    }
    chartContainer.appendChild(yAxisContainer);
    
    // 3. Bars rendering wrapper
    const barsWrapper = document.createElement('div');
    barsWrapper.className = 'chart-bars-wrapper';
    
    // Draw horizontal grid lines behind bars
    for (let i = 1; i < splits; i++) {
        const gridLine = document.createElement('div');
        gridLine.className = 'chart-grid-line';
        gridLine.style.bottom = `${(100 / splits) * i}%`;
        barsWrapper.appendChild(gridLine);
    }
    
    values.forEach(day => {
        const barHeightPercentage = (day.sales / maxSales) * 100;
        
        const col = document.createElement('div');
        col.className = 'chart-bar-col';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `0%`; // start at 0 for animation trigger
        
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.innerText = `${day.sales.toFixed(2)} ฿`;
        bar.appendChild(tooltip);
        
        const label = document.createElement('span');
        label.className = 'chart-x-label';
        label.innerText = day.label;
        
        col.appendChild(bar);
        col.appendChild(label);
        barsWrapper.appendChild(col);
        
        // Trigger visual heights animation after rendering
        setTimeout(() => {
            bar.style.height = `${Math.max(4, barHeightPercentage)}%`;
        }, 100);
    });
    
    chartContainer.appendChild(barsWrapper);
}

function renderBestSellersDashboard() {
    const listContainer = document.getElementById('dash-best-sellers');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    // Count units sold per product
    const salesCounts = {};
    state.transactions.forEach(tx => {
        tx.items.forEach(item => {
            salesCounts[item.name] = (salesCounts[item.name] || 0) + item.qty;
        });
    });
    
    // Sort array
    const sorted = Object.entries(salesCounts)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
        
    if (sorted.length === 0) {
        listContainer.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">ยังไม่มีรายการขายบิลแรก</span>';
        return;
    }
    
    const maxQty = sorted[0].qty;
    
    sorted.forEach((item, index) => {
        const percentage = (item.qty / maxQty) * 100;
        const itemHtml = `
            <div class="best-seller-item">
                <div class="seller-rank">${index + 1}</div>
                <div class="seller-info">
                    <div class="seller-name">${item.name}</div>
                    <div class="seller-progress-bar">
                        <div class="seller-progress-fill" style="width: 0%;"></div>
                    </div>
                </div>
                <div class="seller-sales">${item.qty} ชิ้น</div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHtml);
        
        // Trigger fill animation
        setTimeout(() => {
            const fills = listContainer.querySelectorAll('.seller-progress-fill');
            if (fills[index]) fills[index].style.width = `${percentage}%`;
        }, 150);
    });
}

function renderDashboardOrdersTable() {
    const tbody = document.querySelector('#dashboard-orders-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const recentTxs = state.transactions.slice(0, 5);
    
    if (recentTxs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px;">ไม่พบรายการขายล่าสุด</td></tr>';
        return;
    }
    
    recentTxs.forEach(tx => {
        const memberName = tx.member_name || 'ลูกค้าทั่วไป';
        const dateStr = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        
        const row = `
            <tr>
                <td><strong>${tx.id}</strong></td>
                <td>${dateStr}</td>
                <td>${tx.cashier_name}</td>
                <td>${memberName}</td>
                <td><span class="badge success">${tx.payment_method.toUpperCase()}</span></td>
                <td><strong>${tx.total_amount.toFixed(2)} ฿</strong></td>
                <td style="text-align: center;">
                    <button class="tbl-action-btn" onclick="viewPastReceipt('${tx.id}')" title="ดูใบเสร็จ">
                        <i data-lucide="eye" style="width:14px;"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    lucide.createIcons();
}

function viewPastReceipt(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;
    
    generateDigitalReceipt(tx, tx.points_used, tx.points_earned);
    openModal('receipt-modal');
}

/* ==========================================================================
   7. Products Management View
   ========================================================================== */
function renderProductTable() {
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchQuery = document.getElementById('product-list-search').value.toLowerCase();
    const filtered = state.products.filter(p => p.name.toLowerCase().includes(searchQuery));
    
    const isAdmin = state.currentUser && state.currentUser.role === 'admin';
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px;">ไม่พบสินค้าตรงเงื่อนไขค้นหา</td></tr>';
        return;
    }
    
    filtered.forEach(p => {
        const isLow = p.stock <= 10;
        const stockBadge = `<span class="badge ${isLow ? 'danger' : 'success'}">${p.stock} ชิ้น</span>`;
        
        const actions = isAdmin ? `
            <td style="text-align: center;">
                <div class="action-buttons-group" style="justify-content: center;">
                    <button class="tbl-action-btn" onclick="openProductFormModal('${p.id}')">
                        <i data-lucide="edit-3" style="width:14px;"></i>
                    </button>
                    <button class="tbl-action-btn delete" onclick="deleteProduct('${p.id}')">
                        <i data-lucide="trash-2" style="width:14px;"></i>
                    </button>
                </div>
            </td>
        ` : `<td class="admin-only" style="text-align:center;">-</td>`;
        
        const row = `
            <tr>
                <td><img src="${p.image_url || 'https://via.placeholder.com/40'}" style="width:40px; height:40px; border-radius: var(--radius-sm); object-fit: cover;"></td>
                <td><strong>${p.name}</strong></td>
                <td><span class="product-badge ${p.category}">${p.category}</span></td>
                <td>${p.price.toFixed(2)} ฿</td>
                <td>${stockBadge}</td>
                <td>${new Date(p.created_at || Date.now()).toLocaleDateString('th-TH')}</td>
                ${actions}
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    lucide.createIcons();
    updateUserHeader();
}

function openProductFormModal(productId = null) {
    const modal = document.getElementById('product-form-modal');
    const form = document.getElementById('product-edit-form');
    form.reset();
    
    if (productId && typeof productId === 'string') {
        document.getElementById('product-modal-title').innerText = 'แก้ไขข้อมูลสินค้า';
        const p = state.products.find(item => item.id === productId);
        if (p) {
            document.getElementById('form-product-id').value = p.id;
            document.getElementById('form-product-name').value = p.name;
            document.getElementById('form-product-category').value = p.category;
            document.getElementById('form-product-price').value = p.price;
            document.getElementById('form-product-stock').value = p.stock;
            document.getElementById('form-product-image').value = p.image_url || '';
        }
    } else {
        document.getElementById('product-modal-title').innerText = 'เพิ่มสินค้าใหม่';
        document.getElementById('form-product-id').value = '';
    }
    
    openModal('product-form-modal');
}

async function saveProductForm(e) {
    e.preventDefault();
    const id = document.getElementById('form-product-id').value;
    const name = document.getElementById('form-product-name').value;
    const category = document.getElementById('form-product-category').value;
    const price = parseFloat(document.getElementById('form-product-price').value);
    const stock = parseInt(document.getElementById('form-product-stock').value);
    const image_url = document.getElementById('form-product-image').value || null;
    
    const productData = { name, category, price, stock, image_url };
    
    if (dbConnected && supabaseClient) {
        try {
            if (id) {
                // Update
                const { error } = await supabaseClient.from('products').update(productData).eq('id', id);
                if (error) throw error;
                showToast('อัปเดตข้อมูลสินค้าเข้า Supabase สำเร็จ', 'success');
            } else {
                // Insert
                const { error } = await supabaseClient.from('products').insert([productData]);
                if (error) throw error;
                showToast('บันทึกสินค้าใหม่เข้า Supabase สำเร็จ', 'success');
            }
        } catch (e) {
            console.error('Supabase write error, switching logic to local storage fallback:', e);
            showToast('บันทึกข้อมูลล้มเหลว บันทึกเข้าระบบจำลองออฟไลน์แทน', 'error');
            saveProductLocalFallback(id, productData);
        }
    } else {
        saveProductLocalFallback(id, productData);
    }
    
    closeModal('product-form-modal');
    loadAllData();
}

function saveProductLocalFallback(id, data) {
    if (id) {
        // Edit existing
        const index = state.products.findIndex(p => p.id === id);
        if (index !== -1) {
            state.products[index] = { ...state.products[index], ...data };
            showToast('แก้ไขสินค้า (Local) เรียบร้อย', 'success');
        }
    } else {
        // Insert new
        const newProduct = {
            id: 'p-' + Math.floor(1000 + Math.random() * 9000),
            created_at: new Date().toISOString(),
            ...data
        };
        state.products.push(newProduct);
        showToast('เพิ่มสินค้าใหม่ (Local) เรียบร้อย', 'success');
    }
    saveLocalStorageData();
}

async function deleteProduct(productId) {
    if (!confirm('ยืนยันที่จะลบสินค้าชิ้นนี้ออกใช่หรือไม่?')) return;
    
    if (dbConnected && supabaseClient) {
        try {
            const { error } = await supabaseClient.from('products').delete().eq('id', productId);
            if (error) throw error;
            showToast('ลบสินค้าออกจาก Supabase สำเร็จ', 'success');
        } catch (e) {
            console.error(e);
            showToast('ไม่สามารถลบสินค้าได้ ระบบจะลบออฟไลน์', 'warning');
            state.products = state.products.filter(p => p.id !== productId);
            saveLocalStorageData();
        }
    } else {
        state.products = state.products.filter(p => p.id !== productId);
        saveLocalStorageData();
        showToast('ลบสินค้าชิ้นนี้ออกเรียบร้อย', 'success');
    }
    loadAllData();
}

/* ==========================================================================
   8. Members Management View
   ========================================================================== */
function renderMemberTable() {
    const tbody = document.querySelector('#members-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const searchQuery = document.getElementById('member-list-search').value.toLowerCase();
    const filtered = state.members.filter(m => 
        m.name.toLowerCase().includes(searchQuery) || 
        m.phone.includes(searchQuery)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px;">ไม่พบข้อมูลสมาชิก</td></tr>';
        return;
    }
    
    filtered.forEach(m => {
        const row = `
            <tr>
                <td><strong>${m.name}</strong></td>
                <td>${m.phone}</td>
                <td>${m.email || '-'}</td>
                <td><span class="badge success" style="font-size:12px;">🏆 ${m.points} แต้ม</span></td>
                <td>${new Date(m.created_at || Date.now()).toLocaleDateString('th-TH')}</td>
                <td style="text-align: center;">
                    <div class="action-buttons-group" style="justify-content: center;">
                        <button class="tbl-action-btn" onclick="openMemberFormModal('${m.id}')" title="แก้ไขข้อมูล">
                            <i data-lucide="edit-3" style="width:14px;"></i>
                        </button>
                        <button class="tbl-action-btn delete" onclick="deleteMember('${m.id}')" title="ลบสมาชิก">
                            <i data-lucide="trash-2" style="width:14px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    lucide.createIcons();
}

function openNewMemberModal() {
    openMemberFormModal(null);
}

function openMemberFormModal(memberId = null) {
    const modal = document.getElementById('member-form-modal');
    const form = document.getElementById('member-edit-form');
    form.reset();
    
    if (memberId && typeof memberId === 'string') {
        document.getElementById('member-modal-title').innerText = 'แก้ไขข้อมูลสมาชิก';
        const m = state.members.find(item => item.id === memberId);
        if (m) {
            document.getElementById('form-member-id').value = m.id;
            document.getElementById('form-member-name').value = m.name;
            document.getElementById('form-member-phone').value = m.phone;
            document.getElementById('form-member-email').value = m.email || '';
            document.getElementById('form-member-points').value = m.points;
        }
    } else {
        document.getElementById('member-modal-title').innerText = 'ลงทะเบียนสมาชิกใหม่';
        document.getElementById('form-member-id').value = '';
    }
    
    openModal('member-form-modal');
}

async function saveMemberForm(e) {
    e.preventDefault();
    const id = document.getElementById('form-member-id').value;
    const name = document.getElementById('form-member-name').value;
    const phone = document.getElementById('form-member-phone').value;
    const email = document.getElementById('form-member-email').value || null;
    const points = parseInt(document.getElementById('form-member-points').value) || 0;
    
    const memberData = { name, phone, email, points };
    
    if (dbConnected && supabaseClient) {
        try {
            if (id) {
                // Update
                const { error } = await supabaseClient.from('members').update(memberData).eq('id', id);
                if (error) throw error;
                showToast('อัปเดตสมาชิกเข้า Supabase สำเร็จ', 'success');
            } else {
                // Insert
                const { error } = await supabaseClient.from('members').insert([memberData]);
                if (error) throw error;
                showToast('เพิ่มสมาชิกใหม่เข้า Supabase สำเร็จ', 'success');
            }
        } catch (e) {
            console.error('Supabase member write error, local storage fallback instead:', e);
            showToast('มีปัญหาระหว่างอัปโหลดข้อมูล บันทึกข้อมูลจำลองออฟไลน์แทน', 'warning');
            saveMemberLocalFallback(id, memberData);
        }
    } else {
        saveMemberLocalFallback(id, memberData);
    }
    
    closeModal('member-form-modal');
    loadAllData();
}

function saveMemberLocalFallback(id, data) {
    if (id) {
        const index = state.members.findIndex(m => m.id === id);
        if (index !== -1) {
            state.members[index] = { ...state.members[index], ...data };
            showToast('แก้ไขสมาชิกในเครื่องเรียบร้อย', 'success');
        }
    } else {
        const newMember = {
            id: 'm-' + Math.floor(1000 + Math.random() * 9000),
            created_at: new Date().toISOString(),
            ...data
        };
        state.members.push(newMember);
        showToast('สมัครสมาชิกใหม่สำเร็จแล้ว', 'success');
    }
    saveLocalStorageData();
}

async function deleteMember(memberId) {
    if (!confirm('ยืนยันลบรายชื่อสมาชิกท่านนี้ใช่หรือไม่? คะแนนสะสมทั้งหมดจะสูญหาย')) return;
    
    if (dbConnected && supabaseClient) {
        try {
            const { error } = await supabaseClient.from('members').delete().eq('id', memberId);
            if (error) throw error;
            showToast('ลบสมาชิกออกจาก Supabase เรียบร้อย', 'success');
        } catch (e) {
            console.error(e);
            showToast('ไม่สามารถเชื่อมฐานข้อมูล ระบบจะทำการลบลำลอง', 'warning');
            state.members = state.members.filter(m => m.id !== memberId);
            saveLocalStorageData();
        }
    } else {
        state.members = state.members.filter(m => m.id !== memberId);
        saveLocalStorageData();
        showToast('ลบรายชื่อสมาชิกเรียบร้อย', 'success');
    }
    loadAllData();
}

/* ==========================================================================
   9. Settings & Reset Utilities
   ========================================================================== */
function saveDatabaseSettings(e) {
    e.preventDefault();
    const url = document.getElementById('setting-supabase-url').value.trim();
    const key = document.getElementById('setting-supabase-key').value.trim();
    
    localStorage.setItem('caffeine_supabase_url', url);
    localStorage.setItem('caffeine_supabase_key', key);
    
    showToast('บันทึก Credentials สำเร็จ กำลังเชื่อมต่อใหม่...', 'info');
    
    setTimeout(() => {
        initializeSupabase();
    }, 500);
}

async function testDatabaseConnection() {
    const url = document.getElementById('setting-supabase-url').value.trim();
    const key = document.getElementById('setting-supabase-key').value.trim();
    
    if (!url || !key) {
        showToast('กรุณากรอก URL และ Key ให้ครบเพื่อทดสอบ', 'warning');
        return;
    }
    
    showToast('กำลังทดสอบเชื่อมต่อ...', 'info');
    
    try {
        if (window.supabase) {
            const client = window.supabase.createClient(url, key);
            const { data, error } = await client.from('products').select('id').limit(1);
            
            if (error) throw error;
            showToast('การเชื่อมต่อกับ Supabase ถูกต้องและใช้งานได้!', 'success');
        } else {
            showToast('ไม่พบไลบรารี Supabase', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('การเชื่อมต่อผิดพลาด: ' + e.message, 'error');
    }
}

function resetDemoDatabase() {
    if (!confirm('⚠️ ยืนยันการรีเซ็ตข้อมูลจำลอง? ข้อมูลธุรกรรม ยอดสมาชิก และสินค้าในเครื่องทั้งหมดจะถูกลบแล้วใช้ค่าเริ่มต้น')) return;
    
    localStorage.removeItem('caffeine_products');
    localStorage.removeItem('caffeine_members');
    localStorage.removeItem('caffeine_transactions');
    
    state.cart = [];
    state.activeMember = null;
    
    initLocalData();
    loadAllData();
    showToast('รีเซ็ตข้อมูลจำลองในเครื่องเรียบร้อยแล้ว', 'success');
}

// Points Settings changes
document.getElementById('setting-points-ratio').addEventListener('change', (e) => {
    const val = parseFloat(e.target.value) || 20;
    state.pointsRatio = val;
    localStorage.setItem('caffeine_points_ratio', val);
    renderCart();
});

document.getElementById('setting-redeem-ratio').addEventListener('change', (e) => {
    const val = parseFloat(e.target.value) || 1;
    state.redeemRatio = val;
    localStorage.setItem('caffeine_redeem_ratio', val);
    renderCart();
});

/* ==========================================================================
   10. Modal Helper Functions & Toasts
   ========================================================================== */
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('active');
    }, 50);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
