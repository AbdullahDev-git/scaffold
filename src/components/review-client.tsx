'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { PrototypeFrame } from './prototype/frame';
import { Check, Eye, Lock, Pen, Send, X } from './icons';
import { savePackageAction, sendPitchAction } from '@/lib/actions';
import { slug } from '@/lib/utils';
import type { PitchPackage, Section } from '@/lib/schema';

const ACCENTS = ['#B9903A', '#C7443C', '#7A9C3E', '#3FA9A0', '#8C5A3C', '#E8722C'];

const SECTION_LABEL: Record<Section['kind'], string> = {
  hero: 'Hero',
  featureGrid: 'Feature grid',
  priceList: 'Price list',
  galleryStrip: 'Gallery',
  contact: 'Contact form',
  callStrip: 'Call strip',
};

/**
 * Review is the preview plus one ember action. Editing is a toggle, not a
 * permanent panel — closing it saves and returns to the clean view.
 */
export function ReviewClient({
  pitchId,
  clientName,
  initialPackage,
  alreadySent,
}: {
  pitchId: string;
  clientName: string;
  initialPackage: PitchPackage;
  alreadySent: boolean;
}) {
  const router = useRouter();
  const [pkg, setPkg] = useState(initialPackage);
  const [screenId, setScreenId] = useState(initialPackage.screens[0].id);
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(alreadySent);
  const [pending, startTransition] = useTransition();
  const [stash, setStash] = useState<Record<string, Section>>({});

  const screen = pkg.screens.find((x) => x.id === screenId) ?? pkg.screens[0];
  const hero = screen.sections.find((x) => x.kind === 'hero');
  const contact = screen.sections.find((x) => x.kind === 'contact');

  const persist = (next: PitchPackage) => {
    setPkg(next);
    startTransition(() => savePackageAction(pitchId, next));
  };

  const setHeadline = (value: string) => {
    persist({
      ...pkg,
      screens: pkg.screens.map((sc) =>
        sc.id !== screen.id
          ? sc
          : {
              ...sc,
              sections: sc.sections.map((section) =>
                section.kind === 'hero'
                  ? { ...section, headline: value }
                  : section.kind === 'contact' && !hero
                    ? { ...section, headline: value }
                    : section,
              ),
            },
      ),
    });
  };

  const toggleSection = (kind: Section['kind'], on: boolean) => {
    const key = `${screen.id}:${kind}`;
    if (!on) {
      const removed = screen.sections.find((x) => x.kind === kind);
      if (removed) setStash((s) => ({ ...s, [key]: removed }));
      persist({
        ...pkg,
        screens: pkg.screens.map((sc) =>
          sc.id === screen.id ? { ...sc, sections: sc.sections.filter((x) => x.kind !== kind) } : sc,
        ),
      });
      return;
    }
    const restored = stash[key];
    if (!restored) return;
    persist({
      ...pkg,
      screens: pkg.screens.map((sc) => (sc.id === screen.id ? { ...sc, sections: [...sc.sections, restored] } : sc)),
    });
  };

  const allKinds = Array.from(
    new Set([...screen.sections.map((x) => x.kind), ...Object.keys(stash).filter((k) => k.startsWith(`${screen.id}:`)).map((k) => k.split(':')[1] as Section['kind'])]),
  );

  return (
    <div className="review-wrap mt-[22px]" data-editing={editing}>
      <div>
        <div className="browser">
          <div className="browser-bar">
            <div className="dots">
              <i />
              <i />
              <i />
            </div>
            <div className="urlbar">
              <Lock />
              <span>scaffold.app/p/{slug(clientName)}</span>
            </div>
          </div>

          <div className="proto-tabs" role="tablist" aria-label="Prototype screens">
            {pkg.screens.map((sc) => (
              <button key={sc.id} role="tab" data-selected={sc.id === screen.id} aria-selected={sc.id === screen.id} onClick={() => setScreenId(sc.id)}>
                {sc.name}
              </button>
            ))}
          </div>

          <div className="stage">
            <PrototypeFrame pkg={pkg} screenId={screen.id} onNavigate={setScreenId} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {sent ? (
              <span className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--signal)' }}>
                <Check className="h-4 w-4" />
                Sent to {clientName} on WhatsApp
              </span>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await sendPitchAction(pitchId);
                    setSent(true);
                    setEditing(false);
                    router.refresh();
                  })
                }
              >
                <Send />
                Send to client
              </button>
            )}
            <button className={`btn ${editing ? 'btn-ghost' : 'btn-bare'}`} onClick={() => setEditing((v) => !v)}>
              <Pen />
              {editing ? 'Done editing' : 'Edit'}
            </button>
          </div>

          {sent ? (
            <Link className="btn btn-ghost" href={`/pitch/${pitchId}/analytics`}>
              <Eye />
              See who opened it
            </Link>
          ) : (
            <span className="readout">
              <span className="n">{pkg.screens.length}</span> screens, all clickable
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <aside className="editor on-panel">
          <div className="editor-head">
            <h3 className="h3">Edit</h3>
            <button className="x-btn" aria-label="Close edit panel" onClick={() => setEditing(false)}>
              <X />
            </button>
          </div>

          <div className="editor-body">
            <div className="editor-group">
              <span className="label">Accent colour</span>
              <div className="flex gap-2">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    className="swatch"
                    style={{ background: c }}
                    data-selected={pkg.theme.accent.toLowerCase() === c.toLowerCase()}
                    aria-label={`Accent ${c}`}
                    onClick={() => persist({ ...pkg, theme: { accent: c } })}
                  />
                ))}
              </div>
            </div>

            {hero || contact ? (
              <div className="editor-group">
                <span className="label">Headline on this screen</span>
                <input
                  className="input"
                  value={hero?.headline ?? contact?.headline ?? ''}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
            ) : null}

            <div className="editor-group">
              <span className="label">Sections</span>
              {allKinds.map((kind) => {
                const on = screen.sections.some((x) => x.kind === kind);
                return (
                  <div className="sec-row" key={kind}>
                    <span>{SECTION_LABEL[kind]}</span>
                    <Switch.Root className="switch-root" checked={on} onCheckedChange={(v) => toggleSection(kind, v)} aria-label={SECTION_LABEL[kind]}>
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                );
              })}
            </div>

            <div className="editor-group">
              <span className="label">Call button number</span>
              <input
                className="input input-mono"
                value={pkg.business.whatsapp}
                onChange={(e) => persist({ ...pkg, business: { ...pkg.business, whatsapp: e.target.value } })}
              />
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
