// Tombol cyber (snippet pemilik, tanpa modal/popover/demo).
// Override R-01/R-19 dicatat: glitch tak berujung saat hover/fokus.
export default function CyberBtn({ kbd, label, onClick, type = 'button', action }) {
    const letters = label.split('');
    return (
        <button type={type} className="cyber-btn" aria-label={label} data-action={action || label} onClick={onClick}>
            <span className="backdrop">
                <span className="corner"></span>
            </span>
            <kbd>{kbd}</kbd>
            <span>{label}</span>
            <div className="glitch" aria-hidden="true">
                <span className="backdrop">
                    <span className="corner"></span>
                </span>
                <kbd>{kbd}</kbd>
                <span className="letters">
                    {letters.map((ch, i) => (
                        <span key={i}>{ch}</span>
                    ))}
                </span>
            </div>
        </button>
    );
}
