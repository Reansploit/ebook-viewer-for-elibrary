// Pilihan kategori sebagai tautan (bukan tombol palsu): tiap chip
// punya tujuan nyata (R-26). activeId kosong berarti semua.
export default function CategoryChips({ categories, activeId, makeHref }) {
    if (!categories || categories.length === 0) return null;
    return (
        <div className="chip-row">
            <a
                href={makeHref('')}
                className={activeId === '' ? 'chip chip-active' : 'chip'}
                aria-current={activeId === '' ? 'true' : undefined}
            >
                Semua
            </a>
            {categories.map((cat) => (
                <a
                    key={cat.id}
                    href={makeHref(cat.id)}
                    className={activeId === String(cat.id) ? 'chip chip-active' : 'chip'}
                    aria-current={activeId === String(cat.id) ? 'true' : undefined}
                >
                    {cat.name}
                </a>
            ))}
        </div>
    );
}
