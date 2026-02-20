import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export type UserMode = 'resident' | 'tourist';

interface UserModeResult {
  mode: UserMode;
  reason: string;
  confidence: number;
  setManualMode: (mode: UserMode | null) => void;
}

const STORAGE_KEY = 'zadariq_user_mode';
const VISIT_KEY = 'zadariq_visits';

function recordVisit() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(VISIT_KEY);
    let visits: number[] = raw ? JSON.parse(raw) : [];
    // Keep only last 7 days
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    visits = visits.filter(v => v > weekAgo);
    visits.push(now);
    localStorage.setItem(VISIT_KEY, JSON.stringify(visits));
    return visits.length;
  } catch {
    return 1;
  }
}

function getVisitCount(): number {
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    if (!raw) return 0;
    const visits: number[] = JSON.parse(raw);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return visits.filter(v => v > weekAgo).length;
  } catch {
    return 0;
  }
}

export function useUserMode(): UserModeResult {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [manualMode, setManualModeState] = useState<UserMode | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'resident' || saved === 'tourist' ? saved : null;
    } catch {
      return null;
    }
  });
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const count = recordVisit();
    setVisitCount(count);
  }, []);

  const setManualMode = (mode: UserMode | null) => {
    setManualModeState(mode);
    try {
      if (mode) {
        localStorage.setItem(STORAGE_KEY, mode);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { }
  };

  const result = useMemo((): UserModeResult => {
    // 1) Debug override via query param
    const debugMode = searchParams.get('mode');
    if (debugMode === 'resident' || debugMode === 'tourist') {
      return { mode: debugMode, reason: 'debug override', confidence: 1, setManualMode };
    }

    // 2) Manual selection from localStorage
    if (manualMode) {
      return { mode: manualMode, reason: 'manual selection', confidence: 1, setManualMode };
    }

    // 3) Auto-detect heuristics
    // Language-based: HR → likely resident, EN/DE/IT → likely tourist
    const isHrLang = language === 'hr';
    const visits = visitCount || getVisitCount();
    const isFrequentVisitor = visits >= 5;

    if (isHrLang && isFrequentVisitor) {
      return { mode: 'resident', reason: 'HR language + frequent visits', confidence: 0.85, setManualMode };
    }

    if (isHrLang) {
      return { mode: 'resident', reason: 'HR language', confidence: 0.65, setManualMode };
    }

    // Non-HR language → tourist
    return { mode: 'tourist', reason: `${language.toUpperCase()} language`, confidence: 0.7, setManualMode };
  }, [searchParams, manualMode, language, visitCount]);

  return result;
}
