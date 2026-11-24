import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { createOrder, createProduct, createSiteLink, createUser, createChatConversation, addChatMessage, deleteProduct, deleteSiteLink, deleteUser, findCustomerByEmail, findUserByUsername, getChatConversation, getDatabaseStatus, getOrderPricing, getProductBySlug, getUserById, initializeDatabase, listChatConversations, listChatMessages, listConsultations, listOrders, listProducts, listSiteLinks, listSiteSettings, listUsers, markChatRead, saveConsultation, updateChatConversation, updateConsultationStatus, updateOrderPaymentStatus, updateOrderStatus, updateProduct, updateSiteLink, updateSiteSettings, updateUser } from './db.js';
import { assertAuthConfiguration, createAuthToken, readAuthToken, verifyPassword } from './auth.js';
import { listLegacyDistricts, listLegacyProvinces, listLegacyWards, normalizeDeliveryAddress } from './locations.js';
import { generateAiReply, checkAiConnection } from './aiChat.js';

const sourceCards = [
  { match: 'suckhoedoisong.vn/su-co-thich-dam-thai', title: 'Sư cô Thích Đàm Thái – Ngọn đèn sáng trong y học cổ truyền dân tộc', source: 'Sức khỏe & Đời sống', url: 'https://suckhoedoisong.vn/su-co-thich-dam-thai-ngon-den-sang-trong-y-hoc-co-truyen-dan-toc-169260108165357686.htm', imageUrl: '/news-license-practice.jpg' },
  { match: 'suckhoedoisong.vn/bai-thuoc-gia-truyen', title: 'Bài thuốc gia truyền của nhà sư dân tộc Dao', source: 'Sức khỏe & Đời sống', url: 'https://suckhoedoisong.vn/bai-thuoc-gia-truyen-cua-nha-su-dan-toc-dao-169250909094544251.htm', imageUrl: '/news-traditional-medicine-certificate.jpg' },
  { match: 'suckhoeviet.org.vn/xit-xoang-trieu-minh', title: 'Xịt xoang Triệu Minh – Bài thuốc từ tình thương và trí tuệ', source: 'Sức khỏe Việt', url: 'https://suckhoeviet.org.vn/xit-xoang-trieu-minh-bai-thuoc-tu-tinh-thuong-va-tri-tue-24824.html', imageUrl: '/news-traditional-medicine-council.jpg' },
];
function findSourceCards(text) { return sourceCards.filter((card) => text.includes(card.match)); }

const app = express();
const port = process.env.PORT || 5000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)),
});

const configuredOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim());
app.use(cors({ origin(origin, callback) { if (!origin || configuredOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true); return callback(new Error('Origin không được phép.')); } }));
app.use(express.json({ limit: '20kb' }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get('/api/health', async (_req, res) => {
  try {
    const database = await getDatabaseStatus();
    return res.json({ ok: true, service: 'minh-xoang-api', database });
  } catch (error) {
    return res.status(503).json({ ok: false, service: 'minh-xoang-api', database: { connected: false }, message: 'Không kết nối được MySQL. Hãy kiểm tra XAMPP và file backend/.env.', detail: error.code });
  }
});

const publicSettingKeys = ['messenger_url', 'hotline_phone', 'hotline_label', 'zalo_url', 'contact_email', 'facebook_url', 'instagram_url', 'linkedin_url'];
const urlSettingKeys = new Set(['messenger_url', 'zalo_url', 'facebook_url', 'instagram_url', 'linkedin_url']);
const settingDefaults = { messenger_url: 'https://m.me/your-page', hotline_phone: '+84921685789', hotline_label: '0921.685.789', zalo_url: 'https://zalo.me/84921685789', contact_email: 'hello@minhxoang.vn', facebook_url: '', instagram_url: 'https://instagram.com', linkedin_url: 'https://linkedin.com' };
function validateSiteSettings(payload) {
  const result = {};
  for (const key of publicSettingKeys) {
    if (payload[key] === undefined) continue;
    const value = String(payload[key] ?? '').trim();
    if (value.length > 500) throw Object.assign(new Error(`${key} quá dài.`), { status: 422 });
    if (urlSettingKeys.has(key) && value && !/^https:\/\//i.test(value) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(value)) throw Object.assign(new Error(`${key} phải là URL https hợp lệ.`), { status: 422 });
    if (key === 'contact_email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw Object.assign(new Error('Email liên hệ không hợp lệ.'), { status: 422 });
    if (key === 'hotline_phone' && value && !/^[+\d\s().-]{7,30}$/.test(value)) throw Object.assign(new Error('Số hotline không hợp lệ.'), { status: 422 });
    result[key] = value;
  }
  return result;
}

app.post('/api/consultations', async (req, res) => {
  const { name, phone, topic, message } = req.body || {};
  if (!name?.trim() || !phone?.trim()) return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại.' });
  try {
    const id = await saveConsultation({ name, phone, topic, message });
    return res.status(201).json({ message: 'Đã lưu yêu cầu tư vấn.', id });
  } catch (error) {
    console.error('Consultation save failed:', error.code || error.message);
    return res.status(503).json({ message: 'Chưa lưu được yêu cầu. Hãy kiểm tra MySQL trong XAMPP và cấu hình backend/.env.' });
  }
});

async function requireRole(roles, req, res, next) {
  const token = readAuthToken(req.get('authorization')?.replace(/^Bearer /i, ''));
  if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
  try {
    const user = await getUserById(token.id);
    if (!user?.active || user.role !== token.role || !roles.includes(user.role)) return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
    req.user = user;
    return next();
  } catch (error) { return next(error); }
}

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim()) return res.status(400).json({ message: 'Nhập tên đăng nhập và mật khẩu.' });
  try {
    const user = await findUserByUsername(username);
    if (!user?.active || !['staff', 'admin'].includes(user.role) || !verifyPassword(password, user.password_hash)) return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    const { password_hash: _passwordHash, ...profile } = user;
    return res.json({ token: createAuthToken(user), user: profile });
  } catch (error) {
    console.error('Login failed:', error.code || error.message);
    return res.status(503).json({ message: 'Chưa thể đăng nhập. Hãy kiểm tra MySQL.' });
  }
});

// Khách hàng đăng nhập bằng email khi tính năng đăng ký được bổ sung sau này.
app.post('/api/auth/customer/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim()) return res.status(400).json({ message: 'Nhập email và mật khẩu.' });
  try {
    const user = await findCustomerByEmail(email);
    if (!user?.active || !verifyPassword(password, user.password_hash)) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    const { password_hash: _passwordHash, ...profile } = user;
    return res.json({ token: createAuthToken(user), user: profile });
  } catch (error) {
    console.error('Customer login failed:', error.code || error.message);
    return res.status(503).json({ message: 'Chưa thể đăng nhập. Hãy kiểm tra MySQL.' });
  }
});

app.get('/api/auth/me', (req, res, next) => requireRole(['customer', 'staff', 'admin'], req, res, next), (req, res) => res.json({ user: req.user }));
app.get('/api/site-settings', async (_req, res, next) => { try { const settings = await listSiteSettings({ publicOnly: true }); const links = await listSiteLinks({ publicOnly: true }); return res.json({ settings: { ...settingDefaults, ...settings }, links }); } catch (error) { return next(error); } });
app.get('/api/admin/site-settings', (req, res, next) => requireRole(['admin'], req, res, next), async (_req, res, next) => { try { const settings = await listSiteSettings(); const links = await listSiteLinks(); return res.json({ settings: { ...settingDefaults, ...settings }, links }); } catch (error) { return next(error); } });
app.put('/api/admin/site-settings', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { try { const settings = validateSiteSettings(req.body || {}); await updateSiteSettings(settings); return res.json({ message: 'Đã lưu cấu hình kết nối.', settings: { ...settingDefaults, ...(await listSiteSettings()) } }); } catch (error) { return next(error); } });

