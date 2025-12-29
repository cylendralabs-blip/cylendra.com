import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { logEnvValidation } from './config/envValidation'

// Validate environment variables on app start
logEnvValidation()

createRoot(document.getElementById("root")!).render(<App />);
