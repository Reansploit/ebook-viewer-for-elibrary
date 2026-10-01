import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

// Sesi akun pembaca. Token di sessionStorage (tutup browser = keluar,
// refresh dalam tab yang sama = tetap masuk), profil di memori + cache.
// Tanpa token = tamu (boleh lihat katalog, tidak menyimpan apa-apa).
// Diam 2 jam tanpa aktivitas = keluar otomatis.
const IDLE_MS = 2 * 60 * 60 * 1000;
// Peringatan 5 menit sebelumnya ("masih di sana?").
const IDLE_WARN_MS = 5 * 60 * 1000;

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [token, setToken] = useState(() => {
        try {
            return sessionStorage.getItem('reader_token') || null;
        } catch {
            return null;
        }
    });
    const [member, setMember] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem('reader_member') || 'null');
        } catch {
            return null;
        }
    });

    const logout = useCallback(() => {
        if (token) api.logout(token).catch(() => {});
        setToken(null);
        setMember(null);
        try {
            sessionStorage.removeItem('reader_token');
            sessionStorage.removeItem('reader_member');
        } catch {
            // abaikan
        }
    }, [token]);

    const login = useCallback(async (rfid, signal) => {
        const data = await api.readerLogin(rfid, signal);
        setToken(data.token);
        setMember(data.member);
        try {
            sessionStorage.setItem('reader_token', data.token);
            sessionStorage.setItem('reader_member', JSON.stringify(data.member));
        } catch {
            // abaikan: sesi tetap jalan
        }
        return data.member;
    }, []);

    // Token basi (akun dinonaktifkan) = keluar diam-diam.
    useEffect(() => {
        if (!token || member) return;
        logout();
    }, [token, member, logout]);

    // Diam 2 jam (tanpa sentuh, ketik, atau gulir) = keluar otomatis.
    // 5 menit sebelumnya muncul peringatan; aktivitas apa pun
    // membatalkannya dan mengulang hitungan dari awal.
    // idleDeadline = 0 berarti tidak ada peringatan aktif.
    const [idleDeadline, setIdleDeadline] = useState(0);
    const stayRef = useRef(() => {});

    useEffect(() => {
        if (!token) {
            setIdleDeadline(0);
            return undefined;
        }
        let warnTimer = 0;
        let outTimer = 0;
        const arm = () => {
            clearTimeout(warnTimer);
            clearTimeout(outTimer);
            setIdleDeadline(0);
            const now = Date.now();
            warnTimer = setTimeout(() => setIdleDeadline(now + IDLE_MS), IDLE_MS - IDLE_WARN_MS);
            outTimer = setTimeout(logout, IDLE_MS);
        };
        stayRef.current = arm;
        const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((ev) => window.addEventListener(ev, arm, { passive: true }));
        arm();
        return () => {
            clearTimeout(warnTimer);
            clearTimeout(outTimer);
            events.forEach((ev) => window.removeEventListener(ev, arm));
        };
    }, [token, logout]);

    const stay = useCallback(() => stayRef.current(), []);

    return (
        <SessionContext.Provider value={{ token, member, login, logout, authed: !!token && !!member, idleDeadline, stay }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}
