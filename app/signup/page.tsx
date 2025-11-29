"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Update Display Name (Firebase Auth Profile)
      await updateProfile(userCredential.user, {
        displayName: firstName
      });

      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black text-white selection:bg-[#00E676]/30">
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-zinc-900"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518005052357-e98719513166?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute w-96 h-96 bg-[#00E676]/20 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <h1 className="text-6xl font-bold font-space mb-4 leading-tight">Join the <br/><span className="text-[#00E676]">Movement.</span></h1>
          <p className="text-xl font-light text-zinc-300">Create an account to start earning rewards.</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-black"
      >
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white font-space">Create Account</h2>
            <p className="mt-2 text-sm text-zinc-400">Enter your details to register for UrbanPulse</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="mt-8 space-y-6">
            <div className="space-y-4">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-800 bg-zinc-900 placeholder-zinc-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00E676] sm:text-sm"
                placeholder="First Name (Display Name)"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-800 bg-zinc-900 placeholder-zinc-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00E676] sm:text-sm"
                placeholder="Email address"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-800 bg-zinc-900 placeholder-zinc-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00E676] sm:text-sm"
                placeholder="Password (Min 6 chars)"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-black bg-[#00E676] hover:bg-[#00b359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E676] transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
            </button>
          </form>
          
          <div className="text-center">
             <span className="text-zinc-500 text-sm">Already have an account? </span>
             <Link href="/login" className="text-[#00E676] text-sm hover:underline font-medium">Log in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
