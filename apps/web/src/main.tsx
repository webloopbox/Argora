import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./app-config/AuthProvider";
import { LanguageProvider } from "./app-config/LanguageProvider";
import { ThemeProvider } from "./app-config/ThemeProvider";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
              toastOptions={{ className: "font-sans" }}
            />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
