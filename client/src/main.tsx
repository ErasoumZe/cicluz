import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPointerGlow } from "./lib/pointer-glow";

initPointerGlow();

createRoot(document.getElementById("root")!).render(<App />);
