import axios from './node_modules/axios/dist/esm/axios.min.js';

const API_BASE = 'http://localhost:8080/api';
const STORAGE_KEY = 'ecom_user';
const appRoot = document.getElementById('app');
const topbarRoot = document.getElementById('topbar');
const footerRoot = document.getElementById('footer');

const state = {
    user: loadUser(),
    products: [],
    cartCount: 0,
    currentPage: 'login',
    searchText: '',
    selectedCategory: '',
    cartItems: [],
    orders: [],
    logs: [],
    adminData: {
        failureMode: false,
        lowStock: [],
        events: []
    }
};

const Api = {
    request: async (config) => {
        try {
            const response = await axios({ baseURL: API_BASE, ...config });
            return response.data;
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Server error';
            throw new Error(message);
        }
    },
    signin: (userName, password) => Api.request({ method: 'post', url: '/auth/signin', data: { userName, password } }),
    signup: (data) => Api.request({ method: 'post', url: '/auth/signup', data }),
    getProducts: () => Api.request({ method: 'get', url: '/products' }),
    getProduct: (id) => Api.request({ method: 'get', url: `/products/${id}` }),
    addProduct: (data) => Api.request({ method: 'post', url: '/products', data }),
    updateStock: (id, stock) => Api.request({ method: 'put', url: `/products/${id}/stock`, data: { stock } }),
    getLowStock: () => Api.request({ method: 'get', url: '/products/low-stock' }),
    getOutOfStock: () => Api.request({ method: 'get', url: '/products/out-of-stock' }),
    getCart: (userId) => Api.request({ method: 'get', url: `/cart/${userId}` }),
    addToCart: (userId, productId, quantity) => Api.request({ method: 'post', url: `/cart/${userId}/add`, data: { productId, quantity } }),
    removeFromCart: (userId, productId) => Api.request({ method: 'delete', url: `/cart/${userId}/remove/${productId}` }),
    updateCartQty: (userId, productId, quantity) => Api.request({ method: 'put', url: `/cart/${userId}/update`, data: { productId, quantity } }),
    clearCart: (userId) => Api.request({ method: 'delete', url: `/cart/${userId}/clear` }),
    previewDiscount: (userId, couponCode) => Api.request({ method: 'get', url: `/cart/${userId}/preview${couponCode ? `?couponCode=${encodeURIComponent(couponCode)}` : ''}` }),
    placeOrder: (userId, couponCode, idempotencyKey, paymentMode) => Api.request({ method: 'post', url: '/orders/place', data: { userId, couponCode: couponCode || '', idempotencyKey, paymentMode: paymentMode || 'COD' } }),
    getAllOrders: () => Api.request({ method: 'get', url: '/orders' }),
    getOrder: (orderId) => Api.request({ method: 'get', url: `/orders/${orderId}` }),
    getOrdersByUser: (userId) => Api.request({ method: 'get', url: `/orders/user/${userId}` }),
    getOrdersByStatus: (status) => Api.request({ method: 'get', url: `/orders/status/${status}` }),
    updateOrderStatus: (orderId, status) => Api.request({ method: 'put', url: `/orders/${orderId}/status`, data: { status } }),
    cancelOrder: (orderId) => Api.request({ method: 'post', url: `/orders/${orderId}/cancel` }),
    returnItems: (orderId, productId, qty) => Api.request({ method: 'post', url: `/orders/${orderId}/return`, data: { productId, quantity: qty } }),
    getAllLogs: () => Api.request({ method: 'get', url: '/logs' }),
    getLogsByUser: (userId) => Api.request({ method: 'get', url: `/logs/user/${userId}` }),
    getLogsByEntity: (entityType) => Api.request({ method: 'get', url: `/logs/entity/${entityType}` }),
    getFailureMode: () => Api.request({ method: 'get', url: '/admin/failure-mode' }),
    setFailureMode: (enabled) => Api.request({ method: 'post', url: '/admin/failure-mode', data: { enabled } }),
    getEvents: () => Api.request({ method: 'get', url: '/admin/events' }),
    processEvents: () => Api.request({ method: 'post', url: '/admin/events/process' }),
    simulateConcurrency: (productId, quantity, users) => Api.request({ method: 'post', url: '/admin/simulate-concurrency', data: { productId, quantity, users } })
};

function loadUser() {
    try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch {
        return null;
    }
}

function saveUser(user) {
    state.user = user;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
    state.user = null;
    state.cartCount = 0;
    sessionStorage.removeItem(STORAGE_KEY);
}

