"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { encode } from "uqr";
import { getExercise } from "@/lib/exercises";
import {
  canNativeShare,
  copyText,
  decodePlans,
  extractCode,
  importShared,
  nativeShare,
  newOnly,
  planFingerprint,
  shareUrl,
  type SharedPlan,
} from "@/lib/share";
import { formatDuration, type WorkoutPlan } from "@/lib/store";
import { Icon, Modal } from "./ui";

/** QR code as crisp SVG – always dark on white so phone cameras can read it in dark mode too. */
function QrCode({ value, label }: { value: string; label: string }) {
  const { size, path } = useMemo(() => {
    const qr = encode(value, { ecc: "L", border: 2 });
    let d = "";
    qr.data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`;
      }),
    );
    return { size: qr.size, path: d };
  }, [value]);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="w-full max-w-[280px] aspect-square rounded-2xl bg-white"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}

function ShareDialog({ url, title, count, onClose }: { url: string; title: string; count: number; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const native = useMemo(() => canNativeShare(), []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    if (await copyText(url)) setCopied(true);
    else setShowLink(true);
  };

  return (
    <Modal open onClose={onClose} title={count > 1 ? `Share ${count} workouts` : "Share workout"}>
      <div className="flex flex-col items-center gap-4">
        <QrCode value={url} label={`QR code for ${title}`} />
        <p className="text-sm text-muted text-center">
          Scan with your other device&apos;s camera, or send the link. No account needed – the workout is stored in the
          link itself.
        </p>
        <div className="flex w-full gap-2">
          {native && (
            <button
              onClick={() => void nativeShare(url, title)}
              className="flex-1 rounded-xl bg-accent hover:bg-accent-strong text-black py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Icon.Share width={18} height={18} /> Share…
            </button>
          )}
          <button
            onClick={copy}
            className={`flex-1 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 ${
              native ? "bg-surface-2 hover:text-ink" : "bg-accent hover:bg-accent-strong text-black"
            }`}
          >
            {copied ? <Icon.Check width={18} height={18} /> : <Icon.Copy width={18} height={18} />}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
        {showLink && (
          <textarea
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            rows={4}
            className="w-full rounded-xl bg-surface-2 border border-line p-3 text-xs font-mono break-all"
          />
        )}
      </div>
    </Modal>
  );
}

/** Builds a share link for some plans and shows it as QR code + copy / share actions. */
export function useShareLink() {
  const [state, setState] = useState<{ url: string; title: string; count: number } | null>(null);

  const share = useCallback(async (plans: WorkoutPlan[], title: string) => {
    if (!plans.length) return;
    setState({ url: await shareUrl(plans), title, count: plans.length });
  }, []);

  const dialog = state && <ShareDialog {...state} onClose={() => setState(null)} />;
  return { share, dialog };
}

export function SharePlanButton({ plan }: { plan: WorkoutPlan }) {
  const { share, dialog } = useShareLink();
  return (
    <>
      <button
        onClick={() => share([plan], plan.name)}
        className="p-3 rounded-xl bg-surface-2 text-muted hover:text-ink"
        aria-label="Share"
        title="Share"
      >
        <Icon.Share />
      </button>
      {dialog}
    </>
  );
}

function SharedPlanRow({ plan, isNew }: { plan: SharedPlan; isNew: boolean }) {
  const amrap = plan.format === "amrap";
  return (
    <li className={`rounded-2xl border border-line p-3 ${isNew ? "bg-surface-2" : "opacity-60"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{plan.name}</span>
        {!isNew && <span className="shrink-0 text-xs text-muted">already on this device</span>}
      </div>
      <div className="mt-1 text-xs text-muted">
        {plan.items.length} exercises ·{" "}
        {amrap ? `AMRAP ${formatDuration(plan.timeCap ?? 0)} min` : `${plan.rounds} rounds`}
      </div>
      <div className="mt-1 text-xs text-muted line-clamp-2">
        {plan.items.map((i) => getExercise(i.exerciseId).name).join(" · ")}
      </div>
    </li>
  );
}

function Toast({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="animate-fade-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink text-bg px-5 py-3 text-sm font-semibold shadow-lg"
    >
      {children}
    </div>
  );
}

/**
 * Picks up share links (`/app#w=…`) when the app is opened with one, and offers a
 * "paste link" import – needed e.g. for iOS home-screen apps, whose storage is separate from Safari.
 */
export function ImportShared({ pasteOpen, onClosePaste }: { pasteOpen: boolean; onClosePaste: () => void }) {
  const [pending, setPending] = useState<SharedPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");

  const load = useCallback(async (code: string) => {
    const plans = await decodePlans(code);
    if (plans) {
      setError(null);
      setPending(plans);
      return true;
    }
    setError("This link doesn't contain a valid workout – it may be incomplete.");
    return false;
  }, []);

  // incoming link
  useEffect(() => {
    const check = () => {
      const code = extractCode(window.location.hash);
      if (!code) return;
      // drop the payload from the address bar so a reload doesn't ask again
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
      void load(code);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const closePaste = () => {
    setPasted("");
    setError(null);
    onClosePaste();
  };

  const submitPaste = async () => {
    const code = extractCode(pasted);
    if (!code) {
      setError("That doesn't look like a workout link.");
      return;
    }
    if (await load(code)) closePaste();
  };

  const fresh = pending ? new Set(newOnly(pending).map(planFingerprint)) : new Set<string>();
  const close = () => {
    setPending(null);
    setError(null);
  };

  return (
    <>
      <Modal
        open={pending !== null}
        onClose={close}
        title={pending && pending.length > 1 ? `Import ${pending.length} workouts` : "Import workout"}
      >
        <ul className="flex flex-col gap-2">
          {pending?.map((p, i) => (
            <SharedPlanRow key={i} plan={p} isNew={fresh.has(planFingerprint(p))} />
          ))}
        </ul>
        <div className="mt-5 flex gap-2">
          <button onClick={close} className="flex-1 rounded-xl bg-surface-2 py-3 font-semibold text-muted hover:text-ink">
            Cancel
          </button>
          <button
            onClick={() => {
              const n = pending ? importShared(pending) : 0;
              close();
              setToast(n ? `Added ${n} workout${n === 1 ? "" : "s"}` : "Nothing new to add");
            }}
            disabled={fresh.size === 0}
            className="flex-1 rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-40 text-black py-3 font-semibold"
          >
            {fresh.size === 0 ? "Already added" : `Add ${fresh.size === 1 ? "workout" : `${fresh.size} workouts`}`}
          </button>
        </div>
      </Modal>

      <Modal open={pasteOpen} onClose={closePaste} title="Import from link">
        <p className="text-sm text-muted mb-3">
          Paste a workout link you shared from another device. Nothing is uploaded – the workout is stored in the link
          itself.
        </p>
        <textarea
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            setError(null);
          }}
          rows={4}
          autoFocus
          placeholder="https://…/app#w=…"
          className="w-full rounded-xl bg-surface-2 border border-line p-3 text-xs font-mono break-all"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button
          onClick={submitPaste}
          disabled={!pasted.trim()}
          className="mt-4 w-full rounded-xl bg-accent hover:bg-accent-strong disabled:opacity-40 text-black py-3 font-semibold"
        >
          Continue
        </button>
      </Modal>

      {error && !pasteOpen && pending === null && (
        <Modal open onClose={() => setError(null)} title="Couldn't import">
          <p className="text-sm text-muted">{error}</p>
        </Modal>
      )}
      {toast && <Toast>{toast}</Toast>}
    </>
  );
}
