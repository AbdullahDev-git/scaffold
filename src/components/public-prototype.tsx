'use client';

import { useEffect, useRef, useState } from 'react';
import { PrototypeFrame } from './prototype/frame';
import type { PitchPackage } from '@/lib/schema';

/** What the client sees when they tap the WhatsApp link. */
export function PublicPrototype({ pkg, pitchId }: { pkg: PitchPackage; pitchId: string }) {
  const [screenId, setScreenId] = useState(pkg.screens[0].id);
  const startTime = useRef(Date.now());
  const sent = useRef(false);

  useEffect(() => {
    const sendBeacon = () => {
      if (sent.current) return;
      const seconds = Math.round((Date.now() - startTime.current) / 1000);
      if (seconds <= 0) return;
      sent.current = true;
      navigator.sendBeacon('/api/pitch-views', JSON.stringify({ pitchId, seconds }));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendBeacon();
      }
    };

    const onBeforeUnload = () => {
      sendBeacon();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [pitchId]);

  return <PrototypeFrame pkg={pkg} screenId={screenId} onNavigate={setScreenId} standalone />;
}
