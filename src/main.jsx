import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./auth/AuthProvider";
import "@radix-ui/themes/styles.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
