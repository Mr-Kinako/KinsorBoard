// src/app/layouts/AppLayout.tsx

import { Outlet } from "react-router";

export const AppLayout = () => {
  return (
    <div className="app-layout">
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};
