import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, LogOut, User as UserIcon, Bell, BellOff, DollarSign, Euro, PoundSterling } from "lucide-react";
import { LivePulse } from "../common/LivePulse";
import { CoinBadge } from "../common/CoinBadge";
import { useAuthStore } from "../../store/useAuthStore";
import { usePriceStore } from "../../store/usePriceStore";
import { useUiStore, CURRENCIES } from "../../store/useUiStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";

export const Navbar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isConnected = usePriceStore((state) => state.isConnected);
  const lastUpdated = usePriceStore((state) => state.lastUpdated);
  const { currency, setCurrency, soundEnabled, toggleSound } = useUiStore();
  const navigate = useNavigate();
  const coins = usePriceStore((state) => state.coins);
  const [search, setSearch] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const filteredCoins = coins.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b border-white/5 bg-ink-950/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-8"
      data-testid="top-navbar"
    >
      <div className="flex items-center gap-4 md:gap-6">
        <LivePulse connected={isConnected} />
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
          <span>SYNC</span>
          <span className="text-cyan-300/80">{timeStr}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && filteredCoins.length > 0) {
                navigate(`/coins/${filteredCoins[0].id}`);
                setSearch("");
                setSearchOpen(false);
              }
            }}
            data-testid="navbar-search"
            placeholder="Search markets…"
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all"
          />
          {searchOpen && search.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-ink-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
              {filteredCoins.length > 0 ? (
                filteredCoins.slice(0, 5).map((coin) => (
                  <button
                    key={coin.id}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      navigate(`/coins/${coin.id}`);
                      setSearch("");
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors"
                  >
                    <CoinBadge coin={coin} size={24} />
                    <span className="font-medium text-white text-sm">{coin.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{coin.symbol}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 text-center font-mono">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Currency Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 px-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors">
              {CURRENCIES[currency]?.symbol || "$"} {currency}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-ink-900/95 border-white/10">
            {Object.keys(CURRENCIES).map((coinId) => (
              <DropdownMenuItem 
                key={coinId} 
                onClick={() => setCurrency(coinId)}
                className={`text-xs font-mono ${currency === coinId ? "text-cyan-300 bg-white/5" : "text-slate-400"}`}
              >
                {CURRENCIES[coinId].symbol} {coinId}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sound Toggle */}
        <button 
          onClick={toggleSound}
          className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
            soundEnabled 
              ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" 
              : "bg-white/5 border-white/10 text-slate-500"
          }`}
          title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
        >
          {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 hover:bg-white/[0.04] rounded-xl px-2 py-1.5 transition-colors"
              data-testid="user-menu-trigger"
            >
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white text-xs">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium text-white leading-tight">{user?.name}</div>
                <div className="text-[10px] font-mono text-slate-500 leading-tight">PRO TIER</div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-ink-900/95 backdrop-blur-xl border-white/10 text-slate-200"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="focus:bg-white/[0.05] focus:text-white" data-testid="menu-profile">
              <UserIcon className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
              data-testid="menu-logout"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
