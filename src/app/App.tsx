// src/app/App.tsx

import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "./layouts/AppLayout";
import { BoardPage } from "@/pages/board/ui/BoardPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<div>Welcome to the KinsorBoard</div>} />

          <Route path="board" element={<BoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
