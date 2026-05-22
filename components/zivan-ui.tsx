"use client";

import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { getScore, getUserVote } from "@/lib/zivan-store";
import type { VoteTargetType, VoteValue, ZivanState, ZivanUser } from "@/lib/zivan-types";

export function Avatar({
  user,
  label,
  value,
  size = "md",
}: {
  user?: ZivanUser;
  label?: string;
  value?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const text = label || user?.username || "Z";
  const fill = value || user?.avatar || "linear-gradient(135deg, #8b5cf6, #312e81)";
  const sizeClass = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-20 w-20 text-xl",
  }[size];

  if (fill.startsWith("http")) {
    return <img src={fill} alt={text} className={`${sizeClass} rounded-full object-cover ring-2 ring-zivan-line`} />;
  }

  return (
    <span
      aria-label={text}
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full font-black uppercase tracking-wide text-violet-50 ring-2 ring-zivan-line`}
      style={{ background: fill }}
    >
      {initials(text)}
    </span>
  );
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" role="presentation">
      <div
        className={`zivan-card max-h-[92vh] w-full overflow-hidden ${wide ? "max-w-3xl" : "max-w-lg"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="zivan-modal-title"
      >
        <div className="flex items-center justify-between border-b border-zivan-line px-5 py-4">
          <h2 id="zivan-modal-title" className="text-lg font-bold text-violet-50">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="zivan-focus inline-flex h-9 w-9 items-center justify-center rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 transition hover:border-violet-400 hover:text-violet-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-73px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`zivan-focus inline-flex items-center justify-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-bold text-violet-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`zivan-focus inline-flex items-center justify-center gap-2 rounded-full border border-zivan-line bg-zivan-panel2 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-400 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  help,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helpId = help ? `${inputId}-help` : undefined;
  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-violet-100">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={helpId}
        className="zivan-focus w-full rounded-lg border border-zivan-line bg-black/30 px-3 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/45 transition hover:border-violet-500"
        {...props}
      />
      {help ? (
        <span id={helpId} className="mt-1.5 block text-xs text-violet-200/65">
          {help}
        </span>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  help,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; help?: string }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helpId = help ? `${inputId}-help` : undefined;
  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-violet-100">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-describedby={helpId}
        className="zivan-focus min-h-28 w-full resize-y rounded-lg border border-zivan-line bg-black/30 px-3 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/45 transition hover:border-violet-500"
        {...props}
      />
      {help ? (
        <span id={helpId} className="mt-1.5 block text-xs text-violet-200/65">
          {help}
        </span>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  children,
  id,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-violet-100">
        {label}
      </label>
      <select
        id={inputId}
        className="zivan-focus w-full rounded-lg border border-zivan-line bg-black/30 px-3 py-2.5 text-sm text-violet-50 transition hover:border-violet-500"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="zivan-card flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 h-3 w-24 rounded-full bg-violet-500/40" />
      <h3 className="text-xl font-bold text-violet-50">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-violet-200/70">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="zivan-card flex items-center gap-3 px-5 py-4 text-violet-100">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm font-semibold">Loading Zivan...</span>
      </div>
    </div>
  );
}

export function VoteButtons({
  state,
  sessionUserId,
  targetType,
  targetId,
  onVote,
  compact = false,
}: {
  state: ZivanState;
  sessionUserId?: string;
  targetType: VoteTargetType;
  targetId: string;
  onVote: (value: VoteValue) => void;
  compact?: boolean;
}) {
  const score = getScore(state, targetType, targetId);
  const vote = getUserVote(state, sessionUserId, targetType, targetId);
  return (
    <div className={`flex ${compact ? "flex-row items-center gap-1" : "flex-col items-center gap-1"}`}>
      <button
        type="button"
        onClick={() => onVote(1)}
        className={`zivan-focus rounded-full p-1 transition hover:bg-violet-500/15 ${vote === 1 ? "text-violet-300" : "text-violet-200/65"}`}
        aria-label={`Upvote ${targetType}`}
      >
        <ChevronUp className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="min-w-8 text-center text-xs font-black text-violet-50">{formatNumber(score)}</span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        className={`zivan-focus rounded-full p-1 transition hover:bg-violet-500/15 ${vote === -1 ? "text-violet-300" : "text-violet-200/65"}`}
        aria-label={`Downvote ${targetType}`}
      >
        <ChevronDown className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function CommunityLink({ name, className = "" }: { name: string; className?: string }) {
  return (
    <Link href={`/z/${name}`} className={`zivan-focus rounded text-sm font-bold text-violet-100 hover:text-violet-300 ${className}`}>
      z/{name}
    </Link>
  );
}

export function UserLink({ username, className = "" }: { username: string; className?: string }) {
  return (
    <Link href={`/u/${username}`} className={`zivan-focus rounded text-sm font-medium text-violet-200/70 hover:text-violet-100 ${className}`}>
      u/{username}
    </Link>
  );
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function initials(value: string) {
  return value
    .split(/[_\s-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
