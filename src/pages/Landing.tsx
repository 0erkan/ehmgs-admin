import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Top right login button */}
      <div className="absolute top-6 right-6 z-20">
        <Link 
          to="/login" 
          className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-900/50 hover:bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-800 transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span className="text-sm font-medium">Yönetici Girişi</span>
        </Link>
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 tracking-tight">
          eHMGS
        </h1>
        <p className="text-xl md:text-3xl font-light text-slate-300">
          Çok Yakında...
        </p>
        <p className="text-slate-500 max-w-md mx-auto">
          Hukuk Mesleklerine Giriş Sınavı için en kapsamlı ve yenilikçi hazırlık platformu yapım aşamasında.
        </p>
      </div>
    </div>
  );
}
