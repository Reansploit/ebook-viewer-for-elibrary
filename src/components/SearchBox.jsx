import { useState } from 'react';

// Kolom cari dengan debounce 350ms + submit Enter.
// onSearch(q) dipanggil tiap perubahan (untuk hasil live),
// onSubmit(q) saat Enter (untuk pindah halaman hasil).
export default function SearchBox({ initial = '', placeholder, onSearch, onSubmit }) {
    const [value, setValue] = useState(initial);

    return (
        <form
            className="search-box"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.(value.trim());
            }}
        >
            <label className="reader-jump-label" htmlFor="catalog-search">
                Cari buku
            </label>
            <input
                id="catalog-search"
                className="search-input"
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    onSearch?.(e.target.value.trim());
                }}
            />
        </form>
    );
}
