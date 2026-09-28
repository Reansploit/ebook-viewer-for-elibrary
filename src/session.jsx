import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

// Sesi akun pembaca. Token di localStorage, profil di memori + cache.
// Tanpa token = tamu (boleh lihat katalog, tidak menyimpan apa-apa).
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [token, setToken] = useState(() => {
        try {
            return localStorage.getItem('reader_token') || null;
        } catch {
            return null;
        }
    });
    const [member, setMember] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('reader_member') || 'null');
        } catch {
            return null;
        }
    });

    const logout = useCallback(() => {
        if (token) api.logout(token).catch(() => {});
        setToken(null);
        setMember(null);
        try {
            localStorage.removeItem('reader_token');
            localStorage.removeItem('reader_member');
        } catch {
            // abaikan
        }
    }, [token]);

    const login = useCallback(async (rfid) => {
        const data = await api.readerLogin(rfid);
        setToken(data.token);
        setMember(data.member);
        try {
            localStorage.setItem('reader_token', data.token);
            localStorage.setItem('reader_member', JSON.stringify(data.member));
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

    return (
        <SessionContext.Provider value={{ token, member, login, logout, authed: !!token && !!member }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}
