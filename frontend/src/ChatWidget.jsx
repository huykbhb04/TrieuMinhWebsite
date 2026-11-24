import { useEffect, useRef, useState } from 'react';
import './chat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function sessionId() {
  let id = sessionStorage.getItem('tm_chat_session_id');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('tm_chat_session_id', id); }
  return id;
}

function mergeMessages(current, incoming) {
  const merged = new Map();
  [...current, ...(incoming || [])].forEach((message, index) => {
    const key = message.id ?? message.client_message_id ?? `${message.sender_type}-${message.created_at}-${index}`;
    merged.set(String(key), message);
  });
  return [...merged.values()].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
}

function initials(name) { return String(name || 'K').trim().charAt(0).toUpperCase(); }
function safeHref(url) { return /^https:\/\//i.test(url) || /^\/san-pham\//.test(url) || /^tel:|^mailto:/i.test(url) ? url : '#'; }

function RichText({ text }) {
  const lines = String(text || '').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 — $2').split(/\n+/);
  return <div className="chat-rich-text">{lines.map((line, lineIndex) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    const content = line.replace(/^\s*[-*•]\s+/, '');
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s]+)/g).filter(Boolean);
    const rendered = parts.map((part, index) => {
      if (/^\*\*.+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (/^\*.+\*$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
      if (/^https?:\/\//i.test(part)) return <a href={safeHref(part)} target="_blank" rel="noreferrer" key={index}>{part}</a>;
      return <span key={index}>{part}</span>;
    });
    return bullet ? <div className="chat-rich-text__bullet" key={lineIndex}>{rendered}</div> : <p key={lineIndex}>{rendered}</p>;
  })}</div>;
}

function ChatProductCard({ product }) {
  return <article className="chat-product-card">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span className="chat-product-card__placeholder">TM</span>}<div><small>Sản phẩm gợi ý</small><strong>{product.name}</strong><b>{Number(product.price || 0).toLocaleString('vi-VN')}đ</b><span>{product.stock > 0 ? `Còn hàng · ${product.stock} ${product.unit || ''}` : 'Tạm hết hàng'}</span><div><a href={product.url}>Xem sản phẩm</a><a className="chat-product-buy" href={`${product.url}?buy=1`}>Mua ngay</a></div></div></article>;
}

function ChatSourceCard({ card }) { return <article className="chat-source-card"><img src={card.imageUrl} alt={card.title} /><div><small>{card.source}</small><strong>{card.title}</strong><a href={card.url} target="_blank" rel="noreferrer">Đọc bài viết</a></div></article>; }

export default function ChatWidget() {
  const [open, setOpen] = useState(false); const [conversation, setConversation] = useState(null); const [messages, setMessages] = useState([]); const [productCard, setProductCard] = useState(null); const [sourceCards, setSourceCards] = useState([]); const [name, setName] = useState(''); const [body, setBody] = useState(''); const [loading, setLoading] = useState(false); const [typing, setTyping] = useState(false); const [error, setError] = useState(''); const bottomRef = useRef(null);
  const api = async (path, options = {}) => { const response = await fetch(`${API_URL}${path}`, { ...options, headers:{'Content-Type':'application/json', ...(options.headers || {})} }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Chat tạm thời không khả dụng.'); return data; };
  const refresh = async () => { if (!conversation) return; try { const data = await fetch(`${API_URL}/api/chat/conversations/${conversation.id}/messages?sessionId=${sessionId()}`).then((r) => r.json()); if (data.messages) setMessages((current) => mergeMessages([], data.messages)); } catch {} };
  useEffect(() => { if (!open || !conversation) return undefined; refresh(); const timer = setInterval(refresh, 4000); return () => clearInterval(timer); }, [open, conversation?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typing]);
  const start = async (event) => { event.preventDefault(); setLoading(true); setError(''); try { const data = await api('/api/chat/conversations', { method:'POST', body:JSON.stringify({ guestSessionId:sessionId(), guestName:name, mode:'ai', consent:true }) }); setConversation(data.conversation); const history = await fetch(`${API_URL}/api/chat/conversations/${data.conversation.id}/messages?sessionId=${sessionId()}`).then((r) => r.json()); setMessages(history.messages || []); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const send = async (event) => { event.preventDefault(); if (!body.trim() || !conversation) return; const text = body.trim(); setBody(''); setLoading(true); setTyping(true); setError(''); try { const data = await api(`/api/chat/conversations/${conversation.id}/messages`, { method:'POST', body:JSON.stringify({ sessionId:sessionId(), body:text, clientMessageId:crypto.randomUUID() }) }); setMessages((items) => mergeMessages(items, [data.message, ...(data.aiMessage ? [data.aiMessage] : [])])); if (data.productCard) setProductCard(data.productCard); if (data.sourceCards?.length) setSourceCards(data.sourceCards); if (data.mode) setConversation((current) => ({ ...current, mode:data.mode })); } catch (err) { setError(err.message); } finally { setTyping(false); setLoading(false); } };
  return <><button className="chat-launcher" onClick={() => setOpen(true)} aria-label="Mở chat">Chat</button>{open && <div className="chat-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="chat-window"><header><div><b>Triệu Minh</b><small>Tư vấn sức khỏe</small></div><button onClick={() => setOpen(false)}>×</button></header>{!conversation ? <form className="chat-start" onSubmit={start}><h2>Bắt đầu trò chuyện</h2><p>Nhập tên để Triệu Minh tư vấn về viêm xoang và sản phẩm Xịt xoang Triệu Minh.</p><input required minLength="2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên của bạn" /><button disabled={loading}>{loading ? 'Đang mở...' : 'Bắt đầu chat'}</button>{error && <em>{error}</em>}</form> : <><div className="chat-mode-bar"><span>Triệu Minh đang hỗ trợ</span></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message chat-message--${message.sender_type}`} key={message.id ?? `${message.sender_type}-${message.created_at}-${index}`}><span className="chat-avatar">{message.sender_type === 'guest' || message.sender_type === 'customer' ? initials(name) : message.sender_type === 'ai' ? 'AI' : 'TM'}</span><div className="chat-bubble"><RichText text={message.body} /></div></div>)}{productCard && <ChatProductCard product={productCard} />}{sourceCards.map((card) => <ChatSourceCard card={card} key={card.url} />)}{typing && <div className="chat-typing"><span className="chat-avatar">AI</span><span><i></i><i></i><i></i> Triệu Minh đang trả lời...</span></div>}<div ref={bottomRef} /></div><form className="chat-compose" onSubmit={send}><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nhập..." /><button disabled={loading}>Gửi</button></form>{error && <em className="chat-error">{error}</em>}</>}</section></div>}</>;
}
