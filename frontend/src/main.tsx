import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import HomePage from "./pages/home/HomePage";
import StoryPage from "./pages/story/StoryPage";
import FounderLoginPage from "./pages/founder/FounderLoginPage";
import FounderDashboardPage from "./pages/founder/FounderDashboardPage";
import AdminIssuePage from "./pages/admin/AdminIssuePage";

const queryClient = new QueryClient();

// Routing goes straight to the four specced routes — no homepage, no navbar.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story/:certificateId" element={<StoryPage />} />
          <Route path="/upload/:certificateId" element={<FounderLoginPage />} />
          <Route path="/upload/:certificateId/dashboard" element={<FounderDashboardPage />} />
          <Route path="/admin/issue" element={<AdminIssuePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
