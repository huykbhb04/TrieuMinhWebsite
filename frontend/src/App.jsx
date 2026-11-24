import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Instagram,
  Linkedin,
  Menu,
  Play,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';

import './product.css';
import './cart.css';
import './chat.css';
import ChatWidget from './ChatWidget';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const defaultSiteSettings = { messenger_url: 'https://m.me/your-page', hotline_phone: '+84921685789', hotline_label: '0921.685.789', zalo_url: 'https://zalo.me/84921685789', contact_email: 'hello@minhxoang.vn', facebook_url: '', instagram_url: 'https://instagram.com', linkedin_url: 'https://linkedin.com' };
function useSiteSettings() { const [settings, setSettings] = useState(defaultSiteSettings); useEffect(() => { fetch(`${API_URL}/api/site-settings`).then((response) => response.ok ? response.json() : null).then((data) => { if (data?.settings) setSettings({ ...defaultSiteSettings, ...data.settings }); }).catch(() => {}); }, []); return settings; }


const expertise = [
  { number: '01', title: 'Viêm xoang là gì?', text: 'Xoang là những khoang chứa khí quanh mũi, trán và gò má. Khi niêm mạc xoang bị viêm, dịch khó thoát ra ngoài và có thể gây nghẹt mũi, đau tức vùng mặt.' },
  { number: '02', title: 'Các dạng thường gặp', text: 'Viêm xoang có thể diễn ra trong thời gian ngắn hoặc kéo dài, tái phát. Bác sĩ sẽ dựa vào thời gian triệu chứng và nguyên nhân để đánh giá tình trạng cụ thể.' },
  { number: '03', title: 'Dấu hiệu cần chú ý', text: 'Nghẹt mũi, chảy dịch mũi, giảm khứu giác, đau hoặc nặng vùng trán và gò má là những biểu hiện thường gặp. Triệu chứng dễ nhầm với cảm lạnh hoặc viêm mũi dị ứng.' },
];

const journal = [
  { category: 'Ghi chú', title: 'Lắng nghe những tín hiệu cơ thể mỗi ngày', text: 'Một vài gợi ý để quan sát những thay đổi trong sinh hoạt thường ngày.' },
  { category: 'Thực hành', title: 'Xây thói quen chăm sóc sức khỏe bền vững', text: 'Bắt đầu từ những thay đổi nhỏ, phù hợp với chính bạn.' },
  { category: 'Quan sát', title: 'Khi nào nên tìm đến người có chuyên môn?', text: 'Những câu hỏi hữu ích để chuẩn bị trước một buổi tư vấn.' },
];

const pressArticles = [
  {
    title: 'Sư cô Thích Đàm Thái - Ngọn đèn sáng trong y học cổ truyền dân tộc',
    source: 'Sức khỏe & Đời sống',
    url: 'https://suckhoedoisong.vn/su-co-thich-dam-thai-ngon-den-sang-trong-y-hoc-co-truyen-dan-toc-169260108165357686.htm',
    image: 'https://suckhoedoisong.qltns.mediacdn.vn/thumb_w/730/324455921873985536/2026/1/8/1-17678658655511612899353.jpg',
  },
  {
    title: 'Bài thuốc gia truyền của nhà sư dân tộc Dao',
    source: 'Sức khỏe & Đời sống',
    url: 'https://suckhoedoisong.vn/bai-thuoc-gia-truyen-cua-nha-su-dan-toc-dao-169250909094544251.htm',
    image: 'https://suckhoedoisong.qltns.mediacdn.vn/thumb_w/730/324455921873985536/2025/9/9/1-17573857766562100764832.png',
  },
  {
    title: 'Xịt xoang Triệu Minh – Bài thuốc từ tình thương và trí tuệ',
    source: 'Sức khỏe Việt',
    url: 'https://suckhoeviet.org.vn/xit-xoang-trieu-minh-bai-thuoc-tu-tinh-thuong-va-tri-tue-24824.html',
    image: 'https://suckhoeviet.org.vn/stores/news_dataimages/2026/012026/20/09/17573310755a3d4323f8c4739a2ad520260120090454.2698020.jpg?rt=20260120091559',
  },
];

function MediaSlot({ label = 'Media slot', variant = 'landscape', className = '', src, type = 'image', alt = '' }) {
  if (src) return <div className={`media-slot media-slot--${variant} media-slot--filled ${className}`}>{type === 'video' ? <video src={src} controls playsInline aria-label={label} /> : <img src={src} alt={alt || label} loading="lazy" />}</div>;
  return (
    <div className={`media-slot media-slot--${variant} ${className}`} aria-label={`${label}. Chưa thêm media.`}>
      <div className="media-slot__mark"><Play size={14} fill="currentColor" /></div>
      <span>{label}</span>
      <small>Thêm ảnh / video sau</small>
    </div>
  );
}

