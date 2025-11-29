"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { SiGoogle } from "react-icons/si"; // Ensure react-icons is installed

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Could not sign in with Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black text-white selection:bg-[#00E676]/30">
      
      {/* Left: Visual Side */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-zinc-900"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute w-96 h-96 bg-[#2979FF]/20 rounded-full blur-3xl bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <h1 className="text-6xl font-bold font-space mb-4 leading-tight">Welcome <br/><span className="text-[#2979FF]">Back.</span></h1>
          <p className="text-xl font-light text-zinc-300">
            Continue your journey towards a smarter, greener city.
          </p>
        </div>
      </motion.div>

      {/* Right: Form Side */}
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
            <h2 className="text-3xl font-bold text-white font-space">Login to UrbanPulse</h2>
            <p className="mt-2 text-sm text-zinc-400">Enter your credentials to access the dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-800 bg-zinc-900 placeholder-zinc-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2979FF] sm:text-sm"
                placeholder="Email address"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-zinc-800 bg-zinc-900 placeholder-zinc-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2979FF] sm:text-sm"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#2979FF] hover:bg-[#2979FF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2979FF] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-black text-zinc-500">Or continue with</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-zinc-700 rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-all"
          >
            <SiGoogle className="text-white" /> 
            <span className="text-sm font-medium">Google</span>
          </button>
          
          <div className="text-center">
             <span className="text-zinc-500 text-sm">Don't have an account? </span>
             <Link href="/signup" className="text-[#2979FF] text-sm hover:underline font-medium">Sign up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
