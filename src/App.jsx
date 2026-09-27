import { useState } from 'react';
import Controls from './components/Controls.jsx';
import Header from './components/Header.jsx';
import Viewport from './components/Viewport.jsx';
import { useEngine } from './engine/engine.jsx';
import { useHashRoute } from './router.jsx';
import Browse from './pages/Browse.jsx';
import Catalog from './pages/Catalog.jsx';
import Portal from './pages/Portal.jsx';
import Search from './pages/Search.jsx';
import './index.css';

// Portal viewer: #/ portal, #/katalog, #/semua, #/cari, #/baca.
// Design Read: portal baca santri, tenang mengikuti elibrary.
// Dial ENERGY 1 / RHYTHM 1 / MOTION 1.
const demoSource = { title: 'Contoh Kitab', pageCount: 24 };

function Reader({ source }) {
    const engine = useEngine(source);

    if (engine.status === 'loading') {
        return (
            <div className="reader">
                <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} />
                <main className="reader-viewport">
                    <p className="reader-state">Menyiapkan dokumen...</p>
                </main>
            </div>
        );
    }

    if (engine.status === 'error') {
        return (
            <div className="reader">
                <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} />
                <main className="reader-viewport">
                    <div className="reader-state">
                        <p>Dokumen gagal dibuka{engine.error ? `: ${engine.error}` : '.'}</p>
                        <p className="page-placeholder-sub">Periksa berkasnya lalu muat ulang halaman ini.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="reader">
            <Header title={engine.title} page={engine.page} pageCount={engine.pageCount} />
            <Viewport page={engine.page} renderPage={engine.renderPage} />
            <Controls
                page={engine.page}
                pageCount={engine.pageCount}
                onPrev={engine.prev}
                onNext={engine.next}
                onGoTo={engine.goTo}
            />
        </div>
    );
}

export default function App() {
    const { path, params, go } = useHashRoute();
    // Buku yang dibuka dari hasil cari. Judulnya dipakai, isi halaman tetap
    // stub sampai engine asli dipasang (placeholder-nya berkata jujur).
    const [reading, setReading] = useState(null);

    const openBook = (book) => {
        setReading(book);
        go('/baca');
    };

    if (path === '/katalog') return <Catalog go={go} />;
    if (path === '/semua') return <Browse params={params} go={go} />;
    if (path === '/cari') return <Search onRead={openBook} />;
    if (path === '/baca') {
        const source = reading ? { ...demoSource, title: reading.title } : demoSource;
        return <Reader source={source} />;
    }
    return <Portal />;
}
