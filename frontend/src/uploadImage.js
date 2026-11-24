const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Chỉ dùng trong công cụ quản trị được bảo vệ; không hardcode token vào frontend công khai. */
export async function uploadImage(file, token) {
  const body = new FormData();
  body.append('image', file);
  const response = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { 'x-upload-token': token }, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể tải ảnh lên.');
  return data; // { url, publicId }
}
