import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

export function SundayRadarBanner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const day = now.getDay();
      const h = now.getHours();
      setVisible(day === 0 && h >= 6 && h < 22);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const label: Record<string, string> = {
    hr: 'Sunday Radar', en: 'Sunday Radar', de: 'Sunday Radar', it: 'Sunday Radar'
  };
  const sub: Record<string, string> = {
    hr: 'Otkrij što radi danas',
    en: 'Discover what\'s open today',
    de: 'Entdecke was heute geöffnet ist',
    it: 'Scopri cosa è aperto oggi'
  };

  return (
    <div className="px-4 mb-4">
      <button
        onClick={() => navigate('/sunday-radar')}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,20,30,0.97) 0%, rgba(20,28,45,0.97) 50%, rgba(15,20,30,0.97) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '16px 20px',
        }}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {/* Top edge highlight */}
        <div className="absolute top-0 left-8 right-8 h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
        }} />

        <div className="relative flex items-center gap-4">
          {/* Pulsing indicator */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div
                className="w-5 h-5 rounded-full sunday-radar-dot"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, #4ade80, #16a34a)',
                  boxShadow: '0 0 12px rgba(74,222,128,0.6), 0 0 24px rgba(74,222,128,0.2)',
                }}
              />
            </div>
            {/* Outer pulse ring */}
            <div className="absolute inset-0 rounded-full sunday-radar-ring" style={{
              border: '1px solid rgba(74,222,128,0.3)',
            }} />
          </div>

          {/* Text */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white font-bold tracking-widest text-sm" style={{
                fontFamily: 'system-ui',
                letterSpacing: '0.15em',
                textShadow: '0 0 20px rgba(255,255,255,0.3)'
              }}>
                SUNDAY RADAR
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider" style={{
                background: 'rgba(74,222,128,0.15)',
                border: '1px solid rgba(74,222,128,0.3)',
                color: '#4ade80'
              }}>LIVE</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>
              {sub[language] || sub.hr}
            </p>
          </div>

          {/* Arrow */}
          <div className="shrink-0 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-3">
              <path d="M6 3l5 5-5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Bottom scan line animation */}
        <div className="absolute bottom-0 left-0 right-0 h-px sunday-radar-scan" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.4) 50%, transparent 100%)'
        }} />
      </button>

      <style>{`
        @keyframes sunday-dot-pulse {
          0%, 100% { 
            box-shadow: 0 0 8px rgba(74,222,128,0.5), 0 0 16px rgba(74,222,128,0.2);
            background: radial-gradient(circle at 40% 35%, #4ade80, #16a34a);
          }
          50% { 
            box-shadow: 0 0 16px rgba(239,68,68,0.5), 0 0 32px rgba(239,68,68,0.15);
            background: radial-gradient(circle at 40% 35%, #f87171, #dc2626);
          }
        }
        @keyframes sunday-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; border-color: rgba(74,222,128,0.4); }
          50% { transform: scale(1.15); opacity: 0; border-color: rgba(74,222,128,0.1); }
        }
        @keyframes sunday-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .sunday-radar-dot {
          animation: sunday-dot-pulse 3s ease-in-out infinite;
        }
        .sunday-radar-ring {
          animation: sunday-ring-pulse 3s ease-in-out infinite;
        }
        .sunday-radar-scan {
          animation: sunday-scan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
