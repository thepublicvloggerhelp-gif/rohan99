@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.75rem;
    --font-inter: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* Surface colors */
    --bg-primary:   #0a0a0f;
    --bg-secondary: #111118;
    --bg-tertiary:  #16161f;
    --bg-card:      #1c1c28;
    --bg-elevated:  #22223a;

    /* Text */
    --text-primary:   #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted:     #475569;
    --text-accent:    #818cf8;

    /* Brand */
    --brand:        #6366f1;
    --brand-hover:  #4f46e5;
    --brand-light:  rgba(99,102,241,0.15);

    /* Borders */
    --border:       rgba(255,255,255,0.08);
    --border-hover: rgba(255,255,255,0.15);
  }

  * {
    @apply border-white/[0.08];
  }

  html {
    @apply scroll-smooth;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-inter);
    @apply antialiased;
    overflow-x: hidden;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
  }

  /* Selection */
  ::selection {
    background: rgba(99,102,241,0.4);
    color: #f1f5f9;
  }
}

@layer components {
  /* Glassmorphism card */
  .glass-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .glass-card-hover {
    @apply glass-card transition-all duration-300;
  }
  .glass-card-hover:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
  }

  /* Sidebar item */
  .sidebar-item {
    @apply flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
           text-slate-400 transition-all duration-200 cursor-pointer select-none;
  }
  .sidebar-item:hover {
    @apply text-slate-100 bg-white/[0.06];
  }
  .sidebar-item.active {
    @apply text-white bg-brand-500/20;
    box-shadow: inset 0 0 0 1px rgba(99,102,241,0.3);
  }

  /* Channel item */
  .channel-item {
    @apply flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm
           text-slate-400 transition-all duration-150 cursor-pointer select-none;
  }
  .channel-item:hover {
    @apply text-slate-200 bg-white/[0.05];
  }
  .channel-item.active {
    @apply text-white bg-brand-500/15;
  }

  /* Message */
  .message-item {
    @apply flex gap-3 px-4 py-1.5 rounded-xl transition-colors duration-150;
  }
  .message-item:hover {
    @apply bg-white/[0.03];
  }

  /* Input */
  .input-base {
    @apply w-full bg-white/[0.06] border border-white/[0.08] rounded-xl
           px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500
           outline-none transition-all duration-200;
  }
  .input-base:focus {
    @apply border-brand-500/50 bg-white/[0.08];
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  /* Button variants */
  .btn-primary {
    @apply flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
           bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm
           transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
    box-shadow: 0 4px 15px rgba(99,102,241,0.4);
  }
  .btn-primary:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(99,102,241,0.5);
    transform: translateY(-1px);
  }

  .btn-secondary {
    @apply flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
           bg-white/[0.07] hover:bg-white/[0.1] border border-white/[0.08]
           text-slate-200 font-semibold text-sm
           transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-ghost {
    @apply flex items-center justify-center gap-2 px-3 py-2 rounded-lg
           text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]
           text-sm font-medium transition-all duration-150 active:scale-95;
  }

  .btn-danger {
    @apply flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
           bg-red-500/20 hover:bg-red-500/30 border border-red-500/30
           text-red-400 hover:text-red-300 font-semibold text-sm
           transition-all duration-200 active:scale-95;
  }

  /* Badge */
  .badge {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold;
  }
  .badge-jee {
    @apply badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30;
  }
  .badge-neet {
    @apply badge bg-green-500/20 text-green-300 border border-green-500/30;
  }
  .badge-admin {
    @apply badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/30;
  }

  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Shimmer loading */
  .shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* Online indicator */
  .online-dot {
    @apply w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface-1;
  }

  /* Message action buttons */
  .msg-action {
    @apply p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.08]
           transition-all duration-150 opacity-0 group-hover:opacity-100;
  }

  /* Reaction chip */
  .reaction-chip {
    @apply flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
           bg-white/[0.06] border border-white/[0.08] hover:bg-brand-500/20
           hover:border-brand-500/30 transition-all duration-150 cursor-pointer select-none;
  }
  .reaction-chip.active {
    @apply bg-brand-500/20 border-brand-500/40 text-brand-300;
  }

  /* Stat card */
  .stat-card {
    @apply glass-card rounded-2xl p-5 flex flex-col gap-1;
  }

  /* Test option */
  .test-option {
    @apply glass-card rounded-xl p-4 cursor-pointer transition-all duration-200
           border border-transparent hover:border-brand-500/30;
  }
  .test-option.selected {
    @apply border-brand-500/50 bg-brand-500/10;
    box-shadow: 0 0 0 1px rgba(99,102,241,0.5) inset;
  }
  .test-option.correct {
    @apply border-green-500/50 bg-green-500/10;
  }
  .test-option.incorrect {
    @apply border-red-500/50 bg-red-500/10;
  }

  /* Scroll area */
  .scroll-area {
    @apply overflow-y-auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }

  /* Mobile bottom nav */
  .mobile-nav {
    @apply fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around
           py-3 px-4 border-t border-white/[0.08];
    background: rgba(17,17,24,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .text-shadow-glow {
    text-shadow: 0 0 20px rgba(99,102,241,0.5);
  }

  .border-gradient {
    background: linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
                linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4)) border-box;
    border: 1px solid transparent;
  }
}
