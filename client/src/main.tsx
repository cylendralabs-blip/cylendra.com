import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load Analytics if environment variables are defined
if (import.meta.env.VITE_ANALYTICS_ENDPOINT && import.meta.env.VITE_ANALYTICS_WEBSITE_ID) {
  const script = document.createElement('script');
  script.src = import.meta.env.VITE_ANALYTICS_ENDPOINT + '/umami';
  script.dataset.websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  script.defer = true;
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(<App />);
