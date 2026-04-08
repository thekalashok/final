import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "../ui/sonner";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-grow overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