function SectionHeading({ kicker, title, body, align = '' }) {
  return (
    <div className={`section-heading ${align}`}>
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const path = window.location.pathname;
  const isHome = path === '/' || path === '';
  const homeHref = (anchor) => isHome ? anchor : `/${anchor}`;
  const links = [['Trang chủ', homeHref('#top')], ['Sản phẩm', isHome ? '#products' : '/san-pham'], ['Về lương y', homeHref('#about')], ['Chuyên khoa', homeHref('#expertise')], ['Tin tức & Sự kiện', homeHref('#news')], ['Liên hệ', homeHref('#consultation')]];
  return (
    <header className="site-header">
      <a className="header-search" href={isHome ? '#products' : '/san-pham'} aria-label="Đến sản phẩm"><span>⌕</span> Sản phẩm</a>
      <nav className="main-nav main-nav--left" aria-label="Điều hướng đầu trang">{links.slice(0, 3).map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className="brand brand--center" href="#top" aria-label="Triệu Minh — trang chủ"><img className="brand__logo" src="/logo-trieu-minh.webp" alt="Logo Triệu Minh" /></a>
      <nav className="main-nav main-nav--right" aria-label="Điều hướng cuối trang">{links.slice(3).map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className="header-menu-icon" href="#consultation" aria-label="Đặt lịch"><span></span><span></span></a>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="mobile-nav">{open ? <X size={22} /> : <Menu size={22} />}</button>
      <nav id="mobile-nav" className={`main-nav main-nav--mobile ${open ? 'is-open' : ''}`} aria-label="Điều hướng di động">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</nav>
    </header>
  );
}

function HeroSlider() {
  const slides = [
    { src: '/hero-trieu-minh-01.webp', alt: 'Xịt xoang Triệu Minh và thảo dược người Dao' },
    { src: '/hero-trieu-minh-02.jpg', alt: 'Thu hái dược liệu cho Xịt xoang Triệu Minh' },
    { src: '/hero-trieu-minh-03.webp', alt: 'Sư thầy và người Dao chuẩn bị dược liệu' },
  ];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return undefined; const timer = setInterval(() => setCurrent((index) => (index + 1) % slides.length), 2000); return () => clearInterval(timer); }, [paused, slides.length]);
  return <div className="hero-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel"><div className="hero-slider__track">{slides.map((slide, index) => <img className={index === current ? 'is-active' : ''} src={slide.src} alt={slide.alt} key={slide.src} loading={index === 0 ? 'eager' : 'lazy'} />)}</div><div className="hero-slider__dots" aria-label="Chọn ảnh">{slides.map((slide, index) => <button className={index === current ? 'is-active' : ''} aria-label={`Xem ảnh ${index + 1}`} onClick={() => setCurrent(index)} key={slide.src} />)}</div></div>;
}

function TrustStrip() {
  const items = [
    ['/trust-process.png', 'QUY TRÌNH SẢN XUẤT', 'Chặt chẽ, đảm bảo chất lượng'],
    ['/trust-delivery.png', 'Giao hàng nhanh chóng', '2–4 ngày kể từ ngày mua hàng'],
    ['/trust-quality.png', 'CAM KẾT 100%', 'Từ thảo dược tự nhiên'],
    ['/trust-shipping.png', 'MIỄN PHÍ VẬN CHUYỂN', 'Cho đơn hàng từ 500k'],
  ];
  return <section className="trust-strip" aria-label="Cam kết dịch vụ">{items.map(([icon, title, text]) => <div className="trust-item" key={title}><img src={icon} alt="" /><div><strong>{title}</strong><small>{text}</small></div></div>)}</section>;
}

function Hero({ onConsult: _onConsult }) {
  return <><section className="hero hero--reference hero--banner-only" id="top"><img className="hero-banner-image" src="/hero-trieu-minh-banner.webp" alt="Thuốc Nam gia truyền Xoang Triệu Minh" /></section><TrustStrip /></>;
}

function About() {
  return (
    <section className="about about--profile section" id="about">
      <figure className="about__visual">
        <img src="/su-thay-thich-dam-thai.webp" alt="Sư thầy Thích Đàm Thái chia sẻ tại một buổi gặp gỡ" loading="lazy" />
        <figcaption>Sư thầy Thích Đàm Thái <span>·</span> Triệu Thị Thanh</figcaption>
      </figure>
      <div className="about__copy">
        <span className="kicker">Về lương y</span>
        <h2>Người thầy áo nâu mang học vị tiến sĩ</h2>
        <div className="about__story">
          <p>Sinh ra trong dòng tộc họ Triệu – một gia đình người Dao có truyền thống bốc thuốc chữa bệnh lâu đời tại Hòa Bình, vùng đất nổi tiếng với kho tàng y học bản địa phong phú – sư thầy Thích Đàm Thái (thế danh: Triệu Thị Thanh) đã thấm đẫm tri thức y học bản địa từ thuở nhỏ. Không chỉ tiếp nối truyền thống chữa bệnh của dòng tộc họ Triệu, sư thầy còn lựa chọn con đường xuất gia nơi cửa Phật từ năm 12 tuổi, đồng thời vươn mình ra thế giới với hành trang là tri thức hiện đại.</p>
          <p>Với gần một thập kỷ du học và nghiên cứu tại Trung Quốc, sư thầy không chỉ thành thạo Hán ngữ mà còn là dịch giả của một số tác phẩm về Lịch sử Phật giáo được dịch từ tiếng Hán sang tiếng Việt, tiêu biểu như <em>Trung Quốc thiền tông thông sử</em> và <em>Lịch sử Phật giáo Trung Hoa cận đại</em>.</p>
          <p>Đặc biệt, sư thầy còn bảo vệ thành công học vị Tiến sĩ chuyên ngành Lịch sử tại trường Đại học Sư phạm Hoa Trung, thành phố Vũ Hán, tỉnh Hồ Bắc, Trung Quốc. Với kiến thức uyên bác, sự thông minh, linh hoạt và khả năng kết nối nhuần nhuyễn giữa khoa học hiện đại và y học cổ truyền, sư thầy được nhiều người trọng vọng.</p>
        </div>
      </div>
    </section>
  );
}

function PressFeatures() {
  return (
    <section className="press-features section" id="press-features">
      <div className="press-features__heading">
        <SectionHeading kicker="Về lương y" title={<>Sư cô qua<br /><em>góc nhìn báo chí.</em></>} body="Ba bài viết giới thiệu hành trình gìn giữ giá trị y học cổ truyền và những câu chuyện phía sau Triệu Minh." />
      </div>
      <div className="press-features__grid">
        {pressArticles.map((article) => (
          <a className="press-card" href={article.url} target="_blank" rel="noreferrer" key={article.url}>
            <div className="press-card__image"><img src={article.image} alt={article.title} loading="lazy" /></div>
            <div className="press-card__meta"><span>{article.source}</span><ArrowUpRight size={16} /></div>
            <h3>{article.title}</h3>
            <span className="press-card__read">Đọc bài báo</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function FacebookVideo({ url, title }) {
  const [visible, setVisible] = useState(false);
  const videoRef = useRef(null);
  const embedUrl = `https://www.facebook.com/plugins/video.php?height=476&href=${encodeURIComponent(url)}&show_text=false&width=267&t=0&autoplay=${visible ? 'true' : 'false'}&mute=true`;
  useEffect(() => { const element = videoRef.current; if (!element) return undefined; const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold:0.25, rootMargin:'80px 0px' }); observer.observe(element); return () => observer.disconnect(); }, []);
  return <div className="facebook-video" ref={videoRef}><iframe src={embedUrl} title={title} width="267" height="476" scrolling="no" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen /><a href={url} target="_blank" rel="noreferrer">Xem video trực tiếp trên Facebook</a></div>;
}

function Expertise() {
  return (
    <section className="expertise section" id="expertise">
      <div className="expertise__top">
        <SectionHeading kicker="Chuyên khoa · Viêm xoang" title={<>Hiểu đúng về<br /><em>bệnh viêm xoang.</em></>} />
        <p className="section-aside">Những thông tin cơ bản giúp bạn nhận biết triệu chứng và trao đổi với người có chuyên môn đúng lúc.</p>
      </div>
      <div className="expertise__list">{expertise.map((item) => <article className="expertise-card" key={item.number}><span className="expertise-card__number">{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
      <div className="expertise__detail">
        <FacebookVideo url="https://www.facebook.com/reel/4534463920134662/" title="Video chia sẻ về viêm xoang và Xịt xoang Triệu Minh" />
        <section className="expertise__detail-copy"><h3>Khi nào nên đi khám?</h3>
          <p>Nếu triệu chứng kéo dài, tái phát hoặc nặng lên, bạn nên gặp bác sĩ để xác định nguyên nhân và được hướng dẫn phù hợp. Viêm xoang kéo dài có thể ảnh hưởng đến sinh hoạt và cần được theo dõi, không nên tự chẩn đoán chỉ dựa vào triệu chứng.</p>
          <p className="expertise__disclaimer">Nội dung chỉ nhằm cung cấp thông tin, không thay thế thăm khám, chẩn đoán hoặc điều trị y khoa.</p>
        </section>
      </div>
    </section>
  );
}

const newsGallery = [
  { src:'/news-license-practice.jpg', title:'Giấy phép hành nghề khám bệnh, chữa bệnh', text:'Giấy phép hành nghề do Sở Y tế tỉnh Phú Thọ cấp cho bà Triệu Thị Thanh, ghi nhận phạm vi hành nghề bằng bài thuốc gia truyền Xịt xoang Triệu Minh.' },
  { src:'/news-traditional-medicine-certificate.jpg', title:'Giấy chứng nhận người có bài thuốc gia truyền', text:'Chứng nhận người có bài thuốc gia truyền Xịt xoang Triệu Minh và thông tin về bài thuốc được ghi nhận trong hồ sơ chuyên môn.' },
  { src:'/news-health-department.jpg', title:'Hoạt động thẩm định tại Sở Y tế tỉnh Phú Thọ', text:'Hình ảnh buổi làm việc, trao đổi chuyên môn và thẩm định bài thuốc gia truyền tại Sở Y tế tỉnh Phú Thọ.' },
  { src:'/news-traditional-medicine-council.jpg', title:'Hội đồng thẩm định bài thuốc gia truyền', text:'Khoảnh khắc tại chương trình thẩm định người có bài thuốc gia truyền Xịt xoang Triệu Minh, ngày 21/07/2025.' },
];

function News() {
  return (
    <section className="news section" id="news">
      <SectionHeading kicker="Tin tức & Sự kiện" title={<>Dấu ấn trong<br /><em>hành trình Triệu Minh.</em></>} body="Những giấy phép, chứng nhận và khoảnh khắc chuyên môn ghi lại hành trình gìn giữ bài thuốc gia truyền." />
      <div className="news-gallery">{newsGallery.map((item, index) => <article className="news-gallery__item" key={item.src}><div className="news-gallery__image"><img src={item.src} alt={item.title} loading="lazy" /><span>0{index + 1}</span></div><div className="news-gallery__copy"><span className="kicker">Triệu Minh · Hồ sơ & sự kiện</span><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
    </section>
  );
}

function Journal() {
  return (
    <section className="journal section" id="journal">
      <div className="journal__top"><SectionHeading kicker="Cẩm nang sức khỏe" title={<>Kiến thức cho<br /><em>mỗi ngày khỏe hơn.</em></>} /><span className="journal__soon">Nội dung đang cập nhật</span></div>
      <div className="journal__grid">{journal.map((item, index) => <article className="journal-card" key={item.title}><MediaSlot label={`Journal cover 0${index + 1}`} variant="landscape" /><div className="journal-card__content"><span>{item.category}</span><h3>{item.title}</h3><p>{item.text}</p><span className="journal-card__pending">Bài viết đang cập nhật</span></div></article>)}</div>
    </section>
  );
}

function Consultation() {
  const [status, setStatus] = useState('idle');
  const [form, setForm] = useState({ name: '', phone: '', topic: '', message: '' });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/consultations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('request failed');
      setStatus('success');
      setForm({ name: '', phone: '', topic: '', message: '' });
    } catch { setStatus('error'); }
  };
  return (
    <section className="consultation section" id="consultation">
      <div className="consultation__intro"><span className="kicker">Liên hệ</span><h2>Bạn có điều gì<br /><em>muốn chia sẻ?</em></h2><p>Để lại thông tin và câu hỏi của bạn. Minh Xoang sẽ liên hệ để trao đổi bước tiếp theo khi có thể.</p><div className="consultation__contact"><span>Hoặc gửi email</span><a href="mailto:hello@minhxoang.vn">hello@minhxoang.vn</a></div></div>
      <form className="consultation__form" onSubmit={submit}>
        <label>Họ và tên<input name="name" value={form.name} onChange={update} required placeholder="Tên của bạn" /></label>
        <label>Số điện thoại<input name="phone" value={form.phone} onChange={update} required placeholder="Số điện thoại của bạn" /></label>
        <label>Bạn quan tâm đến<select name="topic" value={form.topic} onChange={update}><option value="">Chọn một chủ đề</option><option>Kiến thức sức khỏe</option><option>Chăm sóc chủ động</option><option>Trao đổi tư vấn</option></select></label>
        <label>Lời nhắn<textarea name="message" value={form.message} onChange={update} rows="3" placeholder="Chia sẻ điều bạn đang quan tâm..." /></label>
        <button className="button button--light" disabled={status === 'loading'}>{status === 'loading' ? 'Đang gửi...' : 'Gửi lời nhắn'} <Send size={16} /></button>
        {status === 'success' && <p className="form-message form-message--success"><Check size={15} /> API đã nhận yêu cầu thử nghiệm; dữ liệu hiện chưa được lưu.</p>}
        {status === 'error' && <p className="form-message form-message--error">Không thể gửi lúc này. Bạn hãy thử lại hoặc gửi email.</p>}
      </form>
    </section>
  );
}

function Footer({ settings = defaultSiteSettings }) {
  return <footer className="site-footer"><div className="footer__brand"><span className="brand__symbol">MX</span><p>Hiểu mình hơn.<br />Chăm sóc tốt hơn.</p></div><div className="footer__links"><div><span className="footer__label">Điều hướng</span><a href="#top">Trang chủ</a><a href="#about">Về lương y</a><a href="#expertise">Chuyên khoa</a><a href="#news">Tin tức & Sự kiện</a><a href="#journal">Cẩm nang sức khỏe</a><a href="#consultation">Liên hệ</a></div><div><span className="footer__label">Kết nối</span><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>{settings.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}<a href={settings.instagram_url} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a><a href={settings.linkedin_url} target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a></div></div><div className="footer__bottom"><span>© 2026 Minh Xoang</span><span>Thông tin chỉ mang tính tham khảo</span></div></footer>;
}

function FloatingContactBar({ settings = defaultSiteSettings }) {
  const contacts = [
    { className: 'floating-contact--messenger', href: settings.messenger_url, label: 'Tư vấn qua', value: 'Messenger', icon: '✦', external: true },
    { className: 'floating-contact--hotline', href: `tel:${settings.hotline_phone}`, label: 'Hotline tư vấn', value: settings.hotline_label, icon: '☎' },
    { className: 'floating-contact--zalo', href: settings.zalo_url, label: 'Tư vấn qua', value: 'Zalo', icon: 'Zalo', external: true },
  ];

  return <aside className="floating-contacts" aria-label="Kênh tư vấn nhanh">
    {contacts.map((contact) => <a className={`floating-contact ${contact.className}`} href={contact.href} target={contact.external ? '_blank' : undefined} rel={contact.external ? 'noreferrer' : undefined} key={contact.value}>
      <span className="floating-contact__icon">{contact.icon}</span><span className="floating-contact__text"><small>{contact.label}</small><strong>{contact.value}</strong></span>
    </a>)}
  </aside>;
}

function ConsultationDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState({ name: '', phone: '', topic: 'Tôi bị viêm xoang', message: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Request failed');
      setStatus('success');
      setForm({ name: '', phone: '', topic: 'Tôi bị viêm xoang', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return <dialog ref={dialogRef} className="consult-dialog" aria-labelledby="consult-dialog-title" onClose={() => { onClose(); setStatus('idle'); }} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
    <div className="consult-dialog__content">
      <button className="consult-dialog__close" type="button" aria-label="Đóng form tư vấn" onClick={() => dialogRef.current.close()}><X size={21} /></button>
      <span className="consult-dialog__label">Triệu Minh · Tư vấn</span>
      <h2 id="consult-dialog-title">Tôi muốn tư vấn!</h2>
      <p className="consult-dialog__intro">Để lại thông tin và câu hỏi để chúng tôi hiểu điều bạn quan tâm.</p>
      <form className="consult-dialog__form" onSubmit={submit}>
        <label htmlFor="request-name">Họ và tên <span aria-hidden="true">*</span></label>
        <input id="request-name" name="name" value={form.name} required autoComplete="name" placeholder="Nhập họ và tên" onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <label htmlFor="request-phone">Số điện thoại <span aria-hidden="true">*</span></label>
        <input id="request-phone" name="phone" type="tel" inputMode="tel" value={form.phone} minLength={9} maxLength={20} required autoComplete="tel" placeholder="Nhập số điện thoại" onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <label htmlFor="request-topic">Nội dung tư vấn</label>
        <select id="request-topic" name="topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}><option value="Tôi bị viêm xoang">Tôi bị viêm xoang</option></select>
        <label htmlFor="request-message">Ghi chú <small>(không bắt buộc)</small></label>
        <textarea id="request-message" name="message" rows="3" value={form.message} placeholder="Chia sẻ thêm nếu bạn muốn..." onChange={(event) => setForm({ ...form, message: event.target.value })} />
        <button className="consult-dialog__submit" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Đang gửi...' : 'Gửi yêu cầu'} <ArrowUpRight size={17} /></button>
        {status === 'success' && <p className="consult-dialog__status" role="status">API đã nhận yêu cầu thử nghiệm. Dữ liệu chưa được lưu; vui lòng liên hệ hotline nếu cần tư vấn ngay.</p>}
        {status === 'error' && <p className="consult-dialog__status consult-dialog__status--error" role="alert">Không gửi được yêu cầu. Vui lòng thử lại hoặc liên hệ hotline.</p>}
      </form>
    </div>
  </dialog>;
}

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/products`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không tải được sản phẩm.');
      setProducts(data.products || []);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map((item) => item.category).filter(Boolean))];
  const visible = products.filter((item) => category === 'all' || item.category === category).sort((a, b) => {
    if (sort === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
    if (sort === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return <div className="product-page"><Header /><main className="product-main"><aside className="product-sidebar"><h2>Danh mục sản phẩm</h2><button className={category === 'all' ? 'is-selected' : ''} onClick={() => setCategory('all')}>Tất cả sản phẩm <span>{products.length}</span></button>{categories.map((item) => <button className={category === item ? 'is-selected' : ''} key={item} onClick={() => setCategory(item)}>{item} <span>{products.filter((product) => product.category === item).length}</span></button>)}<h2>Thương hiệu</h2><label><input type="checkbox" checked readOnly /> Triệu Minh</label><h2>Cam kết</h2><p>Thông tin sản phẩm minh bạch, tư vấn tận tâm và hỗ trợ sử dụng.</p></aside><section className="product-catalog"><div className="catalog-heading"><div><span>Sản phẩm Triệu Minh</span><h1>Chăm sóc sức khỏe từ dược liệu bản địa</h1></div><p>Khám phá các sản phẩm đang được cung cấp chính thức trên website.</p></div><div className="product-toolbar"><label>Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Mới nhất</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label><strong>{visible.length} sản phẩm</strong></div>{loading ? <div className="product-empty"><span>✦</span><h2>Đang tải sản phẩm...</h2></div> : error ? <div className="product-empty"><h2>Chưa tải được sản phẩm</h2><p>{error}</p></div> : visible.length ? <div className="product-grid">{visible.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="product-empty"><span>✦</span><h2>Chưa có sản phẩm trong danh mục này</h2><p>Sản phẩm mới sẽ được cập nhật tại đây.</p></div>}</section></main><Footer /><CartWidget /></div>;
}

function ProductCard({ product }) {
  const hasDiscount = Number(product.compare_at_price || 0) > Number(product.price || 0);
  return <a className="catalog-card" href={`/san-pham/${product.slug}`}><div className="catalog-card__image">{product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" /> : <span>TM</span>}{product.featured ? <b>Nổi bật</b> : null}{hasDiscount ? <em>-{Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)}%</em> : null}</div><div className="catalog-card__body"><small>{product.category || 'Triệu Minh'}</small><h2>{product.name}</h2><p>{product.description || 'Thông tin sản phẩm đang được cập nhật.'}</p><div className="catalog-card__price"><strong>{formatPrice(product.price)}</strong>{hasDiscount && <del>{formatPrice(product.compare_at_price)}</del>}</div><span className={product.stock > 0 ? 'in-stock' : 'out-stock'}>{product.stock > 0 ? `Còn hàng · ${product.stock} ${product.unit || ''}` : 'Tạm hết hàng'}</span></div></a>;
}

function ProductDetailPage({ slug }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không tìm thấy sản phẩm.'); setProduct(data.product); }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (buyNow = false) => {
    if (!product || product.stock < 1) return;
    const cart = JSON.parse(localStorage.getItem('tm_cart') || '[]');
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    else cart.push({ id: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.image_url, stock: product.stock, unit: product.unit, quantity });
    localStorage.setItem('tm_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('tm-cart-changed'));
    setNotice(buyNow ? 'Đã chuyển sản phẩm sang bước thanh toán.' : 'Đã thêm sản phẩm vào giỏ hàng.');
    if (buyNow) setTimeout(() => { window.location.href = '/thanh-toan'; }, 350);
  };

  if (loading) return <div className="product-page"><Header /><div className="detail-state">Đang tải sản phẩm...</div></div>;
  if (error || !product) return <div className="product-page"><Header /><div className="detail-state"><h1>Không tìm thấy sản phẩm</h1><p>{error}</p><a href="/san-pham">Quay lại danh mục</a></div></div>;
  const hasDiscount = Number(product.compare_at_price || 0) > Number(product.price || 0);
  const tabs = { description: ['Mô tả sản phẩm', product.description], ingredients: ['Thành phần', product.ingredients], usage: ['Hướng dẫn sử dụng', product.usage_instructions], benefits: ['Công dụng', product.benefits] };
  return <div className="product-page"><Header /><div className="product-detail-hero"><span>Triệu Minh · Sản phẩm</span><h1>{product.name}</h1><nav><a href="/">Trang chủ</a><i>/</i><a href="/san-pham">Sản phẩm</a><i>/</i><b>{product.name}</b></nav></div><main className="product-detail"><section className="product-gallery"><div className="product-gallery__thumb">{product.image_url ? <img src={product.image_url} alt="" /> : <span>TM</span>}</div><div className="product-gallery__main">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>Chưa có ảnh sản phẩm</span>}</div></section><section className="product-summary"><span className="product-summary__category">{product.category || 'Sản phẩm Triệu Minh'}</span><h2>{product.name}</h2><div className="product-summary__facts"><span><b>Tình trạng</b>{product.stock > 0 ? 'Còn hàng' : 'Tạm hết hàng'}</span><span><b>Mã sản phẩm</b>{product.sku || 'Đang cập nhật'}</span><span><b>Thương hiệu</b>Triệu Minh</span><span><b>Đơn vị</b>{product.unit || 'Sản phẩm'}</span></div><div className="product-summary__price"><strong>{formatPrice(product.price)}</strong>{hasDiscount && <><del>{formatPrice(product.compare_at_price)}</del><em>Tiết kiệm {formatPrice(Number(product.compare_at_price) - Number(product.price))}</em></>}</div><p>{product.description || 'Thông tin sản phẩm đang được cập nhật.'}</p><div className="quantity-control"><span>Số lượng</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><input aria-label="Số lượng" type="number" min="1" max={Math.max(1, product.stock)} value={quantity} onChange={(event) => setQuantity(Math.min(Math.max(1, Number(event.target.value)), Math.max(1, product.stock)))} /><button onClick={() => setQuantity(Math.min(Math.max(1, product.stock), quantity + 1))}>＋</button></div><small>Còn {product.stock} {product.unit || 'sản phẩm'}</small></div><div className="product-summary__actions"><button disabled={product.stock < 1} onClick={() => addToCart(false)}>Thêm vào giỏ hàng</button><button className="buy-now" disabled={product.stock < 1} onClick={() => addToCart(true)}>Mua ngay</button></div>{notice && <p className="purchase-notice" role="status">{notice}</p>}<div className="sales-policy"><strong>Chính sách bán hàng</strong><span>☎ Hỗ trợ tư vấn qua hotline <a href="tel:+84921685789">0921.685.789</a></span><span>✓ Kiểm tra thông tin trước khi xác nhận đơn hàng</span></div></section></main><section className="product-information"><nav>{Object.entries(tabs).map(([key, [label]]) => <button className={tab === key ? 'is-active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</nav><article><h2>{tabs[tab][0]}</h2>{tabs[tab][1] ? tabs[tab][1].split('\n').map((line, index) => <p key={index}>{line}</p>) : <p>Nội dung đang được cập nhật.</p>}<aside>Thông tin sản phẩm không thay thế tư vấn, chẩn đoán hoặc điều trị y khoa.</aside></article></section><Footer /><CartWidget /></div>;
}

function readCart() {
  try { const value = JSON.parse(localStorage.getItem('tm_cart') || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function storeCart(items) { localStorage.setItem('tm_cart', JSON.stringify(items)); window.dispatchEvent(new Event('tm-cart-changed')); }
function useCart() {
  const [items, setItems] = useState(readCart);
  useEffect(() => { const sync = () => setItems(readCart()); window.addEventListener('tm-cart-changed', sync); window.addEventListener('storage', sync); return () => { window.removeEventListener('tm-cart-changed', sync); window.removeEventListener('storage', sync); }; }, []);
  const update = (id, quantity) => { const next = items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(Number(item.stock || 999), quantity)) } : item); storeCart(next); setItems(next); };
  const remove = (id) => { const next = items.filter((item) => item.id !== id); storeCart(next); setItems(next); };
  const clear = () => { storeCart([]); setItems([]); };
  return { items, update, remove, clear, total: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0), count: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0) };
}

function CartWidget() {
  const [open, setOpen] = useState(false);
  const cart = useCart();
  useEffect(() => { if (!open) return; const close = (event) => { if (event.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [open]);
  return <><button className="cart-toggle" type="button" onClick={() => setOpen(true)} aria-label={`Mở giỏ hàng, ${cart.count} sản phẩm`}><span>Giỏ hàng</span>{cart.count > 0 && <b>{cart.count}</b>}</button>{open && <div className="cart-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><aside className="cart-drawer" aria-label="Giỏ hàng"><header><h2>Giỏ hàng</h2><button onClick={() => setOpen(false)} aria-label="Đóng giỏ hàng"><X size={23} /></button></header><div className="cart-drawer__items">{cart.items.length ? cart.items.map((item) => <CartRow item={item} update={cart.update} remove={cart.remove} key={item.id} />) : <div className="cart-empty"><ShoppingBag size={35} /><p>Giỏ hàng của bạn đang trống.</p><a href="/san-pham">Khám phá sản phẩm</a></div>}</div><footer><div className="cart-total"><span>Tổng tiền</span><strong>{formatPrice(cart.total)}</strong></div><p>Phí vận chuyển sẽ được xác nhận khi đặt hàng.</p><div><a href="/gio-hang">Xem giỏ hàng</a><a className={cart.items.length ? '' : 'is-disabled'} href={cart.items.length ? '/thanh-toan' : undefined}>Thanh toán</a></div></footer></aside></div>}</>;
}

function CartRow({ item, update, remove }) {
  return <article className="cart-row">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span className="cart-row__placeholder">TM</span>}<div><a href={`/san-pham/${item.slug}`}>{item.name}</a><small>{item.unit || 'Sản phẩm'}</small><div className="cart-row__controls"><button onClick={() => update(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => update(item.id, item.quantity + 1)}>＋</button><strong>{formatPrice(Number(item.price) * item.quantity)}</strong></div></div><button className="cart-row__remove" onClick={() => remove(item.id)} aria-label={`Xóa ${item.name}`}><Trash2 size={16} /></button></article>;
}

function CartPage() {
  const cart = useCart();
  return <div className="product-page"><Header /><main className="cart-page"><div className="cart-page__heading"><span>Đơn hàng của bạn</span><h1>Giỏ hàng</h1><a href="/san-pham">Tiếp tục mua sắm</a></div>{cart.items.length ? <div className="cart-page__layout"><section className="cart-page__list">{cart.items.map((item) => <CartRow item={item} update={cart.update} remove={cart.remove} key={item.id} />)}</section><aside className="order-summary"><h2>Tóm tắt đơn hàng</h2><div><span>Tạm tính</span><strong>{formatPrice(cart.total)}</strong></div><div><span>Vận chuyển</span><span>Xác nhận sau</span></div><div className="order-summary__total"><span>Tổng cộng</span><strong>{formatPrice(cart.total)}</strong></div><a href="/thanh-toan">Tiến hành thanh toán</a><button onClick={cart.clear}>Xóa toàn bộ giỏ hàng</button></aside></div> : <div className="cart-page__empty"><ShoppingBag size={42} /><h2>Chưa có sản phẩm trong giỏ</h2><p>Hãy chọn sản phẩm phù hợp với nhu cầu của bạn.</p><a href="/san-pham">Xem sản phẩm</a></div>}</main><Footer /><CartWidget /></div>;
}

function CheckoutPage() {
  const cart = useCart();
  const [form, setForm] = useState({ name: '', phone: '', provinceCode: '', districtCode: '', wardCode: '', currentWardCode: '', addressLine: '', note: '', couponCode: '', paymentMethod: 'cod' });
  const [addressMapping, setAddressMapping] = useState({ status: 'idle', data: null, error: '' });
  const [provinces, setProvinces] = useState([]); const [districts, setDistricts] = useState([]); const [wards, setWards] = useState([]); const [locationError, setLocationError] = useState('');
  const [quote, setQuote] = useState(null); const [config, setConfig] = useState({ paymentMethods: { cod: { enabled: true }, qr: { enabled: false } } }); const [status, setStatus] = useState('idle'); const [error, setError] = useState(''); const [order, setOrder] = useState(null);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const api = async (path, options = {}) => { const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = await response.json(); if (!response.ok) { const error = new Error(data.message || 'Yêu cầu thất bại.'); error.data = data; throw error; } return data; };
  useEffect(() => { api('/api/checkout/config').then(setConfig).catch(() => {}); api('/api/locations/provinces').then(setProvinces).catch(() => setLocationError('Không tải được địa giới. Bạn có thể thử lại sau.')); }, []);
  useEffect(() => { if (!form.provinceCode) { setDistricts([]); setWards([]); return; } setDistricts([]); setWards([]); setAddressMapping({ status:'idle', data:null, error:'' }); setForm((current) => ({ ...current, districtCode:'', wardCode:'', currentWardCode:'' })); api(`/api/locations/provinces/${form.provinceCode}/districts`).then(setDistricts).catch(() => setLocationError('Không tải được quận/huyện.')); }, [form.provinceCode]);
  useEffect(() => { if (!form.districtCode) { setWards([]); return; } setWards([]); setAddressMapping({ status:'idle', data:null, error:'' }); setForm((current) => ({ ...current, wardCode:'', currentWardCode:'' })); api(`/api/locations/districts/${form.districtCode}/wards`).then(setWards).catch(() => setLocationError('Không tải được xã/phường.')); }, [form.districtCode]);
  useEffect(() => {
    setAddressMapping({ status:'idle', data:null, error:'' });
    if (!form.provinceCode || !form.districtCode || !form.wardCode || form.addressLine.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setAddressMapping((current) => ({ ...current, status:'loading', error:'' }));
      fetch(`${API_URL}/api/locations/normalize`, { method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ provinceCode:form.provinceCode, districtCode:form.districtCode, wardCode:form.wardCode, addressLine:form.addressLine, currentWardCode:form.currentWardCode || undefined }) }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không chuẩn hóa được địa chỉ.'); return data; }).then((data) => setAddressMapping({ status:data.status, data, error:'' })).catch((err) => { if (err.name !== 'AbortError') setAddressMapping({ status:'error', data:null, error:err.message }); });
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form.provinceCode, form.districtCode, form.wardCode, form.addressLine, form.currentWardCode]);
  useEffect(() => { if (!cart.items.length) { setQuote(null); return; } api('/api/orders/quote', { method:'POST', body:JSON.stringify({ items:cart.items.map((item) => ({ productId:item.id, quantity:item.quantity })), couponCode:form.couponCode }) }).then(setQuote).catch((err) => setError(err.message)); }, [cart.items, form.couponCode]);
  const submit = async (event) => { event.preventDefault(); if (addressMapping.status !== 'resolved') { setError('Vui lòng chờ hệ thống xác nhận địa chỉ mới sau sáp nhập.'); return; } setStatus('loading'); setError(''); try { const data = await api('/api/orders', { method:'POST', headers:{'Idempotency-Key':crypto.randomUUID()}, body:JSON.stringify({ ...form, items:cart.items.map((item) => ({ productId:item.id, quantity:item.quantity })) }) }); setOrder(data); cart.clear(); setStatus('success'); } catch (err) { if (err.data?.code === 'AMBIGUOUS_LOCATION' && err.data.candidates) setAddressMapping({ status:'ambiguous', data:{ candidates:err.data.candidates }, error:'' }); setError(err.message); setStatus('error'); } };
  if (status === 'success') return <div className="product-page"><Header /><main className="checkout-page"><div className="checkout-success"><Check size={38} /><h2>Đặt hàng thành công</h2><p>Mã đơn hàng: <strong>{order?.order?.orderNumber}</strong></p><p>Địa chỉ mới: <strong>{order?.order?.normalizedAddress}</strong></p><p>{order?.payment?.status === 'pending' ? 'Vui lòng hoàn tất hoặc chờ xác nhận thanh toán.' : 'Nhân viên sẽ liên hệ để xác nhận đơn hàng.'}</p>{order?.payment?.qrImageUrl && <img className="checkout-qr" src={order.payment.qrImageUrl} alt="QR thanh toán" />}<a href="/san-pham">Tiếp tục xem sản phẩm</a></div></main><Footer /></div>;
  return <div className="product-page"><Header /><main className="checkout-page"><div className="checkout-page__heading"><span>Triệu Minh · Đặt hàng</span><h1>Thông tin nhận hàng</h1><p>Nhập đầy đủ thông tin để chúng tôi xác nhận đơn hàng.</p></div>{error && <p className="checkout-error">{error}</p>}{locationError && <p className="checkout-error">{locationError}</p>}{cart.items.length ? <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><fieldset><legend>Người nhận & địa chỉ trước sáp nhập</legend><label>Họ và tên *<input required value={form.name} onChange={(e) => update('name',e.target.value)} /></label><label>Số điện thoại *<input required type="tel" minLength="9" value={form.phone} onChange={(e) => update('phone',e.target.value)} /></label><div className="address-grid"><label>Tỉnh / thành phố *<select required value={form.provinceCode} onChange={(e) => update('provinceCode',e.target.value)}><option value="">Chọn tỉnh/thành phố</option>{provinces.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label><label>Quận / huyện *<select required disabled={!form.provinceCode} value={form.districtCode} onChange={(e) => update('districtCode',e.target.value)}><option value="">Chọn quận/huyện</option>{districts.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label><label>Xã / phường *<select required disabled={!form.districtCode} value={form.wardCode} onChange={(e) => update('wardCode',e.target.value)}><option value="">Chọn xã/phường</option>{wards.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label></div><label>Địa chỉ cụ thể *<input required value={form.addressLine} onChange={(e) => update('addressLine',e.target.value)} placeholder="Số nhà, tên đường, tòa nhà..." /></label><AddressNormalization mapping={addressMapping} selectedCode={form.currentWardCode} onSelect={(code) => update('currentWardCode', code)} /><label>Ghi chú<textarea rows="3" value={form.note} onChange={(e) => update('note',e.target.value)} placeholder="Ghi chú giao hàng (không bắt buộc)" /></label></fieldset><fieldset><legend>Phương thức thanh toán</legend><label className="payment-option"><input type="radio" checked={form.paymentMethod === 'cod'} onChange={() => update('paymentMethod','cod')} /> <span><strong>Thanh toán khi nhận hàng</strong><small>Thanh toán trực tiếp cho nhân viên giao hàng.</small></span></label><label className={`payment-option ${!config.paymentMethods?.qr?.enabled ? 'is-disabled' : ''}`}><input type="radio" disabled={!config.paymentMethods?.qr?.enabled} checked={form.paymentMethod === 'qr'} onChange={() => update('paymentMethod','qr')} /> <span><strong>Thanh toán QR</strong><small>{config.paymentMethods?.qr?.enabled ? 'Quét mã QR sau khi đặt hàng.' : 'Hiện chưa được cấu hình.'}</small></span></label></fieldset><button className="checkout-submit" disabled={status === 'loading' || addressMapping.status !== 'resolved'}>{status === 'loading' ? 'Đang tạo đơn...' : 'Đặt hàng'}</button></form><aside className="checkout-order checkout-order--sample"><h2>Đơn hàng</h2><div className="checkout-order__items">{cart.items.map((item) => <div className="checkout-order__item" key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt="" />}<span><b>{item.name}</b><small>{item.unit || 'Sản phẩm'}</small></span><strong>{formatPrice(Number(item.price)*item.quantity)}</strong><em>{item.quantity}</em></div>)}</div><div className="checkout-coupon"><input value={form.couponCode} onChange={(e) => update('couponCode',e.target.value.toUpperCase())} placeholder="Mã giảm giá" /><button type="button" onClick={() => setQuote(null)}>Sử dụng</button></div><div className="checkout-order__line"><span>Tạm tính</span><strong>{formatPrice(quote?.subtotal ?? cart.total)}</strong></div><div className="checkout-order__line"><span>Phí vận chuyển</span><strong>{quote ? (quote.shippingFee ? formatPrice(quote.shippingFee) : '—') : '—'}</strong></div><div className="checkout-order__line checkout-order__discount"><span>Giảm giá</span><strong>-{formatPrice(quote?.discountTotal || 0)}</strong></div><div className="checkout-order__total"><span><small>VND</small> Tổng cộng</span><strong>{formatPrice(quote?.total ?? cart.total)}</strong></div></aside></div> : <div className="cart-page__empty"><h2>Giỏ hàng đang trống</h2><a href="/san-pham">Chọn sản phẩm</a></div>}</main><Footer /><CartWidget /></div>;
}

function AddressNormalization({ mapping, selectedCode, onSelect }) {
  if (mapping.status === 'idle') return <div className="address-normalized address-normalized--idle"><span>Địa chỉ mới sau sáp nhập</span><p>Chọn đủ địa chỉ cũ và nhập địa chỉ cụ thể để hệ thống chuyển đổi.</p></div>;
  if (mapping.status === 'loading') return <div className="address-normalized is-loading"><span>Đang tra cứu địa chỉ mới...</span></div>;
  if (mapping.status === 'error') return <div className="address-normalized is-warning"><span>Chưa thể chuẩn hóa địa chỉ</span><p>{mapping.error}</p></div>;
  if (mapping.status === 'ambiguous') return <div className="address-normalized is-warning"><span>Cần xác nhận xã/phường mới</span><p>Địa chỉ cũ này có nhiều kết quả sau sáp nhập. Vui lòng chọn đúng địa chỉ:</p><div className="address-candidates">{mapping.data?.candidates?.map((candidate) => <label key={candidate.ward.code}><input type="radio" name="currentWard" checked={selectedCode === candidate.ward.code} onChange={() => onSelect(candidate.ward.code)} /><span>{candidate.ward.name}, {candidate.province.name}</span></label>)}</div></div>;
  return <div className="address-normalized is-resolved"><span>Địa chỉ mới nhất sau sáp nhập</span><strong>{mapping.data?.formattedAddress}</strong><small>Chuyển đổi từ: {mapping.data?.legacyFormattedAddress}</small></div>;
}

function FeaturedProducts({ products, loading, error }) {
  const [added, setAdded] = useState(null);
  const add = (event, product) => { event.preventDefault(); event.stopPropagation(); if (!product.stock) return; const cart = JSON.parse(localStorage.getItem('tm_cart') || '[]'); const current = cart.find((item) => item.id === product.id); if (current) current.quantity = Math.min(current.quantity + 1, product.stock); else cart.push({ id:product.id, slug:product.slug, name:product.name, price:product.price, imageUrl:product.image_url, stock:product.stock, unit:product.unit, quantity:1 }); localStorage.setItem('tm_cart', JSON.stringify(cart)); window.dispatchEvent(new Event('tm-cart-changed')); setAdded(product.id); setTimeout(() => setAdded(null), 1400); };
  return <section className="featured-products section" id="products"><div className="featured-products__heading"><SectionHeading kicker="Sản phẩm Triệu Minh" title={<>Bán chạy<br /><em>nhất.</em></>} body="Những sản phẩm được khách hàng quan tâm trong hành trình chăm sóc mũi xoang." /><a href="/san-pham" className="text-link">Xem tất cả sản phẩm <ArrowUpRight size={16} /></a></div>{loading ? <div className="featured-state">Đang tải sản phẩm...</div> : error ? <div className="featured-state">Chưa tải được sản phẩm.</div> : <div className="featured-grid">{products.map((product) => <article className="featured-card" key={product.id}><a href={`/san-pham/${product.slug}`} className="featured-card__image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>TM</span>}</a><div className="featured-card__body"><small>{product.category || 'Triệu Minh'}</small><h3>{product.name}</h3><div><strong>{formatPrice(product.price)}</strong>{product.compare_at_price && Number(product.compare_at_price)>Number(product.price)&&<del>{formatPrice(product.compare_at_price)}</del>}</div><span>Còn {product.stock} {product.unit || 'sản phẩm'}</span></div><div className="featured-card__actions"><a href={`/san-pham/${product.slug}`}>Xem sản phẩm</a><button type="button" onClick={(event) => add(event, product)}>{added === product.id ? 'Đã thêm' : 'Thêm vào giỏ'}</button></div></article>)}</div>}</section>;
}

function SupplyGallery() {
  const gallery = ['/supply-gallery-01.webp','/supply-gallery-02.jpg','/supply-gallery-03.webp','/supply-gallery-04.webp'];
  const productUrl = '/san-pham/xit-xoang-trieu-minh';
  const [start, setStart] = useState(0);
  const touchStart = useRef(0);
  const visible = [0,1,2].map((offset) => gallery[(start + offset) % gallery.length]);
  const next = () => setStart((value) => (value + 1) % gallery.length);
  return <section className="supply-gallery section"><SectionHeading kicker="Triệu Minh" title={<>Chúng tôi cung cấp</>} body="Các sản phẩm hiệu quả, chất lượng cao" /><div className="supply-carousel"><button className="supply-carousel__nav supply-carousel__prev" onClick={() => setStart((value) => (value - 1 + gallery.length) % gallery.length)} aria-label="Ảnh trước">‹</button><div className="supply-gallery__track" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current - event.changedTouches[0].clientX > 35) next(); if (event.changedTouches[0].clientX - touchStart.current > 35) setStart((value) => (value - 1 + gallery.length) % gallery.length); }}>{visible.map((src, index) => <article className="supply-gallery__card" key={`${src}-${start}-${index}`}><a href={productUrl}><img src={src} alt={`Dược liệu và sản phẩm Triệu Minh ${index + 1}`} /></a><a className="supply-gallery__more" href={productUrl}>Xem thêm <ArrowUpRight size={14} /></a></article>)}</div><button className="supply-carousel__nav supply-carousel__next" onClick={next} aria-label="Ảnh tiếp theo">›</button></div></section>;
}

function formatPrice(value) { return value == null || value === '' ? 'Liên hệ' : `${Number(value).toLocaleString('vi-VN')}đ`; }

export default function App() {
  const path = window.location.pathname;
  if (path === '/gio-hang' || path === '/gio-hang/') return <CartPage />;
  if (path === '/thanh-toan' || path === '/thanh-toan/') return <CheckoutPage />;
  const productMatch = path.match(/^\/san-pham\/([^/]+)\/?$/);
  if (productMatch) return <ProductDetailPage slug={decodeURIComponent(productMatch[1])} />;
  if (window.location.pathname === '/san-pham' || window.location.pathname === '/san-pham/') return <ProductPage />;
  const [consultOpen, setConsultOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]); const [featuredLoading, setFeaturedLoading] = useState(true); const [featuredError, setFeaturedError] = useState('');
  useEffect(() => { fetch(`${API_URL}/api/products`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không tải được sản phẩm.'); setFeaturedProducts((data.products || []).filter((item) => item.active !== false && Number(item.stock) > 0).slice(0, 4)); }).catch((error) => setFeaturedError(error.message)).finally(() => setFeaturedLoading(false)); }, []);
  const settings = useSiteSettings();
  return <><Header /><main><Hero onConsult={() => setConsultOpen(true)} /><FeaturedProducts products={featuredProducts} loading={featuredLoading} error={featuredError} /><SupplyGallery /><About /><PressFeatures /><Expertise /><News /><Consultation /></main><Footer settings={settings} /><button className="floating-appointment" type="button" aria-haspopup="dialog" onClick={() => setConsultOpen(true)}>Tôi muốn tư vấn! <ArrowUpRight size={17} /></button><a className="floating-buy" href="/san-pham">Mua ngay <ArrowUpRight size={17} /></a><FloatingContactBar settings={settings} /><ChatWidget /><ConsultationDialog open={consultOpen} onClose={() => setConsultOpen(false)} /></>;
}
