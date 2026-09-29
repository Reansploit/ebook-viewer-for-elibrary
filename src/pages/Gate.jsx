import { useEffect, useState } from 'react';
import CyberBtn from '../components/CyberBtn.jsx';
import HoloRfid from '../components/HoloRfid.jsx';
import { useSession } from '../session.jsx';

// Layar penuh kios: F11 browser atau Fullscreen API sama-sama dihitung.
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

// Gerbang portal: tempel kartu RFID lalu Enter (scanner mengetik + Enter,
// halaman tidak pindah). Cocok = tampilkan profil + tombol Masuk.
export default function Gate({ onEnter }) {
    const { member, login, logout } = useSession();
    const [rfid, setRfid] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
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
                setError('Jaringan lambat. Periksa koneksi lalu tempel ulang kartunya.');
            } else {
                setError('Kartu tidak dikenal. Tempelkan kartu santri yang terdaftar.');
            }
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
        <div className="reader gate-dark gate-cyber">
            <div className="gate-brand">
                <img src="/images/logo-wbs.png" alt="" className="site-logo" />
                <span className="gate-brand-name">elibrary</span>
            </div>
            {fsAsk && !fs && !member && (
                <div className="fs-dialog" role="alertdialog" aria-label="Layar penuh">
                    <div className="fs-modal">
                        <span className="fs-backdrop" aria-hidden="true">
                            <span className="fs-corner" aria-hidden="true" />
                        </span>
                        <span className="fs-version" aria-hidden="true">
                            v001
                        </span>
                        <h2 className="fs-title">
                            <span>please press f11 before enter</span>
                        </h2>
                        <div className="fs-text">
                            <p>Kios butuh layar penuh. Otomatis dalam 5 detik, atau proceed sekarang.</p>
                            {fsFailed && <p>otomatis ditolak browser: tekan F11 manual.</p>}
                        </div>
                        <div className="fs-glitch" aria-hidden="true">
                            <h2>
                                <span>please press f11 before enter</span>
                            </h2>
                            <div className="fs-text">
                                <p>Kios butuh layar penuh. Otomatis dalam 5 detik, atau proceed sekarang.</p>
                            </div>
                        </div>
                        <div className="fs-actions">
                            <CyberBtn kbd="⛶" label="proceed" action="Proceed" onClick={goFull} />
                            <CyberBtn kbd="✕" label="cancel" action="Cancel" onClick={() => setFsAsk(false)} />
                        </div>
                    </div>
                </div>
            )}
            <main className="portal">
                {!member ? (
                    <>
                        <form className="gate-form" onSubmit={submit}>
                            <HoloRfid value={rfid} onChange={setRfid} disabled={busy} />
                            <div className="gate-next">
                                <CyberBtn type="submit" kbd="⏎" label="Next" action="Next" />
                            </div>
                        </form>
                        {busy && <div className="fx-spotlight">mencari...</div>}
                        {error && (
                            <div className="reader-state">
                                <p>{error}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="profile-card">
                            {member.photo ? (
                                <img src={member.photo} alt={member.name} className="profile-photo" />
                            ) : (
                                <div className="profile-photo profile-photo-empty" aria-hidden="true">
                                    {(member.name || '?').trim().charAt(0).toUpperCase()}
                                </div>
                            )}
                            <p className="profile-name">{member.name}</p>
                            <p className="profile-meta">Kelas {member.class}</p>
                        </div>
                        <div className="gate-actions">
                            <CyberBtn kbd="⏎" label="Next" action="Masuk" onClick={onEnter} />
                            <CyberBtn kbd="✕" label="Bukan kamu" action="Batal" onClick={cancel} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
