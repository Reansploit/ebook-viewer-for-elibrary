// Input RFID gaya holo (arahan pemilik, override R-01/R-19 dicatat di sini).
// Scanner mengetik + Enter seperti keyboard biasa, jadi form ini langsung jalan.
export default function HoloRfid({ value, onChange, disabled }) {
    return (
        <div className="glitch-input-wrapper">
            <div className="input-container">
                <input
                    type="text"
                    id="holo-input"
                    className="holo-input"
                    placeholder=""
                    required=""
                    autoComplete="off"
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                />
                <label htmlFor="holo-input" className="input-label" data-text="ACCESS_CODE">
                    ACCESS_CODE
                </label>

                <div className="input-border"></div>
                <div className="input-scanline"></div>
                <div className="input-glow"></div>

                <div className="input-data-stream">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i} className="stream-bar" style={{ '--i': i }}></div>
                    ))}
                </div>

                <div className="input-corners">
                    <div className="corner corner-tl"></div>
                    <div className="corner corner-tr"></div>
                    <div className="corner corner-bl"></div>
                    <div className="corner corner-br"></div>
                </div>
            </div>
        </div>
    );
}
