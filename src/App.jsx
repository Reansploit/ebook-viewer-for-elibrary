import Controls from './components/Controls.jsx';
import Header from './components/Header.jsx';
import Viewport from './components/Viewport.jsx';
import { useEngine } from './engine/engine.jsx';

// Shell UI pembaca ebook pondok.
// Design Read: tampilan baca untuk santri di HP dan laptop, gaya tenang
// mengikuti isi kitab. Dial ENERGY 1 / RHYTHM 1 / MOTION 1.
// `source` contoh di bawah diganti sumber asli saat integrasi.
const demoSource = { title: 'Contoh Kitab', pageCount: 24 };

export default function App() {
    const engine = useEngine(demoSource);

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
