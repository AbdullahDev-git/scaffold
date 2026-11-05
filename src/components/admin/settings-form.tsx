'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSystemSettingAction } from '@/lib/admin-actions';
import type { SystemSetting } from '@/lib/schema';

export function SettingsForm({ settings }: { settings: SystemSetting[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (key: string, value: string) => {
    startTransition(async () => {
      const result = await updateSystemSettingAction(key, value);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      {settings.map((s) => (
        <div key={s.key} className="sec">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{s.key}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ash)' }}>{s.description}</div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                handleSubmit(s.key, form.get('value') as string);
              }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <input
                name="value"
                className="input"
                defaultValue={typeof s.value === 'string' ? s.value : JSON.stringify(s.value)}
                style={{ width: 200 }}
                disabled={pending}
              />
              <button type="submit" className="btn btn-sm" disabled={pending}>
                Save
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
