// Kilau teks saat masuk (arahan pemilik): tampil 10 detik penuh
// sebelum menu dibuka. Override R-19 dicatat (loop selama tampil).
export default function TextShimmer({ children, className }) {
    return <span className={['text-shimmer', className].filter(Boolean).join(' ')}>{children}</span>;
}
