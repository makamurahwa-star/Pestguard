export default function Logo({ size = 32, className = '', dark = false }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3f853f" />
            <stop offset="100%" stopColor="#1f441f" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#lg)" />
        <path d="M16 6 C 11 11, 9 16, 11 22 C 14 18, 18 18, 21 22 C 23 16, 21 11, 16 6 Z" fill="#b7d8b7" />
        <circle cx="16" cy="18" r="2.2" fill="#0c1f0c" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-bold text-lg tracking-tight ${dark ? 'text-leaf-50' : 'text-leaf-900'}`}>
          PestGuard
        </span>
        <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${dark ? 'text-leaf-300' : 'text-leaf-600'}`}>
          Zimbabwe
        </span>
      </div>
    </div>
  )
}
