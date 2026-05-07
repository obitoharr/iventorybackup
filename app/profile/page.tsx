"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useRequireAuth, logout } from "@/hooks/useRequireAuth";

export default function ProfilePage() {
  const { user, loading } = useRequireAuth();
  const [dark, setDark] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen items-start flex-col lg:flex-row ${dark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-950"}`}>
      <Sidebar dark={dark} setDark={setDark} />
      <main className="flex-1 p-6">
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-gray-400 mt-2">View your account details and sign out.</p>
          </div>
        </div>

        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-lg font-medium">{user?.email || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">User ID</p>
              <p className="text-sm break-all">{user?.id || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Role</p>
              <p className="text-lg font-medium">{user?.app_metadata?.provider || "User"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Created</p>
              <p className="text-lg font-medium">{user?.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-xl bg-red-600 px-4 py-3 text-white"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
