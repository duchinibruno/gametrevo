'use client';

import React, { useState } from 'react';
import { User } from '@/types/game';
import { Clover, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
}

export function Navbar({
  currentUser,
  onLogout
}: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Clover className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">GameTrevo</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Trivia Ditloid
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Liga Diária de Enigmas & Desafios</p>
          </div>
        </div>

        {/* Controls: User Profile */}
        <div className="flex items-center gap-3">

          {/* Logged User Profile & Logout */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
              >
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser?.name || 'Jogador'}
                </span>
                <span className="block text-[10px] text-emerald-400 font-medium">Conectado</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50">
                <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-slate-800">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
                  >
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'Jogador'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Encerrar Sessão (Sair)
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
