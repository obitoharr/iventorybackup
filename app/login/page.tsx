"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else router.push("/");
  };

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Account created. Login now.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="p-6 bg-white/10 rounded-2xl w-[320px] space-y-4">
        <h2 className="text-xl font-bold">Login</h2>

        <input
          className="w-full p-2 bg-white/10 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 bg-white/10 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login} className="w-full bg-blue-600 p-2 rounded">
          Login
        </button>

        <button onClick={signup} className="w-full bg-green-600 p-2 rounded">
          Create Account
        </button>
      </div>
    </div>
  );
}