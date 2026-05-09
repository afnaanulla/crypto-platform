import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BellRing,
  Briefcase,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Markets", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/alerts", label: "Alerts", icon: BellRing, testId: "nav-alerts" },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase, testId: "nav-portfolio" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testId: "nav-analytics" },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="hidden md:flex sticky top-0 h-screen flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl z-40"
      data-testid="sidebar"
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
        <div className="relative h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-semibold tracking-tight text-white whitespace-nowrap">Kuvaka</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500 whitespace-nowrap">Crypto Intelligence</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={item.testId}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                isActive
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 top-0 bottom-0 my-auto h-6 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  />
                )}
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-2">

        <button
          onClick={() => setCollapsed((coinId) => !coinId)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-slate-500 hover:text-cyan-300 hover:bg-white/[0.03] transition-colors border border-white/5"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> COLLAPSE</>}
        </button>
      </div>
    </motion.aside>
  );
};

// Mobile bottom nav
export const MobileNav: React.FC = () => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl">
    <div className="flex justify-around py-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-testid={`mobile-${item.testId}`}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium",
              isActive ? "text-cyan-300" : "text-slate-500"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
