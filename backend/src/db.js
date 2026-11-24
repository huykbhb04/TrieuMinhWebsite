import { randomBytes, randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { hashPassword, verifyPassword } from './auth.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trieuminh',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      topic VARCHAR(160) NOT NULL DEFAULT 'Tôi bị viêm xoang',
      message TEXT NULL,
      status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_consultations_status_created (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(180) NOT NULL,
      slug VARCHAR(200) NOT NULL UNIQUE,
      sku VARCHAR(80) NULL UNIQUE,
      category VARCHAR(120) NULL,
      description TEXT NULL,
      ingredients TEXT NULL,
      benefits TEXT NULL,
      usage_instructions TEXT NULL,
      price DECIMAL(12,0) NULL,
      compare_at_price DECIMAL(12,0) NULL,
      image_url VARCHAR(500) NULL,
      stock INT NOT NULL DEFAULT 0,
      unit VARCHAR(40) NOT NULL DEFAULT 'Sản phẩm',
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_products_active_created (active, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const [productColumns] = await pool.query('SHOW COLUMNS FROM products');
  const productColumnNames = new Set(productColumns.map((column) => column.Field));
  const productMigrations = {
    sku: 'ALTER TABLE products ADD COLUMN sku VARCHAR(80) NULL UNIQUE AFTER slug',
    category: 'ALTER TABLE products ADD COLUMN category VARCHAR(120) NULL AFTER sku',
    ingredients: 'ALTER TABLE products ADD COLUMN ingredients TEXT NULL AFTER description',
    benefits: 'ALTER TABLE products ADD COLUMN benefits TEXT NULL AFTER ingredients',
    usage_instructions: 'ALTER TABLE products ADD COLUMN usage_instructions TEXT NULL AFTER benefits',
    compare_at_price: 'ALTER TABLE products ADD COLUMN compare_at_price DECIMAL(12,0) NULL AFTER price',
    unit: "ALTER TABLE products ADD COLUMN unit VARCHAR(40) NOT NULL DEFAULT 'Sản phẩm' AFTER stock",
    featured: 'ALTER TABLE products ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE AFTER unit',
  };
  for (const [column, statement] of Object.entries(productMigrations)) {
    if (!productColumnNames.has(column)) await pool.query(statement);
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(60) NOT NULL UNIQUE,
      discount_type ENUM('fixed', 'percent') NOT NULL,
      discount_value DECIMAL(12,0) NOT NULL,
      min_subtotal DECIMAL(12,0) NOT NULL DEFAULT 0,
      max_discount DECIMAL(12,0) NULL,
      starts_at DATETIME NULL,
      expires_at DATETIME NULL,
      usage_limit INT NULL,
      used_count INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_coupons_active_window (active, starts_at, expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_number VARCHAR(40) NOT NULL UNIQUE,
      idempotency_key VARCHAR(120) NULL UNIQUE,
      customer_id BIGINT UNSIGNED NULL,
      customer_name VARCHAR(120) NOT NULL,
      customer_phone VARCHAR(30) NOT NULL,
      province_code VARCHAR(30) NOT NULL,
      province_name VARCHAR(160) NOT NULL,
      district_code VARCHAR(30) NOT NULL,
      district_name VARCHAR(160) NOT NULL,
      ward_code VARCHAR(30) NOT NULL,
      ward_name VARCHAR(160) NOT NULL,
      address_line VARCHAR(300) NOT NULL,
      current_province_code VARCHAR(30) NULL,
      current_province_name VARCHAR(160) NULL,
      current_ward_code VARCHAR(30) NULL,
      current_ward_name VARCHAR(160) NULL,
      normalized_address VARCHAR(500) NULL,
      address_mapping_status ENUM('resolved', 'ambiguous', 'unresolved') NOT NULL DEFAULT 'unresolved',
      address_mapping_provider VARCHAR(120) NULL,
      address_normalized_at DATETIME NULL,
      note TEXT NULL,
      coupon_code VARCHAR(60) NULL,
      subtotal DECIMAL(12,0) NOT NULL,
      discount_total DECIMAL(12,0) NOT NULL DEFAULT 0,
      shipping_fee DECIMAL(12,0) NOT NULL DEFAULT 0,
      total DECIMAL(12,0) NOT NULL,
      payment_method ENUM('cod', 'qr') NOT NULL,
      payment_status ENUM('pending', 'paid', 'failed', 'config_pending', 'expired') NOT NULL DEFAULT 'pending',
      order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      payment_reference VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_orders_status_created (order_status, created_at),
      INDEX idx_orders_payment (payment_status, created_at),
      INDEX idx_orders_phone (customer_phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NULL,
      product_name VARCHAR(180) NOT NULL,
      product_slug VARCHAR(200) NOT NULL,
      product_sku VARCHAR(80) NULL,
      image_url VARCHAR(500) NULL,
      unit VARCHAR(40) NOT NULL,
      unit_price DECIMAL(12,0) NOT NULL,
      quantity INT NOT NULL,
      line_total DECIMAL(12,0) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_order_items_order (order_id),
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      setting_key VARCHAR(80) NOT NULL UNIQUE,
      setting_value VARCHAR(500) NOT NULL DEFAULT '',
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_links (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      label VARCHAR(120) NOT NULL,
      link_type ENUM('messenger', 'zalo', 'phone', 'email', 'social', 'custom') NOT NULL DEFAULT 'custom',
      url VARCHAR(500) NOT NULL,
      display_label VARCHAR(160) NULL,
      icon_key VARCHAR(40) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_site_links_public_order (active, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const defaultLinks = [
    ['Messenger', 'messenger', 'https://m.me/your-page', 'Tư vấn qua Messenger', 'messenger', 10],
    ['Zalo', 'zalo', 'https://zalo.me/84921685789', 'Tư vấn qua Zalo', 'zalo', 20],
    ['Facebook', 'social', '', 'Facebook', 'facebook', 30],
  ];
  for (const [label, linkType, url, displayLabel, iconKey, sortOrder] of defaultLinks) {
    const [existing] = await pool.execute('SELECT id FROM site_links WHERE label = ? LIMIT 1', [label]);
    if (!existing.length) await pool.execute('INSERT INTO site_links (label, link_type, url, display_label, icon_key, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, TRUE)', [label, linkType, url, displayLabel, iconKey, sortOrder]);
  }
  const defaultSettings = {
    messenger_url: 'https://m.me/your-page',
    hotline_phone: '+84921685789',
    hotline_label: '0921.685.789',
    zalo_url: 'https://zalo.me/84921685789',
    contact_email: 'hello@minhxoang.vn',
    facebook_url: '',
    instagram_url: 'https://instagram.com',
    linkedin_url: 'https://linkedin.com',
  };
  for (const [settingKey, settingValue] of Object.entries(defaultSettings)) {
    await pool.execute('INSERT IGNORE INTO site_settings (setting_key, setting_value, is_public) VALUES (?, ?, TRUE)', [settingKey, settingValue]);
  }  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id CHAR(36) NOT NULL,
      guest_session_id CHAR(36) NOT NULL,
      customer_id BIGINT UNSIGNED NULL,
      guest_name VARCHAR(120) NOT NULL,
      mode ENUM('ai', 'manual') NOT NULL DEFAULT 'manual',
      status ENUM('open', 'waiting', 'assigned', 'closed') NOT NULL DEFAULT 'open',
      assigned_user_id BIGINT UNSIGNED NULL,
      unread_for_staff INT NOT NULL DEFAULT 0,
      unread_for_guest INT NOT NULL DEFAULT 0,
      consent_at DATETIME NULL,
      last_message_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_chat_guest_session (guest_session_id),
      INDEX idx_chat_status_last (status, last_message_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id CHAR(36) NOT NULL,
      sender_type ENUM('guest', 'customer', 'staff', 'admin', 'ai', 'system') NOT NULL,
      sender_user_id BIGINT UNSIGNED NULL,
      client_message_id CHAR(36) NULL,
      message_type ENUM('text', 'image') NOT NULL DEFAULT 'text',
      media_url VARCHAR(500) NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_chat_client_message (conversation_id, client_message_id),
      INDEX idx_chat_messages_conversation (conversation_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_handoffs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id CHAR(36) NOT NULL,
      reason VARCHAR(255) NULL,
      status ENUM('requested', 'claimed', 'resolved', 'closed') NOT NULL DEFAULT 'requested',
      assigned_user_id BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_chat_handoffs_status (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const [chatMessageColumns] = await pool.query('SHOW COLUMNS FROM chat_messages');
  const chatMessageColumnNames = new Set(chatMessageColumns.map((column) => column.Field));
  if (!chatMessageColumnNames.has('message_type')) await pool.query("ALTER TABLE chat_messages ADD COLUMN message_type ENUM('text', 'image') NOT NULL DEFAULT 'text' AFTER client_message_id");
  if (!chatMessageColumnNames.has('media_url')) await pool.query('ALTER TABLE chat_messages ADD COLUMN media_url VARCHAR(500) NULL AFTER message_type');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      username VARCHAR(60) NULL UNIQUE,
      email VARCHAR(190) NULL UNIQUE,
      phone VARCHAR(30) NULL,
      password_hash VARCHAR(180) NOT NULL,
      role ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_users_role_active (role, active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const [orderColumns] = await pool.query('SHOW COLUMNS FROM orders');
  const orderColumnNames = new Set(orderColumns.map((column) => column.Field));
  const orderMigrations = {
    current_province_code: 'ALTER TABLE orders ADD COLUMN current_province_code VARCHAR(30) NULL AFTER address_line',
    current_province_name: 'ALTER TABLE orders ADD COLUMN current_province_name VARCHAR(160) NULL AFTER current_province_code',
    current_ward_code: 'ALTER TABLE orders ADD COLUMN current_ward_code VARCHAR(30) NULL AFTER current_province_name',
    current_ward_name: 'ALTER TABLE orders ADD COLUMN current_ward_name VARCHAR(160) NULL AFTER current_ward_code',
    normalized_address: 'ALTER TABLE orders ADD COLUMN normalized_address VARCHAR(500) NULL AFTER current_ward_name',
    address_mapping_status: "ALTER TABLE orders ADD COLUMN address_mapping_status ENUM('resolved', 'ambiguous', 'unresolved') NOT NULL DEFAULT 'unresolved' AFTER normalized_address",
    address_mapping_provider: 'ALTER TABLE orders ADD COLUMN address_mapping_provider VARCHAR(120) NULL AFTER address_mapping_status',
    address_normalized_at: 'ALTER TABLE orders ADD COLUMN address_normalized_at DATETIME NULL AFTER address_mapping_provider',
  };
  for (const [column, statement] of Object.entries(orderMigrations)) if (!orderColumnNames.has(column)) await pool.query(statement);

  // Migrate databases created by the earlier email-only version without deleting existing users.
  const [columns] = await pool.query('SHOW COLUMNS FROM users');
  if (!columns.some((column) => column.Field === 'username')) {
    await pool.query('ALTER TABLE users ADD COLUMN username VARCHAR(60) NULL UNIQUE AFTER name');
  }
  const email = columns.find((column) => column.Field === 'email');
  if (email?.Null === 'NO') await pool.query('ALTER TABLE users MODIFY COLUMN email VARCHAR(190) NULL');

  // Disable only untouched demo accounts created with the old, public sample passwords.
  const legacyAccounts = [
    ['admin@trieuminh.local', 'Admin@123456'],
    ['staff@trieuminh.local', 'Staff@123456'],
    ['customer@trieuminh.local', 'Customer@123456'],
  ];
  for (const [address, samplePassword] of legacyAccounts) {
    const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE email = ? AND username IS NULL', [address]);
    for (const row of rows) {
      if (verifyPassword(samplePassword, row.password_hash)) await pool.execute('UPDATE users SET active = FALSE WHERE id = ?', [row.id]);
    }
  }

  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' AND username IS NOT NULL AND active = TRUE LIMIT 1");
  if (!admins.length) {
    const username = process.env.INITIAL_ADMIN_USERNAME?.trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!username || !/^[a-z0-9_]{3,60}$/.test(username) || !password || password.length < 12 || password.startsWith('replace_with_')) {
      throw new Error('Cấu hình INITIAL_ADMIN_USERNAME và INITIAL_ADMIN_PASSWORD (ít nhất 12 ký tự) trong backend/.env để tạo admin đầu tiên.');
    }
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (existing.length) throw new Error('INITIAL_ADMIN_USERNAME đã được sử dụng. Chọn tên đăng nhập khác.');
    await pool.execute('INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, NULL, ?, ?)', ['Quản trị viên', username, hashPassword(password), 'admin']);
  }
}

export async function findUserByUsername(username) {
  const [rows] = await pool.execute('SELECT id, name, username, email, phone, password_hash, role, active, created_at FROM users WHERE username = ? LIMIT 1', [username.trim().toLowerCase()]);
  return rows[0] || null;
}

export async function findCustomerByEmail(email) {
  const [rows] = await pool.execute("SELECT id, name, username, email, phone, password_hash, role, active, created_at FROM users WHERE email = ? AND role = 'customer' LIMIT 1", [email.trim().toLowerCase()]);
  return rows[0] || null;
}

export async function getUserById(id) {
  const [rows] = await pool.execute('SELECT id, name, username, email, phone, role, active, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function listUsers() {
  const [rows] = await pool.query('SELECT id, name, username, email, phone, role, active, created_at FROM users ORDER BY created_at DESC');
  return rows;
}

export async function createUser({ name, username, phone, password, role }) {
  const [result] = await pool.execute('INSERT INTO users (name, username, email, phone, password_hash, role) VALUES (?, ?, NULL, ?, ?, ?)', [name.trim(), username.trim().toLowerCase(), phone?.trim() || null, hashPassword(password), role]);
  return result.insertId;
}

export async function listConsultations() {
  const [rows] = await pool.query('SELECT id, name, phone, topic, message, status, created_at, updated_at FROM consultations ORDER BY created_at DESC');
  return rows;
}

export async function updateConsultationStatus(id, status) {
  await pool.execute('UPDATE consultations SET status = ? WHERE id = ?', [status, id]);
}

export async function listProducts({ includeInactive = false } = {}) {
  const [rows] = await pool.query(`SELECT id, name, slug, sku, category, description, ingredients, benefits, usage_instructions, price, compare_at_price, image_url, stock, unit, featured, active, created_at, updated_at FROM products ${includeInactive ? '' : 'WHERE active = TRUE'} ORDER BY featured DESC, created_at DESC`);
  return rows;
}

export async function getProductBySlug(slug) {
  const [rows] = await pool.execute('SELECT id, name, slug, sku, category, description, ingredients, benefits, usage_instructions, price, compare_at_price, image_url, stock, unit, featured, active, created_at, updated_at FROM products WHERE slug = ? AND active = TRUE LIMIT 1', [slug]);
  return rows[0] || null;
}

export async function createProduct({ name, slug, sku, category, description, ingredients, benefits, usageInstructions, price, compareAtPrice, imageUrl, stock, unit, featured }) {
  const [result] = await pool.execute('INSERT INTO products (name, slug, sku, category, description, ingredients, benefits, usage_instructions, price, compare_at_price, image_url, stock, unit, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name.trim(), slug.trim().toLowerCase(), sku?.trim() || null, category?.trim() || null, description?.trim() || null, ingredients?.trim() || null, benefits?.trim() || null, usageInstructions?.trim() || null, price === '' || price == null ? null : Number(price), compareAtPrice === '' || compareAtPrice == null ? null : Number(compareAtPrice), imageUrl?.trim() || null, Number(stock || 0), unit?.trim() || 'Sản phẩm', Boolean(featured)]);
  return result.insertId;
}

export async function updateProduct(id, { name, slug, sku, category, description, ingredients, benefits, usageInstructions, price, compareAtPrice, imageUrl, stock, unit, featured, active }) {
  await pool.execute('UPDATE products SET name = ?, slug = ?, sku = ?, category = ?, description = ?, ingredients = ?, benefits = ?, usage_instructions = ?, price = ?, compare_at_price = ?, image_url = ?, stock = ?, unit = ?, featured = ?, active = ? WHERE id = ?', [name.trim(), slug.trim().toLowerCase(), sku?.trim() || null, category?.trim() || null, description?.trim() || null, ingredients?.trim() || null, benefits?.trim() || null, usageInstructions?.trim() || null, price === '' || price == null ? null : Number(price), compareAtPrice === '' || compareAtPrice == null ? null : Number(compareAtPrice), imageUrl?.trim() || null, Number(stock || 0), unit?.trim() || 'Sản phẩm', Boolean(featured), active !== false, id]);
}

export async function deleteProduct(id) {
  await pool.execute('DELETE FROM products WHERE id = ?', [id]);
}

export async function updateUser(id, { name, username, phone, password, role, active }) {
  if (password) await pool.execute('UPDATE users SET name = ?, username = ?, phone = ?, password_hash = ?, role = ?, active = ? WHERE id = ?', [name.trim(), username.trim().toLowerCase(), phone?.trim() || null, hashPassword(password), role, active !== false, id]);
  else await pool.execute('UPDATE users SET name = ?, username = ?, phone = ?, role = ?, active = ? WHERE id = ?', [name.trim(), username.trim().toLowerCase(), phone?.trim() || null, role, active !== false, id]);
}

export async function deleteUser(id) {
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
}

export async function saveConsultation({ name, phone, topic, message }) {
  const [result] = await pool.execute('INSERT INTO consultations (name, phone, topic, message) VALUES (?, ?, ?, ?)', [name.trim(), phone.trim(), topic?.trim() || 'Tôi bị viêm xoang', message?.trim() || null]);
  return result.insertId;
}

export async function getDatabaseStatus() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return { connected: true, database: process.env.DB_NAME || 'trieuminh' };
  } finally {
    connection.release();
  }
}

export async function getOrderPricing(items, couponCode = '') {
  const connection = await pool.getConnection();
  try { return await calculateOrderPricing(connection, items, couponCode, false); }
  finally { connection.release(); }
}

async function calculateOrderPricing(connection, rawItems, couponCode = '', lock = false) {
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 30) throw Object.assign(new Error('Giỏ hàng không hợp lệ.'), { status: 422 });
  const requested = new Map();
  for (const item of rawItems) {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw Object.assign(new Error('Số lượng sản phẩm không hợp lệ.'), { status: 422 });
    requested.set(productId, (requested.get(productId) || 0) + quantity);
  }
  const items = [];
  let subtotal = 0;
  for (const [productId, quantity] of requested) {
    const [rows] = await connection.execute(`SELECT id, name, slug, sku, image_url, unit, price, stock, active FROM products WHERE id = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`, [productId]);
    const product = rows[0];
    if (!product || !product.active) throw Object.assign(new Error('Một sản phẩm không còn khả dụng.'), { status: 409 });
    if (product.stock < quantity) throw Object.assign(new Error(`Sản phẩm “${product.name}” chỉ còn ${product.stock} sản phẩm.`), { status: 409 });
    const unitPrice = Number(product.price || 0);
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;
    items.push({ product, quantity, unitPrice, lineTotal });
  }
  let discountTotal = 0;
  let coupon = null;
  const normalizedCode = String(couponCode || '').trim().toUpperCase();
  if (normalizedCode) {
    const [rows] = await connection.execute('SELECT * FROM coupons WHERE code = ? LIMIT 1' + (lock ? ' FOR UPDATE' : ''), [normalizedCode]);
    coupon = rows[0];
    const now = Date.now();
    if (!coupon || !coupon.active || (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) || (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) || (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) || subtotal < Number(coupon.min_subtotal || 0)) throw Object.assign(new Error('Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện.'), { status: 422 });
    discountTotal = coupon.discount_type === 'percent' ? Math.floor(subtotal * Number(coupon.discount_value) / 100) : Number(coupon.discount_value);
    if (coupon.max_discount !== null) discountTotal = Math.min(discountTotal, Number(coupon.max_discount));
    discountTotal = Math.max(0, Math.min(discountTotal, subtotal));
  }
  const shippingFee = 0;
  return { items, subtotal, discountTotal, shippingFee, total: subtotal - discountTotal + shippingFee, coupon, couponCode: normalizedCode || null };
}

export async function createOrder({ items, customer, idempotencyKey, couponCode, paymentMethod, location }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (idempotencyKey) {
      const [existing] = await connection.execute('SELECT id, order_number, order_status, payment_method, payment_status, normalized_address, subtotal, discount_total, shipping_fee, total FROM orders WHERE idempotency_key = ? LIMIT 1', [idempotencyKey]);
      if (existing[0]) { await connection.commit(); return { order: existing[0], duplicate: true }; }
    }
    const pricing = await calculateOrderPricing(connection, items, couponCode, true);
    const orderNumber = `TM-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const paymentStatus = paymentMethod === 'qr' ? 'pending' : 'pending';
    const [result] = await connection.execute(`INSERT INTO orders (order_number, idempotency_key, customer_name, customer_phone, province_code, province_name, district_code, district_name, ward_code, ward_name, address_line, current_province_code, current_province_name, current_ward_code, current_ward_name, normalized_address, address_mapping_status, address_mapping_provider, address_normalized_at, note, coupon_code, subtotal, discount_total, shipping_fee, total, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderNumber, idempotencyKey || null, customer.name.trim(), customer.phone.trim(), location.legacy.province.code, location.legacy.province.name, location.legacy.district.code, location.legacy.district.name, location.legacy.ward.code, location.legacy.ward.name, customer.addressLine.trim(), location.current.province.code, location.current.province.name, location.current.ward.code, location.current.ward.name, location.formattedAddress, 'resolved', location.provider, new Date(location.normalizedAt), customer.note?.trim() || null, pricing.couponCode, pricing.subtotal, pricing.discountTotal, pricing.shippingFee, pricing.total, paymentMethod, paymentStatus]);
    for (const item of pricing.items) {
      await connection.execute('INSERT INTO order_items (order_id, product_id, product_name, product_slug, product_sku, image_url, unit, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [result.insertId, item.product.id, item.product.name, item.product.slug, item.product.sku || null, item.product.image_url || null, item.product.unit || 'Sản phẩm', item.unitPrice, item.quantity, item.lineTotal]);
      await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product.id]);
    }
    if (pricing.coupon) await connection.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [pricing.coupon.id]);
    await connection.commit();
    return { order: { id: result.insertId, orderNumber, status: 'pending', paymentMethod, paymentStatus, normalizedAddress: location.formattedAddress, legacyAddress: location.legacyFormattedAddress, subtotal: pricing.subtotal, discountTotal: pricing.discountTotal, shippingFee: pricing.shippingFee, total: pricing.total, items: pricing.items.map((item) => ({ name: item.product.name, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })) }, duplicate: false };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function listOrders() {
  const [rows] = await pool.query('SELECT id, order_number, customer_name, customer_phone, province_name, district_name, ward_name, normalized_address, current_province_name, current_ward_name, address_mapping_status, subtotal, discount_total, shipping_fee, total, payment_method, payment_status, order_status, created_at FROM orders ORDER BY created_at DESC');
  return rows;
}

export async function updateOrderStatus(id, orderStatus) { await pool.execute('UPDATE orders SET order_status = ? WHERE id = ?', [orderStatus, id]); }
export async function updateOrderPaymentStatus(id, paymentStatus) { await pool.execute('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, id]); }

export async function listSiteSettings({ publicOnly = false } = {}) {
  const [rows] = await pool.query(`SELECT setting_key, setting_value, is_public, updated_at FROM site_settings ${publicOnly ? 'WHERE is_public = TRUE' : ''} ORDER BY setting_key ASC`);
  return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
}

export async function listSiteLinks({ publicOnly = false } = {}) {
  const [rows] = await pool.query(`SELECT id, label, link_type, url, display_label, icon_key, sort_order, active, updated_at FROM site_links ${publicOnly ? 'WHERE active = TRUE' : ''} ORDER BY sort_order ASC, id ASC`);
  return rows;
}

export async function createSiteLink(link) {
  const [result] = await pool.execute('INSERT INTO site_links (label, link_type, url, display_label, icon_key, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)', [link.label.trim(), link.linkType, link.url.trim(), link.displayLabel?.trim() || null, link.iconKey?.trim() || null, Number(link.sortOrder || 0), link.active !== false]);
  return result.insertId;
}

export async function updateSiteLink(id, link) {
  await pool.execute('UPDATE site_links SET label = ?, link_type = ?, url = ?, display_label = ?, icon_key = ?, sort_order = ?, active = ? WHERE id = ?', [link.label.trim(), link.linkType, link.url.trim(), link.displayLabel?.trim() || null, link.iconKey?.trim() || null, Number(link.sortOrder || 0), link.active !== false, id]);
}

export async function deleteSiteLink(id) { await pool.execute('DELETE FROM site_links WHERE id = ?', [id]); }

export async function createChatConversation({ guestSessionId, guestName, mode = 'manual', consent = false }) {
  const [existing] = await pool.execute('SELECT * FROM chat_conversations WHERE guest_session_id = ? LIMIT 1', [guestSessionId]);
  if (existing[0]) return existing[0];
  const id = randomUUID();
  await pool.execute('INSERT INTO chat_conversations (id, guest_session_id, guest_name, mode, consent_at) VALUES (?, ?, ?, ?, ?)', [id, guestSessionId, guestName.trim(), 'ai', consent ? new Date() : null]);
  await pool.execute('INSERT INTO chat_messages (conversation_id, sender_type, body) VALUES (?, ?, ?)', [id, 'system', `Chào ${guestName.trim()}, Anh/Chị đang cần tư vấn về viêm xoang? Anh/Chị để lại tình trạng để Triệu Minh hỗ trợ nhé!`]);
  const [rows] = await pool.execute('SELECT * FROM chat_conversations WHERE id = ?', [id]);
  return rows[0];
}
export async function getChatConversation(id) { const [rows] = await pool.execute('SELECT * FROM chat_conversations WHERE id = ? LIMIT 1', [id]); return rows[0] || null; }
export async function listChatConversations() { const [rows] = await pool.query('SELECT id, guest_name, mode, status, assigned_user_id, unread_for_staff, last_message_at, created_at FROM chat_conversations ORDER BY COALESCE(last_message_at, created_at) DESC'); return rows; }
export async function listChatMessages(conversationId, limit = 100) { const [rows] = await pool.execute('SELECT id, conversation_id, sender_type, message_type, media_url, body, created_at, read_at FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?', [conversationId, Math.min(Number(limit) || 100, 200)]); return rows; }
export async function addChatMessage({ conversationId, senderType, senderUserId = null, clientMessageId = null, body, messageType = 'text', mediaUrl = null }) {
  const cleanBody = String(body || '').trim(); if (messageType === 'text' && (!cleanBody || cleanBody.length > 4000)) throw Object.assign(new Error('Tin nhắn trống hoặc quá dài.'), { status: 422 });
  if (!['text', 'image'].includes(messageType) || (messageType === 'image' && !/^https:\/\//i.test(String(mediaUrl || ''))) ) throw Object.assign(new Error('Dữ liệu media không hợp lệ.'), { status: 422 });
  if (clientMessageId) { const [existing] = await pool.execute('SELECT * FROM chat_messages WHERE conversation_id = ? AND client_message_id = ? LIMIT 1', [conversationId, clientMessageId]); if (existing[0]) return existing[0]; }
  const [result] = await pool.execute('INSERT INTO chat_messages (conversation_id, sender_type, sender_user_id, client_message_id, message_type, media_url, body) VALUES (?, ?, ?, ?, ?, ?, ?)', [conversationId, senderType, senderUserId, clientMessageId, messageType, mediaUrl, cleanBody || 'Ảnh đính kèm']);
  await pool.execute('UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP, unread_for_staff = unread_for_staff + ? WHERE id = ?', [senderType === 'guest' || senderType === 'customer' ? 1 : 0, conversationId]);
  const [rows] = await pool.execute('SELECT id, conversation_id, sender_type, message_type, media_url, body, created_at, read_at FROM chat_messages WHERE id = ?', [result.insertId]); return rows[0];
}
export async function updateChatConversation(id, fields) { const values = []; const params = []; const allowed = ['mode','status','assigned_user_id']; for (const key of allowed) if (fields[key] !== undefined) { values.push(`${key} = ?`); params.push(fields[key]); } if (!values.length) return; params.push(id); await pool.execute(`UPDATE chat_conversations SET ${values.join(', ')} WHERE id = ?`, params); }
export async function markChatRead(id) { await pool.execute('UPDATE chat_conversations SET unread_for_staff = 0 WHERE id = ?', [id]); }

export async function updateSiteSettings(settings) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of Object.entries(settings)) await connection.execute('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}



