let didInit = false;

export function initPointerGlow() {
  if (didInit) return;
  if (typeof window === "undefined") return;
  didInit = true;

  const root = document.documentElement;

  const setVars = (x: number, y: number) => {
    root.style.setProperty("--spotlight-x", x.toFixed(2));
    root.style.setProperty("--spotlight-y", y.toFixed(2));
    root.style.setProperty("--spotlight-xp", (x / window.innerWidth).toFixed(2));
    root.style.setProperty("--spotlight-yp", (y / window.innerHeight).toFixed(2));
  };

  setVars(window.innerWidth / 2, window.innerHeight / 2);

  window.addEventListener(
    "pointermove",
    (e) => {
      setVars(e.clientX, e.clientY);
    },
    { passive: true },
  );
}

