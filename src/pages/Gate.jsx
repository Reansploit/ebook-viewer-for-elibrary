import { useState } from 'react';
import HoloRfid from '../components/HoloRfid.jsx';
import { useSession } from '../session.jsx';

// Gerbang portal: tempel kartu RFID lalu Enter (scanner mengetik + Enter,
// halaman tidak pindah). Cocok = tampilkan profil + tombol Masuk.
export default function Gate({ onEnter }) {
    const { member, login, logout } = useSession();
    const [rfid, setRfid] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        const uid = rfid.trim();
        if (!uid || busy) return;
        setBusy(true);
        setError('');
        try {
            await login(uid);
        } catch {
            setError('Kartu tidak dikenal. Tempelkan kartu santri yang terdaftar.');
        } finally {
            setBusy(false);
        }
    };

    const cancel = () => {
        logout();
        setRfid('');
        setError('');
    };

    return (
        <div className="reader gate-dark">
            <main className="portal">
                <h1 className="portal-title">Perpustakaan WBS</h1>
                {!member ? (
                    <>
                        <p className="portal-sub">Tempelkan kartu lalu tekan Enter.</p>
                        <form className="gate-form" onSubmit={submit}>
                            <HoloRfid value={rfid} onChange={setRfid} disabled={busy} />
                        </form>
                        {busy && <p className="reader-state">Mengenali kartu...</p>}
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
                            <button type="button" className="btn-solid" onClick={onEnter}>
                                Masuk
                            </button>
                            <button type="button" className="btn-outline" onClick={cancel}>
                                Bukan kamu
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
