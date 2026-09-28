import { useCallback, useEffect, useState } from 'react';
import { readerApi } from './api.js';
import { useSession } from './session.jsx';

// Suara + simpanan milik akun. Tamu dapat peta kosong (rating tetap tampil).
export function useReaderMarks() {
    const { token } = useSession();
    const [votes, setVotes] = useState({});
    const [saves, setSaves] = useState({});

    useEffect(() => {
        if (!token) {
            setVotes({});
            setSaves({});
            return;
        }
        readerApi(token, 'GET', '/api/v1/reader/votes')
            .then((d) => setVotes(d.votes || {}))
            .catch(() => {});
        readerApi(token, 'GET', '/api/v1/reader/saves')
            .then((d) => {
                const map = {};
                for (const b of d.saves || []) map[b.id] = true;
                setSaves(map);
            })
            .catch(() => {});
    }, [token]);

    // Kirim suara, counts mengikuti jawaban server (bukan tebakan lokal).
    const sendVote = useCallback(
        async (bookId, vote, applyCounts) => {
            if (!token) return;
            const r = await readerApi(token, 'POST', '/api/v1/reader/vote', {
                id_buku: bookId,
                vote,
            }).catch(() => null);
            if (!r) return;
            setVotes((v) => {
                const next = { ...v };
                if (vote === 0) delete next[bookId];
                else next[bookId] = vote;
                return next;
            });
            applyCounts?.(bookId, r.likes, r.dislikes);
        },
        [token],
    );

    const toggleSave = useCallback(
        async (book) => {
            if (!token) return;
            if (saves[book.id]) {
                await readerApi(token, 'DELETE', `/api/v1/reader/saves/${book.id}`).catch(() => null);
                setSaves((s) => {
                    const next = { ...s };
                    delete next[book.id];
                    return next;
                });
            } else {
                const r = await readerApi(token, 'POST', '/api/v1/reader/saves', {
                    id_buku: book.id,
                }).catch(() => null);
                if (r) setSaves((s) => ({ ...s, [book.id]: true }));
            }
        },
        [token, saves],
    );

    return { votes, saves, sendVote, toggleSave, authed: !!token };
}