function validateSiteLink(payload) {
  const label = String(payload.label || '').trim(); const linkType = String(payload.linkType || '').trim(); const url = String(payload.url || '').trim();
  if (!label || label.length > 120 || !['messenger','zalo','phone','email','social','custom'].includes(linkType) || url.length > 500) throw Object.assign(new Error('Thông tin liên kết không hợp lệ.'), { status: 422 });
  if (['messenger','zalo','social','custom'].includes(linkType) && url && !/^https:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) throw Object.assign(new Error('Liên kết phải bắt đầu bằng https://.'), { status: 422 });
  if (linkType === 'phone' && !/^[+\d\s().-]{7,30}$/.test(url)) throw Object.assign(new Error('Số điện thoại không hợp lệ.'), { status: 422 });
  if (linkType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) throw Object.assign(new Error('Email không hợp lệ.'), { status: 422 });
  return { label, linkType, url, displayLabel: String(payload.displayLabel || '').trim(), iconKey: String(payload.iconKey || '').trim(), sortOrder: Number(payload.sortOrder || 0), active: payload.active !== false };
}
app.post('/api/admin/site-links', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { try { const id = await createSiteLink(validateSiteLink(req.body)); return res.status(201).json({ id, message: 'Đã thêm liên kết.' }); } catch (error) { next(error); } });
app.patch('/api/admin/site-links/:id', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { try { await updateSiteLink(req.params.id, validateSiteLink(req.body)); return res.json({ message: 'Đã cập nhật liên kết.' }); } catch (error) { next(error); } });
app.delete('/api/admin/site-links/:id', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { try { await deleteSiteLink(req.params.id); return res.json({ message: 'Đã xóa liên kết.' }); } catch (error) { next(error); } });

app.post('/api/chat/conversations', async (req, res, next) => { try { const { guestSessionId, guestName, mode, consent } = req.body || {}; if (!/^[0-9a-f-]{20,100}$/i.test(String(guestSessionId || '')) || typeof guestName !== 'string' || guestName.trim().length < 2 || guestName.length > 120) return res.status(422).json({ message: 'Nhập tên hợp lệ để bắt đầu chat.' }); const conversation = await createChatConversation({ guestSessionId, guestName, mode, consent }); return res.status(201).json({ conversation }); } catch (error) { next(error); } });
app.get('/api/chat/conversations/:id/messages', async (req, res, next) => { try { const conversation = await getChatConversation(req.params.id); if (!conversation || conversation.guest_session_id !== req.query.sessionId) return res.status(403).json({ message: 'Phiên chat không hợp lệ.' }); return res.json({ conversation, messages: await listChatMessages(conversation.id) }); } catch (error) { next(error); } });
app.post('/api/chat/conversations/:id/messages', async (req, res, next) => { try { const conversation = await getChatConversation(req.params.id); if (!conversation || conversation.guest_session_id !== req.body?.sessionId || conversation.status === 'closed') return res.status(403).json({ message: 'Phiên chat không hợp lệ hoặc đã đóng.' }); const message = await addChatMessage({ conversationId:conversation.id, senderType:'guest', clientMessageId:req.body?.clientMessageId, body:req.body?.body }); if (conversation.mode === 'ai') { try { const history = await listChatMessages(conversation.id, 20); const products = await listProducts(); const product = products.find((item) => item.slug === 'xit-xoang-trieu-minh') || products[0] || null; const productContext = product ? `Tên: ${product.name}; Giá: ${Number(product.price || 0).toLocaleString('vi-VN')}đ; Tồn kho: ${product.stock}; Mô tả: ${product.description || ''}; Thành phần: ${product.ingredients || ''}; Công dụng: ${product.benefits || ''}; Cách dùng: ${product.usage_instructions || ''}; URL: http://localhost:5173/san-pham/${product.slug}` : 'Sản phẩm hiện chưa có trong database.'; const ai = await generateAiReply(history, productContext); const aiMessage = await addChatMessage({ conversationId:conversation.id, senderType:'ai', body:ai.text }); const wantsProduct = /giá|mua|đặt|sản phẩm|xịt xoang|viêm xoang|nghẹt mũi|chảy mũi|đau mũi|công dụng|cách dùng/i.test(req.body?.body || ''); const productCard = wantsProduct && product ? { id:product.id, name:product.name, slug:product.slug, imageUrl:product.image_url, price:Number(product.price || 0), compareAtPrice:product.compare_at_price ? Number(product.compare_at_price) : null, stock:product.stock, unit:product.unit, url:`/san-pham/${product.slug}` } : null; const sourceCardsFound = findSourceCards(ai.text); if (ai.handoff) await updateChatConversation(conversation.id, { mode:'manual', status:'waiting' }); return res.status(201).json({ message, aiMessage, productCard, sourceCards: sourceCardsFound, mode:ai.handoff ? 'manual' : 'ai' }); } catch { return res.status(201).json({ message, aiUnavailable:true, mode:'manual' }); } } return res.status(201).json({ message, mode:'manual' }); } catch (error) { next(error); } });
app.post('/api/chat/conversations/:id/handoff', async (req, res, next) => { try { const conversation = await getChatConversation(req.params.id); if (!conversation || conversation.guest_session_id !== req.body?.sessionId) return res.status(403).json({ message: 'Phiên chat không hợp lệ.' }); await updateChatConversation(conversation.id, { mode:'manual', status:'waiting' }); await addChatMessage({ conversationId:conversation.id, senderType:'system', body:'Khách đã yêu cầu nhân viên hỗ trợ thủ công.' }); return res.json({ mode:'manual', status:'waiting' }); } catch (error) { next(error); } });
app.get('/api/admin/chat/ai-status', (req, res, next) => requireRole(['staff','admin'], req, res, next), async (_req, res) => { res.json(await checkAiConnection()); });
app.get('/api/admin/chat/conversations', (req, res, next) => requireRole(['staff','admin'], req, res, next), async (_req, res, next) => { try { res.json({ conversations: await listChatConversations() }); } catch (error) { next(error); } });
app.get('/api/admin/chat/conversations/:id/messages', (req, res, next) => requireRole(['staff','admin'], req, res, next), async (req, res, next) => { try { await markChatRead(req.params.id); res.json({ messages: await listChatMessages(req.params.id) }); } catch (error) { next(error); } });
app.post('/api/admin/chat/conversations/:id/messages', (req, res, next) => requireRole(['staff','admin'], req, res, next), async (req, res, next) => { try { const message = await addChatMessage({ conversationId:req.params.id, senderType:req.user.role, senderUserId:req.user.id, clientMessageId:req.body?.clientMessageId, body:req.body?.body, messageType:req.body?.messageType || 'text', mediaUrl:req.body?.mediaUrl || null }); await updateChatConversation(req.params.id, { mode:'manual', status:'assigned', assigned_user_id:req.user.id }); res.status(201).json({ message }); } catch (error) { next(error); } });
app.patch('/api/admin/chat/conversations/:id', (req, res, next) => requireRole(['staff','admin'], req, res, next), async (req, res, next) => { try { await updateChatConversation(req.params.id, req.body || {}); res.json({ message:'Đã cập nhật phiên chat.' }); } catch (error) { next(error); } });

