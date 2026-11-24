import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const LoadingContext = createContext(null);
export function LoadingProvider({ children }) { const [count, setCount] = useState(0); const api = useMemo(() => ({ start: () => setCount((value) => value + 1), stop: () => setCount((value) => Math.max(0, value - 1)) }), []); return <LoadingContext.Provider value={api}>{children}<GlobalLoading visible={count > 0} /></LoadingContext.Provider>; }
export function useGlobalLoading() { return useContext(LoadingContext); }
function GlobalLoading({ visible }) { useEffect(() => { document.documentElement.setAttribute('aria-busy', visible ? 'true' : 'false'); return () => document.documentElement.removeAttribute('aria-busy'); }, [visible]); if (!visible) return null; return <div className="global-loading" role="status" aria-live="polite"><img src="/logo-trieu-minh.webp" alt="" /><span>Đang tải...</span></div>; }
