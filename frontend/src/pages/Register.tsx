import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { Activity, ArrowRight, Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-900 text-white" data-testid="register-page">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden grain">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1648291308119-ec5a5df0bed8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjAzRCUyMGdsYXNzJTIwY3lhbiUyMHB1cnBsZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4MjI1MzgyfDA&ixlib=rb-4.1.0&q=85)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/70 via-ink-900/50 to-ink-900/95" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.45)]">
              <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-semibold tracking-tight">Kuvaka</div>
              <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-400">Crypto Intelligence</div>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">// onboard</div>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight">
              Build your <span className="gradient-text">edge</span>.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Track 10+ assets, set conditional alerts, monitor portfolio P&L, and
              read correlation maps — all in one terminal-grade interface.
            </p>
          </div>

          <div className="text-[10px] font-mono text-slate-600">
            © {new Date().getFullYear()} KUVAKA TECH
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80 mb-2">// new account</div>
          <h2 className="font-display text-3xl font-semibold tracking-tight mb-2">Create account</h2>
          <p className="text-sm text-slate-400 mb-8">Start tracking the markets in seconds.</p>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Name</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  data-testid="register-name-input"
                  required value={name} onChange={(event) => setName(event.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  data-testid="register-email-input"
                  type="email" required value={email} onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  data-testid="register-password-input"
                  type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full gradient-primary text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_28px_rgba(34,211,238,0.5)] transition-all disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-8 text-center">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-cyan-300 hover:text-cyan-200" data-testid="goto-login">
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