app.get('/api/admin/users', (req, res, next) => requireRole(['admin'], req, res, next), async (_req, res, next) => { try { res.json({ users: await listUsers() }); } catch (error) { next(error); } });
app.post('/api/admin/users', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => {
  const { name, username, phone, password, role } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof username !== 'string' || !/^[a-z0-9_]{3,60}$/.test(username.trim().toLowerCase()) || typeof password !== 'string' || password.length < 12 || !['staff', 'admin'].includes(role)) return res.status(400).json({ message: 'Nhập tên, tên đăng nhập (3–60 ký tự chữ thường/số/_), mật khẩu từ 12 ký tự và vai trò admin hoặc nhân viên.' });
  try { const id = await createUser({ name, username, phone, password, role }); return res.status(201).json({ id, message: 'Đã tạo người dùng.' }); }
  catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' }); return next(error); }
});
app.get('/api/checkout/config', (_req, res) => res.json({ paymentMethods: { cod: { enabled: true }, qr: { enabled: Boolean(paymentQrEnabled), reason: paymentQrEnabled ? null : 'Thanh toán QR chưa được cấu hình.' } }, shippingFee: 0 }));
app.get('/api/locations/provinces', async (_req, res, next) => { try { return res.json(await listLegacyProvinces()); } catch (error) { return next(error); } });
app.get('/api/locations/provinces/:code/districts', async (req, res, next) => { try { return res.json(await listLegacyDistricts(req.params.code)); } catch (error) { return next(error); } });
app.get('/api/locations/districts/:code/wards', async (req, res, next) => { try { return res.json(await listLegacyWards(req.params.code)); } catch (error) { return next(error); } });
app.post('/api/locations/normalize', async (req, res, next) => { try { return res.json(await normalizeDeliveryAddress(req.body || {})); } catch (error) { return next(error); } });
app.post('/api/orders/quote', async (req, res, next) => { try { const quote = await getOrderPricing(req.body?.items, req.body?.couponCode); return res.json({ subtotal: quote.subtotal, discountTotal: quote.discountTotal, shippingFee: quote.shippingFee, total: quote.total, coupon: quote.coupon ? { code: quote.coupon.code, valid: true } : null, items: quote.items.map((item) => ({ productId: item.product.id, name: item.product.name, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })) }); } catch (error) { return next(error); } });
app.post('/api/orders', async (req, res, next) => {
  try {
    const { name, phone, addressLine, note, provinceCode, districtCode, wardCode, currentWardCode, items, couponCode, paymentMethod } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || typeof phone !== 'string' || !/^[+\d\s().-]{9,20}$/.test(phone.trim()) || typeof addressLine !== 'string' || addressLine.trim().length < 3) return res.status(422).json({ message: 'Vui lòng nhập đúng họ tên, số điện thoại và địa chỉ cụ thể.' });
    if (!['cod', 'qr'].includes(paymentMethod)) return res.status(422).json({ message: 'Phương thức thanh toán không hợp lệ.' });
    if (paymentMethod === 'qr' && !paymentQrEnabled) return res.status(422).json({ message: 'Thanh toán QR hiện chưa được cấu hình. Vui lòng chọn thanh toán khi nhận hàng.' });
    const location = await normalizeDeliveryAddress({ provinceCode, districtCode, wardCode, currentWardCode, addressLine });
    if (location.status !== 'resolved') return res.status(409).json({ message: 'Địa chỉ mới có nhiều kết quả. Vui lòng xác nhận xã/phường mới.', code: 'AMBIGUOUS_LOCATION', candidates: location.candidates });
    const result = await createOrder({ items, customer: { name, phone, addressLine, note }, location, couponCode, paymentMethod, idempotencyKey: req.get('Idempotency-Key')?.slice(0, 120) });
    const payment = paymentMethod === 'qr' && paymentQrEnabled ? { status: 'pending', qrImageUrl: `https://img.vietqr.io/image/${encodeURIComponent(process.env.PAYMENT_QR_BANK_ID)}-${encodeURIComponent(process.env.PAYMENT_QR_ACCOUNT_NO)}-${encodeURIComponent(process.env.PAYMENT_QR_TEMPLATE || 'compact2')}.png?amount=${result.order.total}&addInfo=${encodeURIComponent(result.order.orderNumber)}&accountName=${encodeURIComponent(process.env.PAYMENT_QR_ACCOUNT_NAME)}`, reference: result.order.orderNumber } : { status: 'not_required' };
    return res.status(result.duplicate ? 200 : 201).json({ order: result.order, payment });
  } catch (error) { return next(error); }
});

