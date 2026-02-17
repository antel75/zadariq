import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percent: number;
}

interface Poll {
  id: string;
  question_text: string;
  context_type: string;
  context_key: string;
  options: PollOption[];
  total_votes: number;
}

function getDailyFingerprint(): string {
  const nav = navigator;
  const day = new Date().toISOString().slice(0, 10);
  const raw = [nav.userAgent, nav.language, screen.width, screen.height, day].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

const VOTE_KEY = 'daily_poll_voted_';

export function useDailyPoll() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPoll = useCallback(async () => {
    try {
      // First try to generate if needed
      await supabase.functions.invoke('generate-daily-poll');

      // Then fetch active poll via query param
      const { data } = await supabase.functions.invoke('daily-poll', {
        body: null,
        headers: { 'Content-Type': 'application/json' },
      });

      if (data?.poll) {
        setPoll(data.poll);
        // Check if already voted
        const stored = localStorage.getItem(VOTE_KEY + data.poll.id);
        if (stored) {
          setVoted(true);
          setVotedOptionId(stored);
        }
      }
    } catch (e) {
      console.error('Poll fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const vote = useCallback(async (optionId: string) => {
    if (!poll || voted || submitting) return;
    setSubmitting(true);

    try {
      const fingerprint = getDailyFingerprint();
      const { data, error } = await supabase.functions.invoke('daily-poll', {
        body: {
          action: 'vote',
          option_id: optionId,
          poll_id: poll.id,
          fingerprint_hash: fingerprint,
        },
      });

      // Handle edge function returning error in body
      if (data?.error === 'already_voted') {
        setVoted(true);
        setVotedOptionId(optionId);
        localStorage.setItem(VOTE_KEY + poll.id, optionId);
        return;
      }

      if (error) throw error;

      if (data?.success && data.options) {
        setPoll(prev => prev ? { ...prev, options: data.options, total_votes: data.total_votes } : prev);
        setVoted(true);
        setVotedOptionId(optionId);
        localStorage.setItem(VOTE_KEY + poll.id, optionId);
      }
    } catch (e) {
      console.error('Vote error:', e);
    } finally {
      setSubmitting(false);
    }
  }, [poll, voted, submitting]);

  return { poll, loading, voted, votedOptionId, submitting, vote };
}
