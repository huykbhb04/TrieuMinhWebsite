const legacyBase = (process.env.LOCATION_API_BASE_URL || 'https://provinces.open-api.vn/api').replace(/\/$/, '');
const currentBase = (process.env.LOCATION_API_V2_BASE_URL || 'https://provinces.open-api.vn/api/v2').replace(/\/$/, '');

function locationError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}

async function fetchJson(base, path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`${base}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw locationError('Dịch vụ địa giới tạm thời không khả dụng.', 503, 'LOCATION_PROVIDER_UNAVAILABLE');
    return await response.json();
  } catch (error) {
    if (error.status) throw error;
    throw locationError('Dịch vụ địa giới tạm thời không khả dụng.', 503, 'LOCATION_PROVIDER_UNAVAILABLE');
  } finally { clearTimeout(timeout); }
}

export const listLegacyProvinces = () => fetchJson(legacyBase, '/p/');
export async function listLegacyDistricts(provinceCode) { const data = await fetchJson(legacyBase, `/p/${encodeURIComponent(provinceCode)}?depth=2`); return data.districts || []; }
export async function listLegacyWards(districtCode) { const data = await fetchJson(legacyBase, `/d/${encodeURIComponent(districtCode)}?depth=2`); return data.wards || []; }

export async function resolveLegacyLocation({ provinceCode, districtCode, wardCode }) {
  if (!provinceCode || !districtCode || !wardCode) throw locationError('Vui lòng chọn đầy đủ địa chỉ trước sáp nhập.', 422, 'INVALID_ADDRESS_INPUT');
  const province = await fetchJson(legacyBase, `/p/${encodeURIComponent(provinceCode)}?depth=2`);
  const district = province.districts?.find((item) => String(item.code) === String(districtCode));
  if (!district) throw locationError('Quận/huyện không thuộc tỉnh đã chọn.', 422, 'INVALID_LEGACY_LOCATION');
  const districtDetail = await fetchJson(legacyBase, `/d/${encodeURIComponent(districtCode)}?depth=2`);
  const ward = districtDetail.wards?.find((item) => String(item.code) === String(wardCode));
  if (!ward) throw locationError('Xã/phường không thuộc quận/huyện đã chọn.', 422, 'INVALID_LEGACY_LOCATION');
  return {
    province: { code: String(province.code), name: province.name },
    district: { code: String(district.code), name: district.name },
    ward: { code: String(ward.code), name: ward.name },
  };
}

export async function normalizeDeliveryAddress({ provinceCode, districtCode, wardCode, addressLine, currentWardCode }) {
  const line = String(addressLine || '').trim();
  if (line.length < 3 || line.length > 300) throw locationError('Địa chỉ cụ thể phải có từ 3 đến 300 ký tự.', 422, 'INVALID_ADDRESS_INPUT');
  const legacy = await resolveLegacyLocation({ provinceCode, districtCode, wardCode });
  const rawMappings = await fetchJson(currentBase, `/w/from-legacy/?legacy_code=${encodeURIComponent(legacy.ward.code)}`);
  if (!Array.isArray(rawMappings)) throw locationError('Dữ liệu chuyển đổi địa giới không hợp lệ.', 502, 'LOCATION_PROVIDER_INVALID_RESPONSE');
  const deduped = new Map();
  for (const mapping of rawMappings) {
    if (String(mapping?.source_code) !== legacy.ward.code || !mapping?.ward?.code || !mapping?.ward?.province_code) continue;
    deduped.set(String(mapping.ward.code), mapping.ward);
  }
  if (!deduped.size) throw locationError('Chưa tìm thấy địa chỉ mới tương ứng với xã/phường cũ.', 422, 'LEGACY_WARD_UNMAPPED');
  const provinceCache = new Map();
  const candidates = [];
  for (const ward of deduped.values()) {
    const provinceCodeNew = String(ward.province_code);
    if (!provinceCache.has(provinceCodeNew)) provinceCache.set(provinceCodeNew, await fetchJson(currentBase, `/p/${encodeURIComponent(provinceCodeNew)}`));
    const province = provinceCache.get(provinceCodeNew);
    candidates.push({ ward: { code: String(ward.code), name: ward.name }, province: { code: String(province.code), name: province.name } });
  }
  const legacyFormattedAddress = [line, legacy.ward.name, legacy.district.name, legacy.province.name].join(', ');
  if (!currentWardCode && candidates.length > 1) return { status: 'ambiguous', legacy, legacyFormattedAddress, candidates, provider: 'provinces.open-api.vn/v2', normalizedAt: new Date().toISOString() };
  const selected = currentWardCode ? candidates.find((item) => item.ward.code === String(currentWardCode)) : candidates[0];
  if (!selected) throw locationError('Địa chỉ mới đã thay đổi. Vui lòng chọn lại.', 409, 'LOCATION_MAPPING_CHANGED');
  return {
    status: 'resolved', legacy, current: selected,
    legacyFormattedAddress,
    formattedAddress: [line, selected.ward.name, selected.province.name].join(', '),
    candidates, provider: 'provinces.open-api.vn/v2', normalizedAt: new Date().toISOString(),
  };
}
