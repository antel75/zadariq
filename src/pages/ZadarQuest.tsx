import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, MapPin, Clock, Star, ChevronRight, Navigation } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface Quest {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  duration_minutes: number;
  total_points: number;
  availability: string;
  active: boolean;
}

interface Checkpoint {
  id: string;
  quest_id: string;
  order_num: number;
  lat: number;
  lng: number;
  radius_outer: number;
  radius_inner: number;
  story: Record<string, string>;
  local_tip: Record<string, string>;
  challenge_type: string;
  challenge_question: Record<string, string>;
  challenge_options: Record<string, string[]> | null;
  challenge_correct: string | null;
  points: number;
}

type QuestState = 'idle' | 'active' | 'checkpoint' | 'challenge' | 'completed';

const SCORE_THRESHOLDS = [
  { min: 90, emoji: '🏛️', title: { en: 'The Zadran', hr: 'The Zadran' }, desc: { en: 'You didn\'t visit Zadar. You understood it.', hr: 'Nisi posjetio Zadar. Razumio si ga.' } },
  { min: 70, emoji: '🧭', title: { en: 'The Local', hr: 'The Local' }, desc: { en: 'Most tourists never get this far. You did.', hr: 'Većina turista nikad ne dođe ovdje. Ti jesi.' } },
  { min: 0,  emoji: '🌊', title: { en: 'The Wanderer', hr: 'The Wanderer' }, desc: { en: 'You\'ve seen Zadar. Come back to feel it.', hr: 'Vidio si Zadar. Vrati se da ga osjétiš.' } },
];

function getSessionId(): string {
  let sid = localStorage.getItem('quest_session_id');
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('quest_session_id', sid); }
  return sid;
}