app.get('/api/admin/orders', (req, res, next) => requireRole(['staff', 'admin'], req, res, next), async (_req, res, next) => { try { res.json({ orders: await listOrders() }); } catch (error) { next(error); } });
app.patch('/api/admin/orders/:id/status', (req, res, next) => requireRole(['staff', 'admin'], req, res, next), async (req, res, next) => { if (!['pending','confirmed','processing','shipped','completed','cancelled'].includes(req.body?.status)) return res.status(422).json({ message: 'Trạng thái đơn không hợp lệ.' }); try { await updateOrderStatus(req.params.id, req.body.status); res.json({ message: 'Đã cập nhật đơn hàng.' }); } catch (error) { next(error); } });
app.patch('/api/admin/orders/:id/payment-status', (req, res, next) => requireRole(['staff', 'admin'], req, res, next), async (req, res, next) => { if (!['pending','paid','failed','config_pending','expired'].includes(req.body?.status)) return res.status(422).json({ message: 'Trạng thái thanh toán không hợp lệ.' }); try { await updateOrderPaymentStatus(req.params.id, req.body.status); res.json({ message: 'Đã cập nhật thanh toán.' }); } catch (error) { next(error); } });

app.get('/api/admin/products', (req, res, next) => requireRole(['admin'], req, res, next), async (_req, res, next) => { try { res.json({ products: await listProducts({ includeInactive: true }) }); } catch (error) { next(error); } });
app.post('/api/admin/products', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => {
  const { name, slug, sku, category, description, ingredients, benefits, usageInstructions, price, compareAtPrice, imageUrl, stock, unit, featured } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug.trim().toLowerCase())) return res.status(400).json({ message: 'Tên sản phẩm và slug hợp lệ là bắt buộc.' });
  try { const id = await createProduct({ name, slug, sku, category, description, ingredients, benefits, usageInstructions, price, compareAtPrice, imageUrl, stock, unit, featured }); return res.status(201).json({ id, message: 'Đã tạo sản phẩm.' }); } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Slug hoặc mã SKU đã tồn tại.' }); return next(error); }
});
app.patch('/api/admin/products/:id', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { try { await updateProduct(req.params.id, req.body); return res.json({ message: 'Đã cập nhật sản phẩm.' }); } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Slug hoặc mã SKU đã tồn tại.' }); return next(error); } });
app.delete('/api/admin/products/:id', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { try { await deleteProduct(req.params.id); return res.json({ message: 'Đã xóa sản phẩm.' }); } catch (error) { next(error); } });
app.patch('/api/admin/users/:id', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => {
  const { name, username, phone, password, role, active } = req.body || {};
  if (String(req.params.id) === String(req.user.id) && active === false) return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản đang đăng nhập.' });
  if (typeof name !== 'string' || !name.trim() || typeof username !== 'string' || !/^[a-z0-9_]{3,60}$/.test(username.trim().toLowerCase()) || !['staff', 'admin'].includes(role) || (password && password.length < 12)) return res.status(400).json({ message: 'Thông tin tài khoản không hợp lệ.' });
  try { await updateUser(req.params.id, { name, username, phone, password, role, active }); return res.json({ message: 'Đã cập nhật tài khoản.' }); } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' }); return next(error); }
});
app.delete('/api/admin/users/:id', (req, res, next) => requireRole(['admin'], req, res, next), async (req, res, next) => { if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'Bạn không thể xóa tài khoản đang đăng nhập.' }); try { await deleteUser(req.params.id); return res.json({ message: 'Đã xóa tài khoản.' }); } catch (error) { next(error); } });
app.get('/api/products/:slug', async (req, res, next) => { try { const product = await getProductBySlug(req.params.slug); if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' }); return res.json({ product }); } catch (error) { return next(error); } });
app.get('/api/products', async (_req, res, next) => { try { res.json({ products: await listProducts() }); } catch (error) { next(error); } });
app.get('/api/consultations', (req, res, next) => requireRole(['staff', 'admin'], req, res, next), async (_req, res, next) => { try { res.json({ consultations: await listConsultations() }); } catch (error) { next(error); } });
app.patch('/api/consultations/:id/status', (req, res, next) => requireRole(['staff', 'admin'], req, res, next), async (req, res, next) => {
  if (!['new', 'contacted', 'closed'].includes(req.body?.status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  try { await updateConsultationStatus(req.params.id, req.body.status); return res.json({ message: 'Đã cập nhật trạng thái.' }); } catch (error) { return next(error); }
});

app.post('/api/admin/upload', (req, res, next) => requireRole(['admin'], req, res, next), (req, res, next) => upload.single('image')(req, res, next), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Chọn ảnh JPG, PNG, WebP hoặc GIF (tối đa 8 MB).' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'trieu-minh/products', resource_type: 'image' }, (error, value) => error ? reject(error) : resolve(value));
      stream.end(req.file.buffer);
    });
    return res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Product image upload failed:', error.message);
    return res.status(500).json({ message: 'Cloudinary chưa được cấu hình hoặc upload thất bại.' });
  }
});

app.post('/api/upload', (req, res, next) => {
  if (!process.env.UPLOAD_TOKEN) return res.status(503).json({ message: 'Chức năng tải ảnh chưa được cấu hình.' });
  if (req.get('x-upload-token') !== process.env.UPLOAD_TOKEN) return res.status(401).json({ message: 'Không có quyền tải ảnh lên.' });
  upload.single('image')(req, res, next);
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Chọn ảnh JPG, PNG, WebP hoặc GIF (tối đa 8 MB).' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'minh-xoang', resource_type: 'image' }, (error, value) => error ? reject(error) : resolve(value));
      stream.end(req.file.buffer);
    });
    return res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch {
    return res.status(500).json({ message: 'Cloudinary chưa được cấu hình hoặc upload thất bại.' });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ message: 'Ảnh vượt quá giới hạn 8 MB hoặc dữ liệu không hợp lệ.' });
  return res.status(error.status || 500).json({ message: error.status ? error.message : 'Yêu cầu không thể xử lý.' });
});

assertAuthConfiguration();
initializeDatabase()
  .then(() => app.listen(port, () => console.log(`Minh Xoang API running at http://localhost:${port}`)))
  .catch((error) => {
    console.error('MySQL initialization failed:', error.code || error.message);
    process.exitCode = 1;
  });

// Reload marker for environment-only changes (model).
