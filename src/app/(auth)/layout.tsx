import Link from 'next/link';
import { Mark } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-left">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
          <Mark className="h-6 w-6" />
          <span>Scaffold</span>
        </Link>

        <div className="mt-auto max-w-[420px]">
          <h1 className="text-[30px] font-semibold leading-[1.18] tracking-[-0.025em]">
            Turn a two-line brief into a clickable prototype before the client changes their mind.
          </h1>
          <p className="muted mt-3.5 text-[15px] leading-relaxed">
            Built for freelance developers who pitch local businesses and refuse to build free samples.
          </p>
          <ul className="auth-facts mt-[34px] flex flex-col gap-3 border-t border-[color:var(--hairline)] pt-[22px]">
            <li>
              <span className="n">52s</span>
              <span>average time from brief to a sendable link</span>
            </li>
            <li>
              <span className="n">3</span>
              <span>screens in every prototype, wired and clickable</span>
            </li>
            <li>
              <span className="n">5</span>
              <span>free pitches a month, no card needed</span>
            </li>
          </ul>
        </div>

        <div className="muted mt-auto pt-[34px] text-[12.5px]">Scaffold 2026. Made for people who bill by the project.</div>
      </div>

      <div className="auth-right">
        <div className="auth-form">{children}</div>
      </div>
    </div>
  );
}
