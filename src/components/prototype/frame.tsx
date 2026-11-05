'use client';

import { ProtoIcon, type ProtoIconName } from '../icons';
import type { PitchPackage, Section } from '@/lib/schema';
import s from './prototype.module.css';

/**
 * Master Layout Wrapper.
 *
 * Header, footer, floating WhatsApp CTA, watermark and screen routing are static
 * and hand-written. Only the text inside the slots comes from the validated
 * PitchPackage — the model never emits markup or class names.
 */
export function PrototypeFrame({
  pkg,
  screenId,
  onNavigate,
  hiddenSections = [],
  watermark = true,
  standalone = false,
}: {
  pkg: PitchPackage;
  screenId: string;
  onNavigate?: (id: string) => void;
  hiddenSections?: string[];
  watermark?: boolean;
  /** true on the public link, where the page is the site rather than a preview */
  standalone?: boolean;
}) {
  const screen = pkg.screens.find((x) => x.id === screenId) ?? pkg.screens[0];
  const go = (target: string) => {
    if (target === 'whatsapp' || !onNavigate) return;
    onNavigate(target);
  };

  return (
    <div className={`${s.site} ${s.shell} ${standalone ? s.standalone : ''}`} style={{ ['--acc' as string]: pkg.theme.accent }}>
      <header className={s.nav}>
        <span className={s.logo}>{pkg.business.name}</span>
        <nav className={s.navLinks}>
          {pkg.screens.map((x) => (
            <button key={x.id} data-current={x.id === screen.id} onClick={() => go(x.id)}>
              {x.name}
            </button>
          ))}
        </nav>
        <button className={s.navCta} onClick={() => go(pkg.primaryCta.target)}>
          {pkg.primaryCta.label}
        </button>
      </header>

      {screen.sections
        .filter((section) => !hiddenSections.includes(sectionKey(screen.id, section)))
        .map((section, i) => (
          <SectionBlock key={`${screen.id}-${i}`} section={section} pkg={pkg} onNavigate={go} />
        ))}

      <footer className={s.footer}>
        <span>
          {pkg.business.name}, {pkg.business.industry.toLowerCase()}
        </span>
        {watermark ? <span className={s.watermark}>Built with Scaffold</span> : null}
      </footer>

      <button className={s.whatsapp} onClick={() => go('whatsapp')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.7-5.4A8.5 8.5 0 1 1 21 11.5Z" />
        </svg>
        {pkg.business.whatsapp}
      </button>
    </div>
  );
}

export const sectionKey = (screenId: string, section: Section) => `${screenId}:${section.kind}`;

function SectionBlock({
  section,
  pkg,
  onNavigate,
}: {
  section: Section;
  pkg: PitchPackage;
  onNavigate: (t: string) => void;
}) {
  switch (section.kind) {
    case 'hero':
      return (
        <section className={s.hero}>
          <h2>{section.headline}</h2>
          <p>{section.subhead}</p>
          <div className={s.heroRow}>
            <button className={s.btn} onClick={() => onNavigate(section.primaryTarget)}>
              {section.primaryLabel}
            </button>
            {section.secondaryLabel ? (
              <button className={`${s.btn} ${s.btnAlt}`} onClick={() => onNavigate('whatsapp')}>
                {section.secondaryLabel}
              </button>
            ) : null}
          </div>
        </section>
      );

    case 'featureGrid':
      return (
        <section className={s.grid} style={{ ['--cols' as string]: String(section.items.length) }}>
          {section.items.map((item) => (
            <div className={s.gridCell} key={item.title}>
              <ProtoIcon name={item.iconName as ProtoIconName} />
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </section>
      );

    case 'priceList':
      return (
        <section className={s.list}>
          {section.title ? <p className={s.listTitle}>{section.title}</p> : null}
          {section.items.map((item) => (
            <div className={s.row} key={item.name}>
              <div>
                <h4>{item.name}</h4>
                <p>{item.detail}</p>
              </div>
              <span className={s.price}>{item.price}</span>
            </div>
          ))}
        </section>
      );

    case 'galleryStrip':
      return (
        <section className={s.grid} style={{ ['--cols' as string]: String(Math.min(3, section.captions.length)) }}>
          {section.captions.map((caption) => (
            <div className={s.gridCell} key={caption}>
              <h4>{caption}</h4>
              <p>Photo from the last job.</p>
            </div>
          ))}
        </section>
      );

    case 'contact':
      return (
        <section className={s.form}>
          <h3>{section.headline}</h3>
          {section.fields.map((f) => (
            <div className={s.fakeInput} key={f}>
              {f}
            </div>
          ))}
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <button className={s.btn} onClick={() => onNavigate('whatsapp')}>
              {section.submitLabel}
            </button>
            <span className={s.phone}>{pkg.business.whatsapp}</span>
          </div>
        </section>
      );

    case 'callStrip':
      return (
        <section className={s.strip}>
          <p>{section.message}</p>
          <span className={s.phone}>{pkg.business.whatsapp}</span>
        </section>
      );
  }
}
