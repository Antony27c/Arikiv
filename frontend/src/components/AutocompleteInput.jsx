import { useState, useRef, useEffect } from "react";

export default function AutocompleteInput({
  value, onChange, placeholder, style, required,
  suggestions, historyKey, type,
}) {
  const [focused, setFocused] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [history, setHistory] = useState([]);
  const ref = useRef();
  const selRef = useRef(-1);

  useEffect(() => {
    if (!historyKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(`pw_hist_${historyKey}`) || "[]");
      setHistory(stored);
    } catch { setHistory([]); }
  }, [historyKey]);

  useEffect(() => {
    if (!value) { setFiltered([]); return; }
    const v = value.toLowerCase();
    const all = [...new Set([...suggestions, ...history])];
    const f = all.filter(s => s.toLowerCase().includes(v) && s.toLowerCase() !== v);
    setFiltered(f.slice(0, 8));
    selRef.current = -1;
  }, [value, suggestions, history]);

  function onKeyDown(e) {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selRef.current = Math.min(selRef.current + 1, filtered.length - 1);
      scrollSelected();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selRef.current = Math.max(selRef.current - 1, 0);
      scrollSelected();
    } else if (e.key === "Enter" && selRef.current >= 0) {
      e.preventDefault();
      select(filtered[selRef.current]);
    } else if (e.key === "Escape") {
      setFiltered([]);
    }
  }

  function scrollSelected() {
    const el = ref.current?.querySelector("[data-selected=true]");
    el?.scrollIntoView({ block: "nearest" });
  }

  function select(val) {
    onChange({ target: { value: val } });
    setFiltered([]);
  }

  const show = focused && filtered.length > 0;

  return (
    <div style={{ position: "relative", flex: style?.flex || "1 1 auto", minWidth: 0 }} ref={ref}>
      <input
        className="pw-input"
        type={type || "text"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        onKeyDown={onKeyDown}
        required={required}
        autoComplete="off"
        style={style}
      />
      {show && (
        <div className="pw-autocomplete-list">
          {filtered.map((s, i) => (
            <div
              key={s}
              data-selected={i === selRef.current}
              onMouseDown={() => select(s)}
              className={`pw-autocomplete-item ${i === selRef.current ? "pw-autocomplete-selected" : ""}`}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