function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function showAlert(type, message, timeout = 5000) {
    const alertRoot = document.getElementById('alert-root');
    if (!alertRoot) return;
    alertRoot.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" aria-label="Close"></button>
        </div>
    `;
    const button = alertRoot.querySelector('.btn-close');
    button?.addEventListener('click', () => { alertRoot.innerHTML = ''; });
    if (timeout > 0) {
        window.setTimeout(() => { alertRoot.innerHTML = ''; }, timeout);
    }
}

function renderNav() {
    const basicNav = `
        <nav class="navbar navbar-dark bg-dark shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand" href="#/products">
                    <i class="fas fa-shopping-cart"></i> E-Commerce Engine
                </a>
                ${state.user ? `
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                ` : ''}
            </div>
        </nav>
    `;

    if (!state.user) {
        topbarRoot.innerHTML = basicNav;
        return;
    }

    topbarRoot.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container-fluid">
                <a class="navbar-brand" href="#/products">
                    <i class="fas fa-shopping-cart"></i> E-Commerce Engine
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navMenu">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item"><a class="nav-link" href="#/products">Products</a></li>
                        <li class="nav-item"><a class="nav-link" href="#/cart">Cart ${state.cartCount > 0 ? `<span class="badge bg-danger">${state.cartCount}</span>` : ''}</a></li>
                        <li class="nav-item"><a class="nav-link" href="#/orders">Orders</a></li>
                        <li class="nav-item"><a class="nav-link" href="#/logs">Logs</a></li>
                        ${state.user.role === 'admin' ? '<li class="nav-item"><a class="nav-link" href="#/admin">Admin</a></li>' : ''}
                    </ul>
                    <div class="d-flex align-items-center gap-3 text-white">
                        <span><i class="fas fa-user-circle"></i> ${state.user.firstName || state.user.userId}</span>
                        <button id="logout-button" class="btn btn-outline-light btn-sm">Logout</button>
                    </div>
                </div>
            </div>
        </nav>
    `;

    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', () => {
        clearUser();
        navigateTo('login');
    });
}

function renderFooter() {
    if (!state.user) {
        footerRoot.innerHTML = '';
        return;
    }
    footerRoot.innerHTML = `
        <footer class="footer bg-dark text-light py-3 mt-4">
            <div class="container text-center small">
                E-Commerce Order Engine Hackathon | Built with Spring Boot + Modern JavaScript
            </div>
        </footer>
    `;
}

function navigateTo(page) {
    window.location.hash = `#/${page}`;
}

function requireAuthentication() {
    if (!state.user) {
        navigateTo('login');
        return false;
    }
    return true;
}

async function updateCartCount() {
    if (!state.user) {
        state.cartCount = 0;
        renderNav();
        return;
    }
    try {
        const cart = await Api.getCart(state.user.userId);
        state.cartCount = Array.isArray(cart) ? cart.length : 0;
        renderNav();
    } catch {
        state.cartCount = 0;
        renderNav();
    }
}

