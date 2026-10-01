import { useEffect, useRef, useState } from 'react';
import { readerApi } from '../api.js';
import { useSession } from '../session.jsx';

// Jendela aplikasi ala macOS: diseret lewat titlebar, lampu lalu lintas
// berfungsi (merah tutup, kuning mode ringkas, hijau buka penuh ke halaman).
// Mode ringkas bukan sembunyi: satu baris status + tombol tetap jalan.
export function MacWindow({ title, order, minimized, onFocus, onClose, onToggleMin, onZoom, mini, children }) {
    const winRef = useRef(null);
    const [winPos, setWinPos] = useState(null);
    const [winW, setWinW] = useState(null);
    // Ukuran manual dari gagang tepi (null = otomatis).
    const [size, setSize] = useState(null);

    const clampSize = (w, h) => ({
        w: Math.min(window.innerWidth - 32, Math.max(240, w)),
        h: Math.min(window.innerHeight - 32, Math.max(160, h)),
    });

    // Ubah ukuran dari sisi/sudut mana saja. Sisi kiri/atas ikut
    // menggeser posisi agar sisi lawannya diam (seperti OS beneran).
    const startResize = (e, dir) => {
        e.preventDefault();
        e.stopPropagation();
        onFocus?.();
        const rect = winRef.current?.getBoundingClientRect();
        if (!rect) return;
        const west = dir.includes('w');
        const north = dir.includes('n');
        let orig = winPos;
        if ((west || north) && !orig) {
            orig = {
                x: rect.left + rect.width / 2 - window.innerWidth / 2,
                y: rect.top - window.innerHeight * 0.3,
            };
            setWinPos(orig);
            setWinW(rect.width);
        }
        const startW = rect.width;
        const startH = rect.height;
        const startX = e.clientX;
        const startY = e.clientY;
        const move = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            const rawW = west ? startW - dx : startW + dx;
            const rawH = north ? startH - dy : startH + dy;
            const next = clampSize(rawW, rawH);
            setSize({
                w: dir === 'n' || dir === 's' ? startW : next.w,
                h: dir === 'e' || dir === 'w' ? startH : next.h,
            });
            if (orig && (west || north)) {
                setWinPos({
                    x: west ? orig.x + (startW - next.w) / 2 : orig.x,
                    y: north ? orig.y + (startH - next.h) : orig.y,
                });
            }
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const keyResize = (e, dir) => {
        const rect = winRef.current?.getBoundingClientRect();
        if (!rect) return;
        const step = e.shiftKey ? 48 : 16;
        let w = rect.width;
        let h = rect.height;
        if (e.key === 'ArrowRight' && dir !== 'n' && dir !== 's') w += step;
        else if (e.key === 'ArrowLeft' && dir !== 'n' && dir !== 's') w -= step;
        else if (e.key === 'ArrowDown' && dir !== 'e' && dir !== 'w') h += step;
        else if (e.key === 'ArrowUp' && dir !== 'e' && dir !== 'w') h -= step;
        else return;
        e.preventDefault();
        const next = clampSize(w, h);
        setSize({ w: dir === 's' ? rect.width : next.w, h: dir === 'e' ? rect.height : next.h });
    };

    const dragStart = (e) => {
        onFocus?.();
        if (e.button !== undefined && e.button !== 0) return;
        const el = winRef.current;
        if (!el) return;
        setWinW(el.offsetWidth);
        const rect = el.getBoundingClientRect();
        const base = {
            x: rect.left + rect.width / 2 - window.innerWidth / 2,
            y: rect.top - window.innerHeight * 0.3,
        };
        setWinPos(base);
        const startX = e.clientX;
        const startY = e.clientY;
        const orig = base;
        const clamp = (x, y) => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            return {
                x: Math.min(vw / 2 - 140, Math.max(-(vw / 2 - 140), x)),
                y: Math.min(vh * 0.7 - 120, Math.max(-(vh * 0.3 - 80), y)),
            };
        };
        const move = (ev) => {
            setWinPos(clamp(orig.x + ev.clientX - startX, orig.y + ev.clientY - startY));
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    return (
        <div
            ref={winRef}
            className="mac-window"
            role="group"
            aria-label={title}
            onPointerDown={onFocus}
            style={
                winPos
                    ? {
                        position: 'fixed',
                        left: `calc(50% + ${winPos.x}px)`,
                        top: `calc(30% + ${winPos.y}px)`,
                        translate: '-50% 0',
                        zIndex: 5 + order,
                        margin: 0,
                        width: size ? size.w : winW || undefined,
                        height: size ? size.h : undefined,
                        maxWidth: size ? 'none' : undefined,
                    }
                    : {
                        zIndex: 5 + order,
                        width: size ? size.w : undefined,
                        height: size ? size.h : undefined,
                        maxWidth: size ? 'none' : undefined,
                    }
            }
        >
            <div className="mac-titlebar" onPointerDown={dragStart} style={{ touchAction: 'none', cursor: 'move' }}>
                <span className="mac-traffic">
                    <button type="button" className="mac-dot mac-close" onClick={onClose} aria-label={`Tutup ${title}`}>
                        <span aria-hidden="true">×</span>
                    </button>
                    <button
                        type="button"
                        className="mac-dot mac-min"
                        onClick={onToggleMin}
                        aria-label={minimized ? `Kembangkan ${title}` : `Ringkas ${title}`}
                        aria-pressed={minimized}
                    >
                        <span aria-hidden="true">–</span>
                    </button>
                    <button
                        type="button"
                        className="mac-dot mac-zoom-btn"
                        onClick={onZoom}
                        aria-label={`Buka penuh ${title}`}
                    >
                        <span aria-hidden="true">+</span>
                    </button>
                </span>
                <span className="mac-wintitle">{title}</span>
            </div>
            {minimized ? <div className="mac-winmini">{mini}</div> : <div className="mac-winstatic">{children}</div>}
            <button
                type="button"
                className="mac-resize-e"
                aria-label="Lebarkan jendela"
                onPointerDown={(e) => startResize(e, 'e')}
                onKeyDown={(e) => keyResize(e, 'e')}
            />
            <button
                type="button"
                className="mac-resize-s"
                aria-label="Tinggikan jendela"
                onPointerDown={(e) => startResize(e, 's')}
                onKeyDown={(e) => keyResize(e, 's')}
            />
            <button
                type="button"
                className="mac-resize-se"
                aria-label="Ubah ukuran jendela"
                onPointerDown={(e) => startResize(e, 'se')}
                onKeyDown={(e) => keyResize(e, 'se')}
            />
            <button
                type="button"
                className="mac-resize-w"
                aria-label="Lebarkan jendela ke kiri"
                onPointerDown={(e) => startResize(e, 'w')}
                onKeyDown={(e) => keyResize(e, 'w')}
            />
            <button
                type="button"
                className="mac-resize-n"
                aria-label="Tinggikan jendela ke atas"
                onPointerDown={(e) => startResize(e, 'n')}
                onKeyDown={(e) => keyResize(e, 'n')}
            />
            <button
                type="button"
                className="mac-resize-nw"
                aria-label="Ubah ukuran dari sudut kiri atas"
                onPointerDown={(e) => startResize(e, 'nw')}
                onKeyDown={(e) => keyResize(e, 'nw')}
            />
            <button
                type="button"
                className="mac-resize-ne"
                aria-label="Ubah ukuran dari sudut kanan atas"
                onPointerDown={(e) => startResize(e, 'ne')}
                onKeyDown={(e) => keyResize(e, 'ne')}
            />
            <button
                type="button"
                className="mac-resize-sw"
                aria-label="Ubah ukuran dari sudut kiri bawah"
                onPointerDown={(e) => startResize(e, 'sw')}
                onKeyDown={(e) => keyResize(e, 'sw')}
            />
        </div>
    );
}

// Tombol "Buka penuh" standar isi jendela.
export function WinOpen({ onZoom, children }) {
    return (
        <button type="button" className="win-openbtn" onClick={onZoom}>
            {children || 'Buka penuh'}
        </button>
    );
}

// Pratayang halaman asli di dalam jendela (seperti thumbnail OS):
// rute yang sama dimuat dalam bingkai, skala mengikuti lebar tombol,
// tinggi mengisi sisa jendela. Klik = buka penuh.
const PREVIEW_W = 800;

export function WinPreview({ to, title, onZoom }) {
    const btnRef = useRef(null);
    const [scale, setScale] = useState(0.5);
    const [frameH, setFrameH] = useState(448);

    useEffect(() => {
        const el = btnRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const update = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (!w || !h) return;
            const s = Math.min(1, Math.max(0.3, w / PREVIEW_W));
            setScale((prev) => (Math.abs(prev - s) < 0.005 ? prev : s));
            setFrameH((prev) => {
                const next = Math.round(h / s);
                return Math.abs(prev - next) < 1 ? prev : next;
            });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <button
            ref={btnRef}
            type="button"
            className="win-preview"
            onClick={onZoom}
            aria-label={`Buka penuh ${title}`}
        >
            <iframe
                src={`#${to}`}
                title={`Pratayang ${title}`}
                loading="lazy"
                tabIndex={-1}
                aria-hidden="true"
                style={{ width: PREVIEW_W, height: frameH, transform: `scale(${scale})` }}
            />
        </button>
    );
}

// Isi jendela Catatan: jumlah catatan akun (data nyata).
export function CatatanBody({ onZoom }) {
    const { token } = useSession();
    const [count, setCount] = useState(null);

    useEffect(() => {
        if (!token) {
            setCount(null);
            return;
        }
        readerApi(token, 'GET', '/api/v1/reader/notes')
            .then((d) => setCount((d.notes || []).length))
            .catch(() => setCount(null));
    }, [token]);

    return (
        <>
            <span className="win-status">
                {token ? (count === null ? 'Menghitung...' : `${count} catatan`) : 'Masuk untuk mencatat.'}
            </span>
            <WinOpen onZoom={onZoom} />
        </>
    );
}