export default function ZadarQuest() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language as string;

  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [currentCpIndex, setCurrentCpIndex] = useState(0);
  const [questState, setQuestState] = useState<QuestState>('idle');
  const [totalPoints, setTotalPoints] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyCheckpoint, setNearbyCheckpoint] = useState<Checkpoint | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [completedCps, setCompletedCps] = useState<string[]>([]);
  const [progressId, setProgressId] = useState<string | null>(null);

  useEffect(() => { fetchQuests(); }, []);

  const fetchQuests = async () => {
    const { data } = await supabase.from('quests').select('*').eq('active', true);
    setQuests((data as any) || []);
  };

  // GPS tracking
  useEffect(() => {
    if (questState !== 'active') return;
    if (!navigator.geolocation) { setLocationError('GPS nije dostupan na ovom uređaju.'); return; }
    const watcher = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        checkProximity(loc);
      },
      err => setLocationError('Molimo omogući pristup lokaciji.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [questState, checkpoints, currentCpIndex, completedCps]);

  function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function checkProximity(loc: {lat: number; lng: number}) {
    const cp = checkpoints[currentCpIndex];
    if (!cp || completedCps.includes(cp.id)) return;
    const dist = getDistance(loc.lat, loc.lng, cp.lat, cp.lng);
    if (dist <= cp.radius_inner) {
      setNearbyCheckpoint(cp);
      setQuestState('checkpoint');
    } else if (dist <= cp.radius_outer) {
      setNearbyCheckpoint(cp);
    }
  }

  const startQuest = async (quest: Quest) => {
    const { data: cps } = await supabase.from('quest_checkpoints').select('*').eq('quest_id', quest.id).order('order_num');
    setCheckpoints((cps as any) || []);
    setActiveQuest(quest);
    setCurrentCpIndex(0);
    setTotalPoints(0);
    setCompletedCps([]);
    setQuestState('active');
    const { data: prog } = await supabase.from('quest_progress').insert({
      session_id: getSessionId(), quest_id: quest.id, status: 'in_progress',
      total_points: 0, checkpoints_completed: []
    }).select().single();
    if (prog) setProgressId(prog.id);
    // Request GPS
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Molimo omogući GPS.'),
      { enableHighAccuracy: true }
    );
  };

  const submitAnswer = async () => {
    const cp = checkpoints[currentCpIndex];
    if (!cp) return;
    let pts = cp.points;
    if (cp.challenge_type === 'multiple_choice' && cp.challenge_correct) {
      if (answer !== cp.challenge_correct) pts = Math.floor(cp.points * 0.5);
    }
    setTotalPoints(p => p + pts);
    setAnswerSubmitted(true);
    const newCompleted = [...completedCps, cp.id];
    setCompletedCps(newCompleted);
    if (progressId) {
      await supabase.from('quest_progress').update({
        total_points: totalPoints + pts,
        checkpoints_completed: newCompleted
      }).eq('id', progressId);
    }
  };

  const nextCheckpoint = () => {
    setAnswer('');
    setAnswerSubmitted(false);
    setNearbyCheckpoint(null);
    if (currentCpIndex + 1 >= checkpoints.length) {
      completeQuest();
    } else {
      setCurrentCpIndex(i => i + 1);
      setQuestState('active');
    }
  };

  const completeQuest = async () => {
    setQuestState('completed');
    if (progressId) {
      await supabase.from('quest_progress').update({
        status: 'completed', completed_at: new Date().toISOString(), total_points: totalPoints
      }).eq('id', progressId);
    }
  };

  const getScoreTitle = (pts: number) => SCORE_THRESHOLDS.find(t => pts >= t.min) || SCORE_THRESHOLDS[2];

  // ── RENDER ──────────────────────────────────────────────

  if (questState === 'completed') {
    const score = getScoreTitle(totalPoints);
    const pct = Math.round((totalPoints / (activeQuest?.total_points || 100)) * 100);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">{score.emoji}</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{score.title[lang] || score.title.en}</h1>
        <p className="text-muted-foreground mb-6">{score.desc[lang] || score.desc.en}</p>
        <div className="text-4xl font-bold text-accent mb-1">{totalPoints} <span className="text-lg text-muted-foreground">/ {activeQuest?.total_points}</span></div>
        <p className="text-sm text-muted-foreground mb-8">{pct}% bodova</p>
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-sm text-muted-foreground max-w-sm">
          🏅 <strong>Zadar Unlocked — Old Town Quest</strong>
        </div>
        <button onClick={() => { setQuestState('idle'); setActiveQuest(null); }}
          className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold">
          {lang === 'hr' ? 'Natrag na questove' : 'Back to quests'}
        </button>
      </div>
    );
  }

  if (questState === 'checkpoint' || questState === 'challenge') {
    const cp = checkpoints[currentCpIndex];
    if (!cp) return null;
    const story = cp.story[lang] || cp.story.en;
    const tip = cp.local_tip[lang] || cp.local_tip.en;
    const question = cp.challenge_question[lang] || cp.challenge_question.en;
    const options = cp.challenge_options ? (cp.challenge_options[lang] || cp.challenge_options.en) : null;
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">{currentCpIndex + 1}</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{lang === 'hr' ? 'Checkpoint' : 'Checkpoint'} {currentCpIndex + 1}/{checkpoints.length}</p>
              <div className="h-1.5 bg-secondary rounded-full mt-1">
                <div className="h-full bg-accent rounded-full transition-all" style={{width: `${((currentCpIndex) / checkpoints.length) * 100}%`}} />
              </div>
            </div>
            <span className="text-sm font-bold text-accent">+{cp.points}pt</span>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 pb-8 pt-4 space-y-4">
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm text-foreground leading-relaxed italic">"{story}"</p>
          </div>
          {tip && (
            <div className="rounded-2xl bg-accent/5 border border-accent/20 p-3">
              <p className="text-xs text-accent font-semibold mb-1">💡 Local tip</p>
              <p className="text-xs text-muted-foreground">{tip}</p>
            </div>
          )}
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">{question}</p>
            {!answerSubmitted ? (
              <>
                {cp.challenge_type === 'multiple_choice' && options && (
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <button key={i} onClick={() => setAnswer(opt)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all ${answer === opt ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-background'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {cp.challenge_type === 'open_text' && (
                  <input className="w-full border rounded-xl px-3 py-2 text-sm bg-background" placeholder={lang === 'hr' ? 'Upiši odgovor...' : 'Type your answer...'} value={answer} onChange={e => setAnswer(e.target.value)} />
                )}
                <button onClick={submitAnswer} disabled={cp.challenge_type !== 'button_confirm' && !answer}
                  className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40">
                  {cp.challenge_type === 'button_confirm' ? (lang === 'hr' ? 'Gotovo! ✓' : 'Done! ✓') : (lang === 'hr' ? 'Potvrdi' : 'Submit')}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-2">
                  <span className="text-2xl">✅</span>
                  <p className="text-sm font-semibold text-foreground mt-1">+{cp.points} {lang === 'hr' ? 'bodova!' : 'points!'}</p>
                </div>
                <button onClick={nextCheckpoint} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
                  {currentCpIndex + 1 >= checkpoints.length ? (lang === 'hr' ? 'Završi quest 🏁' : 'Complete quest 🏁') : (lang === 'hr' ? 'Sljedeći checkpoint' : 'Next checkpoint')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (questState === 'active' && activeQuest) {
    const cp = checkpoints[currentCpIndex];
    const dist = userLocation && cp ? Math.round(getDistance(userLocation.lat, userLocation.lng, cp.lat, cp.lng)) : null;
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setQuestState('idle')} className="p-1.5 rounded-lg hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></button>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">{activeQuest.title[lang] || activeQuest.title.en}</p>
              <div className="h-1.5 bg-secondary rounded-full mt-1">
                <div className="h-full bg-accent rounded-full transition-all" style={{width: `${(completedCps.length / checkpoints.length) * 100}%`}} />
              </div>
            </div>
            <span className="text-sm font-bold text-accent">{totalPoints}pt</span>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 pb-8 pt-6 space-y-4">
          {locationError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{locationError}</div>
          )}
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🧭</div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {lang === 'hr' ? 'Checkpoint' : 'Checkpoint'} {currentCpIndex + 1}/{checkpoints.length}
            </h2>
            {dist !== null && (
              <p className="text-muted-foreground text-sm mb-4">
                {dist < cp!.radius_inner ? '✅ Stigao si!' : dist < cp!.radius_outer ? `🔶 Blizu si — ${dist}m` : `📍 ${dist}m dalje`}
              </p>
            )}
            {dist !== null && dist > (cp?.radius_outer || 80) && (
              <a href={`https://maps.google.com/?q=${cp?.lat},${cp?.lng}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Navigation className="h-4 w-4" />
                {lang === 'hr' ? 'Navigiraj do checkpointa' : 'Navigate to checkpoint'}
              </a>
            )}
            {nearbyCheckpoint && dist !== null && dist <= nearbyCheckpoint.radius_inner && (
              <button onClick={() => setQuestState('checkpoint')}
                className="mt-4 w-full py-3 rounded-xl bg-accent text-white font-semibold">
                {lang === 'hr' ? 'Otključaj checkpoint! 🔓' : 'Unlock checkpoint! 🔓'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {checkpoints.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${completedCps.includes(c.id) ? 'bg-accent/5 border-accent/20' : i === currentCpIndex ? 'border-accent bg-accent/5' : 'border-border opacity-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedCps.includes(c.id) ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'}`}>
                  {completedCps.includes(c.id) ? '✓' : i + 1}
                </span>
                <span className="flex-1 text-foreground">{lang === 'hr' ? `Checkpoint ${i + 1}` : `Checkpoint ${i + 1}`}</span>
                <span className="text-accent font-semibold">+{c.points}pt</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // IDLE — quest list
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
            <div>
              <h1 className="text-lg font-bold text-foreground">🗺️ Zadar Quest</h1>
              <p className="text-[11px] text-muted-foreground">{lang === 'hr' ? 'Otkrij grad kao lokalni' : 'Discover the city like a local'}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pb-8 pt-4 space-y-4">
        {quests.map(quest => (
          <div key={quest.id} className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent/20 to-primary/10 p-4">
              <h2 className="text-base font-bold text-foreground">{quest.title[lang] || quest.title.en}</h2>
              <p className="text-xs text-muted-foreground mt-1">{quest.description[lang] || quest.description.en}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quest.duration_minutes} min</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" />{quest.total_points} {lang === 'hr' ? 'bodova' : 'points'}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />7 checkpoints</span>
              </div>
              <button onClick={() => startQuest(quest)}
                className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2">
                {lang === 'hr' ? 'Kreni na quest →' : 'Start quest →'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}
