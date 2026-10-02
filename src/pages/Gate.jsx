import { useEffect, useState } from 'react';
import { useSession } from '../session.jsx';

// Layar penuh: F11 browser atau Fullscreen API sama-sama dihitung.
// API hanya boleh dari gestur pengguna; otomatis 5 detik bisa ditolak
// browser (tampilkan suruhan F11 manual bila begitu).
function useKioskFullscreen() {
    const [fs, setFs] = useState(false);

    useEffect(() => {
        const check = () => {
            const f11 = window.innerHeight >= window.screen.height - 4 && window.innerWidth >= window.screen.width - 4;
            setFs(!!document.fullscreenElement || f11);
        };
        check();
        document.addEventListener('fullscreenchange', check);
        window.addEventListener('resize', check);
        return () => {
            document.removeEventListener('fullscreenchange', check);
            window.removeEventListener('resize', check);
        };
    }, []);

    return fs;
}

// Jam besar ala login macOS.
function useLoginClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
    };
}

// Gerbang ala login macOS: jam besar, avatar, pil RFID + Enter
// (scanner mengetik + Enter, halaman tidak pindah). Kartu salah =
// avatar bergoyang seperti password salah. Cocok = tombol Masuk.
export default function Gate({ onEnter }) {
    const { member, login, logout } = useSession();
    const [rfid, setRfid] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [errKey, setErrKey] = useState(0);
    const { time, date } = useLoginClock();
    const fs = useKioskFullscreen();
    // Dialog fullscreen: tampil bila belum penuh. Hitung 5 detik,
    // habis = coba penuh sendiri. Batal = diam sampai refresh.
    const [fsAsk, setFsAsk] = useState(false);
    const [fsFailed, setFsFailed] = useState(false);

    useEffect(() => {
        if (fs || member) return;
        setFsAsk(true);
        setFsFailed(false);
        const timer = setTimeout(() => {
            document.documentElement.requestFullscreen?.().catch(() => setFsFailed(true));
            setFsAsk(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, [fs, member]);

    const goFull = () => {
        document.documentElement.requestFullscreen?.().catch(() => setFsFailed(true));
        setFsAsk(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        const uid = rfid.trim();
        if (!uid || busy) return;
        setBusy(true);
        setError('');
        // Batas 10 detik: cukup untuk scanner + jaringan pondok.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const started = Date.now();
        try {
            await login(uid, controller.signal);
        } catch (err) {
            // Kartu salah pun menunggu 10 detik "mencari" dulu sebelum vonis.
            const sisa = 10000 - (Date.now() - started);
            if (sisa > 0) await new Promise((r) => setTimeout(r, sisa));
            if (err.name === 'AbortError') {
                setError('Slow network. Check the connection, then tap your card again.');
            } else if (err.offline) {
                setError('No connection to the server. Check the network, then tap again.');
            } else {
                setError('Unknown card. Use a registered student card.');
            }
            setErrKey((k) => k + 1);
        } finally {
            clearTimeout(timer);
            setBusy(false);
        }
    };

    const cancel = () => {
        logout();
        setRfid('');
        setError('');
    };

    return (
        <div className="mac-login">
            <div className="mac-login-bg" aria-hidden="true" />
            <header className="mac-login-clock">
                <span className="mac-login-time">{time}</span>
                <span className="mac-login-date">{date}</span>
            </header>
            {fsAsk && !fs && !member && (
                <div className="mac-login-fs" role="alertdialog" aria-label="Full screen">
                    <p className="mac-login-fs-title">Full screen</p>
                    <p className="mac-login-fs-text">
                        Press F11 or the button below for full screen.
                        {fsFailed && ' The automatic request was denied by the browser.'}
                    </p>
                    <div className="mac-login-row">
                        <button type="button" className="login-pill" onClick={goFull}>
                            Full screen
                        </button>
                        <button type="button" className="login-ghost" onClick={() => setFsAsk(false)}>
                            Later
                        </button>
                    </div>
                </div>
            )}
            <main className="mac-login-main">
                {!member ? (
                    <div key={errKey} className={error ? 'mac-login-idle login-shake' : 'mac-login-idle'}>
                        <div className="mac-login-avatar" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5v1H4v-1Z" />
                            </svg>
                        </div>
                        <p className="mac-login-name">Library</p>
                        <form className="mac-login-form" onSubmit={submit}>
                            <input
                                type="password"
                                className="mac-login-input"
                                value={rfid}
                                onChange={(e) => setRfid(e.target.value)}
                                disabled={busy}
                                autoFocus
                                autoComplete="off"
                                placeholder="Tap your card"
                                aria-label="Tap your card, then press Enter"
                            />
                            <p className="mac-login-hint">
                                {busy ? 'Searching...' : 'Tap your card, then press Enter'}
                            </p>
                        </form>
                        {error && (
                            <p className="mac-login-error" role="alert">
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="mac-login-avatar">
                            {member.photo ? (
                                <img src={member.photo} alt="" />
                            ) : (
                                <span aria-hidden="true">
                                    {(member.name || '?').trim().charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <p className="mac-login-name">{member.name}</p>
                        <p className="mac-login-sub">Class {member.class}</p>
                        <div className="mac-login-row">
                            <button type="button" className="login-pill" onClick={onEnter} autoFocus>
                                Log In
                            </button>
                            <button type="button" className="login-ghost" onClick={cancel}>
                                Not you?
                            </button>
                        </div>
                    </>
                )}
            </main>
            <footer className="mac-login-foot">
                {!fs && (
                    <button type="button" className="login-ghost" onClick={goFull}>
                        Full screen
                    </button>
                )}
                <span className="watermark">© 2026 Studio-Alpaca</span>
            </footer>
        </div>
    );
}
