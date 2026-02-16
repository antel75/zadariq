import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CheckCircle, Edit3, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CorrectionPopupProps {
  entityType: string;
  entityId: string;
  fieldName: string;
  currentValue: string;
  children: React.ReactNode;
}

function getFingerprint(): string {
  const nav = navigator;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency ?? '',
  ].join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36) + '_' + raw.length;
}

export function CorrectionPopup({ entityType, entityId, fieldName, currentValue, children }: CorrectionPopupProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'ask' | 'edit' | 'done'>('ask');
  const [newValue, setNewValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (action: 'confirm' | 'correct' | 'delete') => {
    setSubmitting(true);
    try {
      const fingerprint = getFingerprint();
      await supabase.functions.invoke('submit-correction', {
        body: {
          entity_type: entityType,
          entity_id: entityId,
          field_name: fieldName,
          old_value: currentValue,
          proposed_value: action === 'correct' ? newValue : action === 'delete' ? '__DELETED__' : currentValue,
          fingerprint,
          action,
        }
      });
    } catch {
      // Silent
    }
    setStep('done');
    setSubmitting(false);
    setTimeout(() => {
      setOpen(false);
      setStep('ask');
      setNewValue('');
    }, 1500);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep('ask'); setNewValue(''); } }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {step === 'done' ? (
          <div className="text-center py-3">
            <CheckCircle className="h-6 w-6 text-status-open mx-auto mb-1" />
            <p className="text-sm font-medium text-foreground">{t('report.thanks')}</p>
          </div>
        ) : step === 'edit' ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t('correction.suggestNew')}</p>
            <Input
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder={currentValue}
              className="text-sm"
              autoFocus
            />
            <button
              onClick={() => submit('correct')}
              disabled={!newValue.trim() || submitting}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('correction.submit')}
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground mb-2">{t('correction.isCorrect')}</p>
            <button
              onClick={() => submit('confirm')}
              disabled={submitting}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
            >
              <CheckCircle className="h-4 w-4 text-status-open" />
              {t('correction.correct')}
            </button>
            <button
              onClick={() => setStep('edit')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
            >
              <Edit3 className="h-4 w-4 text-accent" />
              {t('correction.suggest')}
            </button>
            <button
              onClick={() => submit('delete')}
              disabled={submitting}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
            >
              <XCircle className="h-4 w-4 text-destructive" />
              {t('correction.notExists')}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
