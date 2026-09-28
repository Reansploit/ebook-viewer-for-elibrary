import { useEffect, useState } from 'react';
import { readerApi } from '../api.js';
import ViewerHeader from '../components/ViewerHeader.jsx';
import { useSession } from '../session.jsx';

// Profil akun: data diri dari kartu + hitungan milik akun + Keluar.
// Catatan milik akun tampil di sini (tambahnya dari halaman baca).
export default function Profile() {
    const { member, token, logout } = useSession();
    const [stats, setStats] = useState({ baca: 0, selesai: 0, notes: 0 });
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        if (!token) return;
        readerApi(token, 'GET', '/api/v1/reader/progress')
            .then((d) => {
                const rows = d.progress || [];
                setStats((s) => ({
                    ...s,
                    baca: rows.filter((p) => p.status === 'baca').length,
                    selesai: rows.filter((p) => p.status === 'selesai').length,
                }));
            })
            .catch(() => {});
        readerApi(token, 'GET', '/api/v1/reader/notes')
            .then((d) => {
                setNotes(d.notes || []);
                setStats((s) => ({ ...s, notes: (d.notes || []).length }));
            })
            .catch(() => {});
    }, [token]);

    const dropNote = (id) => {
        readerApi(token, 'DELETE', `/api/v1/reader/notes/${id}`)
            .then(() => {
                setNotes((ns) => ns.filter((n) => n.id !== id));
                setStats((s) => ({ ...s, notes: s.notes - 1 }));
            })
            .catch(() => {});
    };

    if (!member) return null;

    return (
        <div className="reader">
            <ViewerHeader library={member.name} backTo="/" backLabel="Menu" right="Profil" />
            <main className="page">
                <div className="profile-card">
                    {member.photo ? (
                        <img src={member.photo} alt={member.name} className="profile-photo" />
                    ) : (
                        <div className="profile-photo profile-photo-empty" aria-hidden="true">
                            {(member.name || '?').trim().charAt(0).toUpperCase()}
                        </div>
                    )}
                    <p className="profile-name">{member.name}</p>
                    <p className="profile-meta">
                        Kelas {member.class} • {member.gender}
                    </p>
                </div>

                <div className="stat-row">
                    <div className="stat-box">
                        <span className="stat-num">{stats.baca}</span>
                        <span className="stat-label">Sedang dibaca</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-num">{stats.selesai}</span>
                        <span className="stat-label">Selesai</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-num">{stats.notes}</span>
                        <span className="stat-label">Catatan</span>
                    </div>
                </div>

                {notes.length > 0 && (
                    <section className="section">
                        <h2 className="section-title">Catatanku</h2>
                        <div className="note-list">
                            {notes.map((n) => (
                                <div key={n.id} className="note-card">
                                    <p className="note-book">{n.book?.title || n.id_buku}</p>
                                    {n.page && <p className="book-meta">Halaman {n.page}</p>}
                                    <p className="note-text">{n.catatan}</p>
                                    <button type="button" className="note-drop" onClick={() => dropNote(n.id)}>
                                        Hapus
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <button type="button" className="btn-outline" onClick={logout}>
                    Keluar
                </button>
            </main>
        </div>
    );
}
