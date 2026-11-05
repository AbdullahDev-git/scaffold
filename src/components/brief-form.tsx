'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createPitchAction, type ActionState } from '@/lib/actions';
import { Bolt, Mic, Stop, Type } from './icons';
import { GenerationSequence } from './generation-sequence';
import { UpgradeDialog } from './upgrade-dialog';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

const INDUSTRIES = [
  'Cafe', 'Restaurant', 'Auto workshop', 'Dental clinic', 'Fitness studio', 'Interior design',
  'Legal services', 'Tailoring', 'Landscaping', 'Salon', 'Photography', 'Real estate',
];

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function BriefForm({ credits }: { credits: number }) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(createPitchAction, {});
  const [mode, setMode] = useState<'type' | 'voice'>('type');
  const [brief, setBrief] = useState('');
  const [clientName, setClientName] = useState('');
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [captured, setCaptured] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const noCredits = state.error === 'no-credits';

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setRecording(false);
          setCaptured(false);
        }
      };

      recognitionRef.current.onend = () => {
        if (recording) {
          recognitionRef.current?.start();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!recording) {
      if (timer.current) clearInterval(timer.current);
      recognitionRef.current?.stop();
      return;
    }
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    recognitionRef.current?.start();
    return () => {
      if (timer.current) clearInterval(timer.current);
      recognitionRef.current?.stop();
    };
  }, [recording]);

  const bars = Array.from({ length: 92 }, (_, i) => 6 + Math.round(Math.abs(Math.sin(i * 1.7)) * 22));

  return (
    <>
      <UpgradeDialog open={noCredits} onOpenChange={() => undefined} />

      <form action={action} className="form-col">
        <GenerationSequence pending={isPending} clientName={clientName} />
        <input type="hidden" name="mode" value={mode} />

        <div className="pair">
          <label className="field">
            <span className="field-label">Client name</span>
            <input
              className="input"
              name="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Karma Coffee House"
            />
            {state.fieldErrors?.clientName ? <span className="field-error">{state.fieldErrors.clientName[0]}</span> : null}
          </label>
          <label className="field">
            <span className="field-label">Industry</span>
            <select className="select" name="industry" defaultValue="Cafe">
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="seg" role="tablist" aria-label="Brief input mode">
          <button type="button" role="tab" aria-selected={mode === 'type'} data-selected={mode === 'type'} onClick={() => setMode('type')}>
            <Type />
            Type a brief
          </button>
          <button type="button" role="tab" aria-selected={mode === 'voice'} data-selected={mode === 'voice'} onClick={() => setMode('voice')}>
            <Mic />
            Record voice
          </button>
        </div>

        <div className="mt-5">
          {mode === 'type' ? (
            <label className="field">
              <span className="field-label">Brief</span>
              <textarea
                className="textarea"
                name="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Small speciality coffee shop on Ferozepur Road. Wants online table booking, a menu page and bulk orders for offices. No website today, only Instagram."
              />
              {state.fieldErrors?.brief ? (
                <span className="field-error">{state.fieldErrors.brief[0]}</span>
              ) : (
                <span className="field-hint">Two or three sentences is enough. Include what they sell and what they want people to do.</span>
              )}
            </label>
          ) : (
            <>
              <input type="hidden" name="brief" value={transcript || (captured ? '' : '')} />
              {!speechSupported && (
                <div className="mb-4 p-3 rounded border border-amber-500/30 bg-amber-500/5 text-amber-600 text-sm">
                  Voice recording not supported in this browser. Use Chrome, Edge, or Safari.
                </div>
              )}
              <div className="rec">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="rec-btn"
                    data-recording={recording}
                    aria-label={recording ? 'Stop recording' : 'Start recording'}
                    onClick={() => {
                      if (recording) {
                        setRecording(false);
                        setCaptured(true);
                      } else {
                        setSecs(0);
                        setCaptured(false);
                        setTranscript('');
                        setRecording(true);
                      }
                    }}
                    disabled={!speechSupported}
                  >
                    {recording ? <Stop /> : <Mic />}
                  </button>
                  <div>
                    <div className="rec-time" data-live={recording}>
                      {fmt(secs)}
                    </div>
                    <div className="muted mt-0.5 text-[13.5px]">
                      {recording
                        ? 'Recording. Tap to stop.'
                        : captured
                        ? 'Recording captured. Tap to record again.'
                        : 'Tap to record. Speak the brief as you would to the client.'}
                    </div>
                  </div>
                </div>
                <div className="wave" data-live={recording}>
                  {bars.map((h, i) => (
                    <i key={i} style={{ ['--h' as string]: `${h}px`, animationDelay: `${(i % 9) * 0.08}s` }} />
                  ))}
                </div>
              </div>
              {transcript ? (
                <div className="border border-t-0 border-[color:var(--hairline)] px-[18px] py-4 text-sm leading-relaxed muted">
                  <b className="font-normal text-[color:var(--paper)]">Transcript.</b> {transcript}
                </div>
              ) : null}
              {state.fieldErrors?.brief ? <span className="field-error mt-2">Record the brief before generating.</span> : null}
            </>
          )}
        </div>

        <Submit recording={recording} credits={credits} pending={isPending} />
      </form>
    </>
  );
}

function Submit({ recording, credits, pending }: { recording: boolean; credits: number; pending: boolean }) {
  return (
    <div className="mt-[26px] flex items-center gap-4">
      <button className="btn btn-primary btn-lg" disabled={recording || pending || credits <= 0}>
        <Bolt />
        {pending ? 'Generating' : 'Generate pitch'}
      </button>
      <span className="readout">
        {credits <= 0 ? (
          'No credits left this month.'
        ) : recording ? (
          'Stop the recording first.'
        ) : (
          <>
            Uses <span className="n">1</span> credit. Takes about <span className="n">10</span> seconds.
          </>
        )}
      </span>
    </div>
  );
}