function clearApp() {
    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
        </div>
    `;
}

async function renderLogin() {
    if (state.user) {
        navigateTo('products');
        return;
    }
    state.currentPage = 'login';
    topbarRoot.innerHTML = '';
    footerRoot.innerHTML = '';
    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
            <div class="row justify-content-center">
                <div class="col-lg-10">
                    <div class="card shadow-sm rounded-4 overflow-hidden">
                        <div class="row g-0">
                            <div class="col-md-5 bg-primary text-white p-4 d-flex flex-column justify-content-center">
                                <div>
                                    <h1 class="display-6 fw-bold"><i class="fas fa-shopping-cart"></i> E-Commerce</h1>
                                    <p class="lead">Modern storefront powered by a secure backend.</p>
                                    <ul class="list-unstyled mt-4">
                                        <li><i class="fas fa-check-circle me-2"></i> Product browsing</li>
                                        <li><i class="fas fa-check-circle me-2"></i> Cart and checkout</li>
                                        <li><i class="fas fa-check-circle me-2"></i> Order history</li>
                                        <li><i class="fas fa-check-circle me-2"></i> Admin controls</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-7 p-4">
                                <div id="auth-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    renderAuthForm(false);
}

function renderAuthForm(isSignUp) {
    const authContainer = document.getElementById('auth-container');
    authContainer.innerHTML = isSignUp ? signupTemplate() : signinTemplate();
    bindAuthForm(isSignUp);
}

function signinTemplate() {
    return `
        <h2 class="mb-3">Sign in</h2>
        <div class="mb-3"><label class="form-label">Username</label><input id="signin-user" type="text" class="form-control" placeholder="Enter username"></div>
        <div class="mb-4"><label class="form-label">Password</label><input id="signin-password" type="password" class="form-control" placeholder="Enter password"></div>
        <button id="signin-button" class="btn btn-primary w-100 mb-3">Sign In</button>
        <p class="text-center">New here? <a id="toggle-auth" href="#">Create account</a></p>
    `;
}

function signupTemplate() {
    return `
        <h2 class="mb-3">Create account</h2>
        <div class="row g-3 mb-3">
            <div class="col"><input id="signup-first" type="text" class="form-control" placeholder="First name"></div>
            <div class="col"><input id="signup-last" type="text" class="form-control" placeholder="Last name"></div>
        </div>
        <div class="mb-3"><input id="signup-username" type="text" class="form-control" placeholder="Username"></div>
        <div class="mb-4"><input id="signup-password" type="password" class="form-control" placeholder="Password"></div>
        <button id="signup-button" class="btn btn-success w-100 mb-3">Create Account</button>
        <p class="text-center">Already have an account? <a id="toggle-auth" href="#">Sign in</a></p>
    `;
}

function bindAuthForm(isSignUp) {
    document.getElementById('toggle-auth')?.addEventListener('click', (event) => {
        event.preventDefault();
        renderAuthForm(!isSignUp);
    });

    if (isSignUp) {
        document.getElementById('signup-button')?.addEventListener('click', handleSignup);
        return;
    }
    document.getElementById('signin-button')?.addEventListener('click', handleSignin);
}

async function handleSignin() {
    const userName = document.getElementById('signin-user')?.value.trim();
    const password = document.getElementById('signin-password')?.value.trim();
    if (!userName || !password) {
        showAlert('danger', 'Username and password are required.');
        return;
    }
    try {
        const user = await Api.signin(userName, password);
        saveUser(user);
        await updateCartCount();
        showAlert('success', 'Signed in successfully.', 3000);
        navigateTo('products');
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function handleSignup() {
    const firstName = document.getElementById('signup-first')?.value.trim();
    const lastName = document.getElementById('signup-last')?.value.trim();
    const userName = document.getElementById('signup-username')?.value.trim();
    const password = document.getElementById('signup-password')?.value.trim();
    if (!firstName || !lastName || !userName || !password) {
        showAlert('danger', 'Please fill all fields.');
        return;
    }
    if (password.length < 4) {
        showAlert('danger', 'Password must be at least 4 characters.');
        return;
    }
    try {
        await Api.signup({ firstName, lastName, userName, password });
        showAlert('success', 'Account created. Sign in to continue.');
        renderAuthForm(false);
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function renderProducts() {
    if (!requireAuthentication()) return;
    state.currentPage = 'products';
    try {
        state.products = await Api.getProducts();
    } catch (error) {
        state.products = [];
        showAlert('danger', error.message);
    }
    updateCartCount();
    const categories = [...new Set(state.products.map(product => product.category).filter(Boolean))].sort();
    const productsHtml = state.products
        .filter(product => {
            const searchText = state.searchText.toLowerCase();
            const matchesText = !searchText || [product.name, product.productId, product.description].some(value => String(value || '').toLowerCase().includes(searchText));
            const matchesCategory = !state.selectedCategory || product.category === state.selectedCategory;
            return matchesText && matchesCategory;
        })
        .map(product => renderProductCard(product))
        .join('');

    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
                <div>
                    <h3>Shop Products</h3>
                    <p class="text-muted">Browse, search, and add products to your cart.</p>
                </div>
                <div class="d-flex flex-column flex-sm-row gap-2 w-100">
                    <input id="product-search" type="search" class="form-control" placeholder="Search products..." value="${escapeHtml(state.searchText)}">
                    <select id="product-category" class="form-select" style="min-width:200px;">
                        <option value="">All Categories</option>
                        ${categories.map(category => `<option value="${escapeHtml(category)}" ${state.selectedCategory === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}
                    </select>
                    <button id="refresh-products" class="btn btn-outline-primary">Refresh</button>
                </div>
            </div>
            <div class="row g-4">
                ${productsHtml || '<div class="col-12"><div class="alert alert-info">No products found.</div></div>'}
            </div>
            ${state.user.role === 'admin' ? renderAdminProductPanel() : ''}
        </div>
    `;
    bindProductEvents();
}

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderProductCard(product) {
    const available = Number(product.stock || 0) - Number(product.reservedStock || 0);
    const outOfStock = available <= 0;
    const actualPrice = Number(product.actualPrice || 0);
    const sellingPrice = Number(product.price || 0);
    const discount = actualPrice > sellingPrice ? Math.round((1 - sellingPrice / actualPrice) * 100) : 0;
    return `
        <div class="col-xl-3 col-lg-4 col-md-6">
            <div class="card h-100 shadow-sm">
                <div class="position-relative">
                    <img src="${escapeHtml(product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop')}" class="card-img-top" alt="${escapeHtml(product.name)}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'">
                    ${discount > 0 ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">${discount}% OFF</span>` : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(product.name)}</h5>
                    <p class="card-text text-muted mb-2">${escapeHtml(product.category || 'Uncategorized')}</p>
                    <p class="card-text small text-truncate">${escapeHtml(product.description || '')}</p>
                    <div class="mb-3">
                        <strong>Rs. ${formatCurrency(sellingPrice)}</strong>
                        ${actualPrice > sellingPrice ? `<span class="text-decoration-line-through text-muted ms-2">Rs. ${formatCurrency(actualPrice)}</span>` : ''}
                    </div>
                    <div class="mb-3"><span class="badge ${outOfStock ? 'bg-danger' : 'bg-success'}">${outOfStock ? 'Out of stock' : `${available} available`}</span></div>
                    <div class="mt-auto">
                        <div class="input-group input-group-sm mb-2">
                            <button class="btn btn-outline-secondary product-qty-decrease" type="button" data-product-id="${escapeHtml(product.productId)}">-</button>
                            <input class="form-control text-center product-qty-input" data-product-id="${escapeHtml(product.productId)}" type="number" min="1" value="1" style="max-width:70px;">
                            <button class="btn btn-outline-secondary product-qty-increase" type="button" data-product-id="${escapeHtml(product.productId)}">+</button>
                        </div>
                        <button class="btn btn-primary w-100 product-add-button" type="button" data-product-id="${escapeHtml(product.productId)}" ${outOfStock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAdminProductPanel() {
    return `
        <div class="card shadow-sm mt-5">
            <div class="card-header">
                <h5 class="mb-0">Admin: Product Management</h5>
            </div>
            <div class="card-body">
                <div class="row gy-3">
                    <div class="col-md-6">
                        <h6>Add New Product</h6>
                        <div class="mb-2"><input id="admin-product-name" type="text" class="form-control" placeholder="Name"></div>
                        <div class="mb-2"><input id="admin-product-category" type="text" class="form-control" placeholder="Category"></div>
                        <div class="mb-2"><input id="admin-product-description" type="text" class="form-control" placeholder="Description"></div>
                        <div class="mb-2"><input id="admin-product-image" type="text" class="form-control" placeholder="Image URL"></div>
                        <div class="row g-2">
                            <div class="col"><input id="admin-product-price" type="number" class="form-control" placeholder="Price"></div>
                            <div class="col"><input id="admin-product-actual-price" type="number" class="form-control" placeholder="MRP"></div>
                            <div class="col"><input id="admin-product-stock" type="number" class="form-control" placeholder="Stock"></div>
                        </div>
                        <button id="admin-add-product" class="btn btn-success mt-3">Add product</button>
                    </div>
                    <div class="col-md-6">
                        <h6>Update Stock</h6>
                        <div class="mb-2"><input id="admin-stock-id" type="text" class="form-control" placeholder="Product ID"></div>
                        <div class="mb-2"><input id="admin-stock-value" type="number" class="form-control" placeholder="New stock"></div>
                        <button id="admin-update-stock" class="btn btn-secondary">Update stock</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function bindProductEvents() {
    document.getElementById('product-search')?.addEventListener('input', (event) => {
        state.searchText = event.target.value;
        renderProducts();
    });
    document.getElementById('product-category')?.addEventListener('change', (event) => {
        state.selectedCategory = event.target.value;
        renderProducts();
    });
    document.getElementById('refresh-products')?.addEventListener('click', renderProducts);
    document.querySelectorAll('.product-add-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const id = event.currentTarget.dataset.productId;
            const quantityInput = document.querySelector(`.product-qty-input[data-product-id="${id}"]`);
            const quantity = Number(quantityInput?.value) || 1;
            await addToCart(id, quantity);
        });
    });
    document.querySelectorAll('.product-qty-increase').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.productId;
            const quantityInput = document.querySelector(`.product-qty-input[data-product-id="${id}"]`);
            if (quantityInput) quantityInput.value = Number(quantityInput.value || 1) + 1;
        });
    });
    document.querySelectorAll('.product-qty-decrease').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.productId;
            const quantityInput = document.querySelector(`.product-qty-input[data-product-id="${id}"]`);
            if (quantityInput) {
                quantityInput.value = Math.max(1, Number(quantityInput.value || 1) - 1);
            }
        });
    });
    document.getElementById('admin-add-product')?.addEventListener('click', handleAddProduct);
    document.getElementById('admin-update-stock')?.addEventListener('click', handleUpdateStock);
}

async function addToCart(productId, quantity) {
    if (!state.user) {
        showAlert('danger', 'Please sign in before adding products to cart.');
        return;
    }
    try {
        await Api.addToCart(state.user.userId, productId, quantity);
        showAlert('success', 'Product added to cart.');
        await updateCartCount();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function handleAddProduct() {
    const payload = {
        name: document.getElementById('admin-product-name')?.value.trim(),
        category: document.getElementById('admin-product-category')?.value.trim(),
        description: document.getElementById('admin-product-description')?.value.trim(),
        imageUrl: document.getElementById('admin-product-image')?.value.trim(),
        price: Number(document.getElementById('admin-product-price')?.value) || 0,
        actualPrice: Number(document.getElementById('admin-product-actual-price')?.value) || 0,
        stock: Number(document.getElementById('admin-product-stock')?.value) || 0
    };
    if (!payload.name || payload.price <= 0 || payload.stock < 0) {
        showAlert('danger', 'Please provide valid product name, price and stock.');
        return;
    }
    try {
        await Api.addProduct(payload);
        showAlert('success', 'Product created successfully.');
        renderProducts();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function handleUpdateStock() {
    const productId = document.getElementById('admin-stock-id')?.value.trim();
    const stockValue = Number(document.getElementById('admin-stock-value')?.value);
    if (!productId || Number.isNaN(stockValue)) {
        showAlert('danger', 'Please provide a valid product ID and stock value.');
        return;
    }
    try {
        await Api.updateStock(productId, stockValue);
        showAlert('success', 'Product stock updated.');
        renderProducts();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function renderCart() {
    if (!requireAuthentication()) return;
    state.currentPage = 'cart';
    try {
        state.cartItems = await Api.getCart(state.user.userId);
    } catch (error) {
        state.cartItems = [];
        showAlert('danger', error.message);
    }
    await updateCartCount();
    const itemsHtml = state.cartItems.length ? state.cartItems.map((item, index) => renderCartItem(item, index)).join('') : '';
    const total = state.cartItems.reduce((sum, item) => sum + (Number(item.product?.price || 0) * Number(item.quantity || 0)), 0);
    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Your Cart</h3>
                    <p class="text-muted">Review items and proceed to checkout.</p>
                </div>
                <button id="refresh-cart" class="btn btn-outline-secondary">Refresh</button>
            </div>
            ${state.cartItems.length ? `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>
                <div class="d-flex justify-content-between align-items-center flex-column flex-md-row gap-3">
                    <div class="input-group w-100 w-md-50">
                        <input id="coupon-code" type="text" class="form-control" placeholder="Coupon code">
                        <button id="preview-discount" class="btn btn-outline-primary">Preview</button>
                    </div>
                    <div class="text-end">
                        <p class="mb-1">Total: <strong>Rs. ${formatCurrency(total)}</strong></p>
                        <button id="clear-cart" class="btn btn-outline-danger me-2">Clear Cart</button>
                        <button id="checkout-button" class="btn btn-primary">Proceed to Checkout</button>
                    </div>
                </div>
                <div id="checkout-panel" class="mt-4 d-none">
                    <div class="card p-3">
                        <h5>Checkout</h5>
                        <div class="row g-3 align-items-end">
                            <div class="col-md-4">
                                <label class="form-label">Payment Mode</label>
                                <select id="payment-mode" class="form-select">
                                    <option value="COD">Cash on Delivery</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Credit/Debit</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Coupon Code</label>
                                <input id="checkout-coupon" class="form-control" type="text" placeholder="Optional">
                            </div>
                            <div class="col-md-4">
                                <button id="place-order" class="btn btn-success w-100">Place Order</button>
                            </div>
                        </div>
                    </div>
                </div>
            ` : '<div class="alert alert-info">Your cart is empty. Browse products to add items.</div>'}
        </div>
    `;
    bindCartEvents();
}

function renderCartItem(item, index) {
    const product = item.product || {};
    const price = Number(product.price || 0);
    const quantity = Number(item.quantity || 0);
    return `
        <tr>
            <td>${escapeHtml(product.name || product.productId || 'Unknown')}</td>
            <td>Rs. ${formatCurrency(price)}</td>
            <td>
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-outline-secondary btn-sm cart-decrease" data-index="${index}">-</button>
                    <span>${quantity}</span>
                    <button class="btn btn-outline-secondary btn-sm cart-increase" data-index="${index}">+</button>
                </div>
            </td>
            <td>Rs. ${formatCurrency(price * quantity)}</td>
            <td><button class="btn btn-sm btn-danger cart-remove" data-index="${index}">Remove</button></td>
        </tr>
    `;
}

function bindCartEvents() {
    document.getElementById('refresh-cart')?.addEventListener('click', renderCart);
    document.getElementById('preview-discount')?.addEventListener('click', async () => {
        const code = document.getElementById('coupon-code')?.value.trim();
        if (!code) {
            showAlert('info', 'Enter a coupon code to preview discount.');
            return;
        }
        try {
            const preview = await Api.previewDiscount(state.user.userId, code);
            showAlert('success', `Discount available: ${JSON.stringify(preview)}`);
        } catch (error) {
            showAlert('danger', error.message);
        }
    });
    document.getElementById('clear-cart')?.addEventListener('click', async () => {
        try {
            await Api.clearCart(state.user.userId);
            showAlert('success', 'Cart cleared.');
            renderCart();
            updateCartCount();
        } catch (error) {
            showAlert('danger', error.message);
        }
    });
    document.getElementById('checkout-button')?.addEventListener('click', () => {
        document.getElementById('checkout-panel')?.classList.remove('d-none');
    });
    document.getElementById('place-order')?.addEventListener('click', async () => {
        const paymentMode = document.getElementById('payment-mode')?.value || 'COD';
        const couponCode = document.getElementById('checkout-coupon')?.value.trim();
        try {
            const order = await Api.placeOrder(state.user.userId, couponCode, crypto.randomUUID(), paymentMode);
            showAlert('success', `Order placed: ${order.orderId || 'completed'}`);
            renderCart();
            updateCartCount();
        } catch (error) {
            showAlert('danger', error.message);
        }
    });
    document.querySelectorAll('.cart-increase').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = Number(event.currentTarget.dataset.index);
            const item = state.cartItems[index];
            await adjustCartQuantity(item, item.quantity + 1);
        });
    });
    document.querySelectorAll('.cart-decrease').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = Number(event.currentTarget.dataset.index);
            const item = state.cartItems[index];
            if (item.quantity <= 1) {
                await removeFromCart(item);
                return;
            }
            await adjustCartQuantity(item, item.quantity - 1);
        });
    });
    document.querySelectorAll('.cart-remove').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = Number(event.currentTarget.dataset.index);
            const item = state.cartItems[index];
            await removeFromCart(item);
        });
    });
}

