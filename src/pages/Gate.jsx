import { useState } from 'react';
import CyberBtn from '../components/CyberBtn.jsx';
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
        <div className="reader gate-dark gate-cyber">
            <div className="gate-brand">
                <img src="/images/logo-wbs.png" alt="" className="site-logo" />
                <span className="gate-brand-name">elibrary</span>
            </div>
            <main className="portal">
                {!member ? (
                    <>
                        <form className="gate-form" onSubmit={submit}>
                            <HoloRfid value={rfid} onChange={setRfid} disabled={busy} />
                            <div className="gate-next">
                                <CyberBtn type="submit" kbd="⏎" label="Next" action="Next" />
                            </div>
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
                            <CyberBtn kbd="→" label="Next" action="Masuk" onClick={onEnter} />
                            <CyberBtn kbd="✕" label="Bukan kamu" action="Batal" onClick={cancel} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
