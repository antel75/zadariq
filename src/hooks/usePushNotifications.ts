import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BDCt6UAsm6Fn1bI99UL7Gme6o_5GHdPtu1AH_tnF9unLn-rDVqfoY6vI8WnzE7KmvRdZeqkpY1dJ1dIcqCUxBcE';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register SW and check existing subscription on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.register('/sw.js').then(reg => {
      setRegistration(reg);
      reg.pushManager.getSubscription().then(sub => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!registration) return;

    // Request permission
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    // Create push subscription
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    const subJson = sub.toJSON();
    const endpoint = sub.endpoint;
    const p256dh = subJson.keys?.p256dh ?? '';
    const auth = subJson.keys?.auth ?? '';

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Save to database
    await supabase.from('push_subscriptions').upsert(
      {
        endpoint,
        p256dh,
        auth,
        user_id: user?.id ?? null,
      },
      { onConflict: 'endpoint' }
    );

    setIsSubscribed(true);
  }, [registration]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return;

    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    // Remove from database via edge function or just leave it
    // For now we can't delete with anon key due to RLS, so just unsubscribe locally
    setIsSubscribed(false);
  }, [registration]);

  return { permission, isSubscribed, subscribe, unsubscribe };
}