async function adjustCartQuantity(item, quantity) {
    try {
        await Api.updateCartQty(state.user.userId, item.product.productId, quantity);
        renderCart();
        updateCartCount();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function removeFromCart(item) {
    try {
        await Api.removeFromCart(state.user.userId, item.product.productId);
        showAlert('success', 'Item removed from cart.');
        renderCart();
        updateCartCount();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function renderOrders() {
    if (!requireAuthentication()) return;
    state.currentPage = 'orders';
    let orders = [];
    try {
        orders = state.user.role === 'admin' ? await Api.getAllOrders() : await Api.getOrdersByUser(state.user.userId);
    } catch (error) {
        showAlert('danger', error.message);
    }
    state.orders = Array.isArray(orders) ? orders : [orders].filter(Boolean);
    await updateCartCount();
    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Order History</h3>
                    <p class="text-muted">Review recent orders and order details.</p>
                </div>
                <button id="refresh-orders" class="btn btn-outline-secondary">Refresh</button>
            </div>
            ${state.orders.length ? state.orders.map(renderOrderCard).join('') : '<div class="alert alert-info">No orders found.</div>'}
        </div>
    `;
    bindOrderEvents();
}

function renderOrderCard(order) {
    const items = Array.isArray(order.items) ? order.items.map(item => `<li>${escapeHtml(item.product?.name || item.product?.productId || 'Item')} x ${item.quantity || 0}</li>`).join('') : '';
    return `
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="card-title">Order ${escapeHtml(order.orderId || 'N/A')}</h5>
                        <p class="mb-1 text-muted">Status: <span class="badge bg-secondary">${escapeHtml(order.status || 'UNKNOWN')}</span></p>
                        <p class="mb-0 text-muted">User: ${escapeHtml(order.userId || '')}</p>
                    </div>
                    <div class="text-end">
                        <p class="mb-1">Total: Rs. ${formatCurrency(order.totalAmount || 0)}</p>
                        <p class="mb-0 text-muted">${escapeHtml(order.orderDate || order.createdAt || '')}</p>
                    </div>
                </div>
                ${items ? `<ul>${items}</ul>` : '<p class="text-muted mb-0">No line items available.</p>'}
                <div class="mt-3 d-flex gap-2 flex-wrap">
                    ${order.status !== 'CANCELLED' ? `<button class="btn btn-sm btn-danger order-cancel" data-order-id="${escapeHtml(order.orderId)}">Cancel</button>` : ''}
                    ${state.user.role === 'admin' ? `<button class="btn btn-sm btn-secondary order-update" data-order-id="${escapeHtml(order.orderId)}">Update Status</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function bindOrderEvents() {
    document.getElementById('refresh-orders')?.addEventListener('click', renderOrders);
    document.querySelectorAll('.order-cancel').forEach(button => {
        button.addEventListener('click', async (event) => {
            const orderId = event.currentTarget.dataset.orderId;
            await handleCancelOrder(orderId);
        });
    });
    document.querySelectorAll('.order-update').forEach(button => {
        button.addEventListener('click', async (event) => {
            const orderId = event.currentTarget.dataset.orderId;
            const status = prompt('Enter new order status (e.g. PAID, SHIPPED, CANCELLED):');
            if (!status) return;
            await handleUpdateOrderStatus(orderId, status);
        });
    });
}

async function handleCancelOrder(orderId) {
    try {
        await Api.cancelOrder(orderId);
        showAlert('success', `Order ${orderId} cancelled.`);
        renderOrders();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function handleUpdateOrderStatus(orderId, status) {
    try {
        await Api.updateOrderStatus(orderId, status);
        showAlert('success', `Order ${orderId} status updated to ${status}.`);
        renderOrders();
    } catch (error) {
        showAlert('danger', error.message);
    }
}

async function renderLogs() {
    if (!requireAuthentication()) return;
    state.currentPage = 'logs';
    try {
        state.logs = state.user.role === 'admin' ? await Api.getAllLogs() : await Api.getLogsByUser(state.user.userId);
    } catch (error) {
        state.logs = [];
        showAlert('danger', error.message);
    }
    await updateCartCount();
    const logRows = state.logs.length ? state.logs.map(log => `
        <tr>
            <td>${escapeHtml(log.timestamp || log.createdAt || '')}</td>
            <td>${escapeHtml(log.userId || log.actor || 'N/A')}</td>
            <td>${escapeHtml(log.entityType || '')}</td>
            <td>${escapeHtml(log.action || log.message || '')}</td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-center">No logs available.</td></tr>';
    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Logs</h3>
                    <p class="text-muted">Audit trail and activity history.</p>
                </div>
                <button id="refresh-logs" class="btn btn-outline-secondary">Refresh</button>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr><th>Timestamp</th><th>User</th><th>Entity</th><th>Action</th></tr>
                    </thead>
                    <tbody>${logRows}</tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('refresh-logs')?.addEventListener('click', renderLogs);
}

async function renderAdmin() {
    if (!requireAuthentication()) return;
    if (state.user.role !== 'admin') {
        appRoot.innerHTML = '<div class="container"><div class="alert alert-warning">Admin access required.</div></div>';
        return;
    }
    state.currentPage = 'admin';
    try {
        const mode = await Api.getFailureMode();
        state.adminData.failureMode = mode.failureMode;
        state.adminData.lowStock = await Api.getLowStock();
        state.adminData.events = await Api.getEvents();
    } catch (error) {
        showAlert('danger', error.message);
    }
    await updateCartCount();
    const lowStockHtml = Array.isArray(state.adminData.lowStock) && state.adminData.lowStock.length ? state.adminData.lowStock.map(product => `
        <li>${escapeHtml(product.productId || product.name || '')} - ${escapeHtml(product.stock)}</li>
    `).join('') : '<li>No low-stock products found.</li>';
    const eventsHtml = Array.isArray(state.adminData.events) && state.adminData.events.length ? state.adminData.events.map(event => `
        <tr>
            <td>${escapeHtml(event.id || '')}</td>
            <td>${escapeHtml(event.type || '')}</td>
            <td>${escapeHtml(event.status || '')}</td>
            <td>${escapeHtml(event.message || '')}</td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-center">No admin events available.</td></tr>';

    appRoot.innerHTML = `
        <div class="container">
            <div id="alert-root"></div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3>Admin Dashboard</h3>
                    <p class="text-muted">Control failure mode, events, and inventory visibility.</p>
                </div>
                <button id="refresh-admin" class="btn btn-outline-secondary">Refresh</button>
            </div>
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card shadow-sm p-3">
                        <h5>Failure Mode</h5>
                        <p class="mb-3">Current mode: <strong>${state.adminData.failureMode ? 'ENABLED' : 'DISABLED'}</strong></p>
                        <button id="toggle-failure-mode" class="btn btn-${state.adminData.failureMode ? 'warning' : 'success'}">
                            ${state.adminData.failureMode ? 'Disable' : 'Enable'} Failure Mode
                        </button>
                    </div>
                    <div class="card shadow-sm p-3 mt-3">
                        <h5>Concurrency Simulation</h5>
                        <div class="mb-2"><input id="sim-product-id" class="form-control" placeholder="Product ID"></div>
                        <div class="row g-2 mb-2">
                            <div class="col"><input id="sim-quantity" type="number" class="form-control" placeholder="Quantity" value="5"></div>
                            <div class="col"><input id="sim-users" type="number" class="form-control" placeholder="Users" value="3"></div>
                        </div>
                        <button id="simulate-concurrency" class="btn btn-primary">Simulate</button>
                        <div id="simulate-result" class="mt-3"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card shadow-sm p-3">
                        <h5>Low Stock Products</h5>
                        <ul class="list-group list-group-flush">
                            ${lowStockHtml}
                        </ul>
                    </div>
                    <div class="card shadow-sm p-3 mt-3">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0">Event Queue</h5>
                            <button id="process-events" class="btn btn-outline-success btn-sm">Process</button>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Message</th></tr></thead>
                                <tbody>${eventsHtml}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    bindAdminEvents();
}

function bindAdminEvents() {
    document.getElementById('refresh-admin')?.addEventListener('click', renderAdmin);
    document.getElementById('toggle-failure-mode')?.addEventListener('click', async () => {
        try {
            await Api.setFailureMode(!state.adminData.failureMode);
            showAlert('success', `Failure mode ${state.adminData.failureMode ? 'disabled' : 'enabled'}.`);
            renderAdmin();
        } catch (error) {
            showAlert('danger', error.message);
        }
    });
    document.getElementById('process-events')?.addEventListener('click', async () => {
        try {
            await Api.processEvents();
            showAlert('success', 'Events processed successfully.');
            renderAdmin();
        } catch (error) {
            showAlert('danger', error.message);
        }
    });
    document.getElementById('simulate-concurrency')?.addEventListener('click', async () => {
        const productId = document.getElementById('sim-product-id')?.value.trim();
        const quantity = Number(document.getElementById('sim-quantity')?.value) || 1;
        const users = Number(document.getElementById('sim-users')?.value) || 1;
        if (!productId) {
            showAlert('danger', 'Enter a product ID to simulate concurrency.');
            return;
        }
        try {
            const result = await Api.simulateConcurrency(productId, quantity, users);
            document.getElementById('simulate-result').innerHTML = `<pre class="small bg-light p-2 rounded">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
            showAlert('success', 'Simulation completed.');
        } catch (error) {
            showAlert('danger', error.message);
        }
    });
}

async function routeChanged() {
    const hash = window.location.hash.replace(/^#\//, '') || 'login';
    if (hash !== 'login' && !state.user) {
        navigateTo('login');
        return;
    }
    if (hash === 'login' && state.user) {
        navigateTo('products');
        return;
    }
    await renderNav();
    renderFooter();
    switch (hash) {
        case 'products':
            await renderProducts();
            break;
        case 'cart':
            await renderCart();
            break;
        case 'orders':
            await renderOrders();
            break;
        case 'logs':
            await renderLogs();
            break;
        case 'admin':
            await renderAdmin();
            break;
        default:
            await renderLogin();
            break;
    }
}

window.addEventListener('hashchange', routeChanged);
window.addEventListener('DOMContentLoaded', async () => {
    await updateCartCount();
    routeChanged();
});

app.controller('MainController', function($scope, $location, $http, UserService) {
    $scope.isLoggedIn = function() {
        return UserService.isLoggedIn();
    };

    $scope.getFirstName = function() {
        return UserService.getFirstName();
    };

    $scope.getUserId = function() {
        return UserService.getUserId();
    };

    $scope.isAdmin = function() {
        return UserService.isAdmin();
    };

    $scope.isActive = function(path) {
        return $location.path() === path;
    };

    $scope.cartCount = 0;

    $scope.refreshCartCount = function() {
        var uid = UserService.getUserId();
        if (uid) {
            $http.get('http://localhost:8080/api/cart/' + uid).then(function(res) {
                $scope.cartCount = res.data.length;
            });
        }
    };

    $scope.$on('cart:updated', function() {
        $scope.refreshCartCount();
    });

    $scope.$on('$routeChangeSuccess', function() {
        if (UserService.isLoggedIn()) {
            $scope.refreshCartCount();
        }
    });

    $scope.logout = function() {
        UserService.logout();
        $scope.cartCount = 0;
        $location.path('/login');
    };
});

app.filter('inr', function() {
    return function(input) {
        if (input === null || input === undefined) return '0';
        return parseFloat(input).toLocaleString('en-IN');
    };
});
