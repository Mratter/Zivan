"use client";

import { Check, Image as ImageIcon, Link as LinkIcon, Lock, Megaphone, MessageSquare, Radio, Rows3, Shield, Sparkles, Trash2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ZIVAN_TOPICS } from "@/lib/zivan-seed";
import { getUserById, validateCommunityName } from "@/lib/zivan-store";
import type { PostType, Privacy, ZivanCommunity, ZivanUser } from "@/lib/zivan-types";
import { useZivan } from "./zivan-provider";
import { Avatar, CommunityLink, EmptyState, Modal, PrimaryButton, SecondaryButton, SelectField, TextArea, TextField } from "./zivan-ui";

const topics = ZIVAN_TOPICS;
const flairs = ["Discussion", "Question", "News", "Showcase", "Build Log", "Feedback", "Guide", "Official"];
const postTypeOptions: Array<{ key: PostType; icon: LucideIcon; label: string }> = [
  { key: "text", icon: Rows3, label: "Text" },
  { key: "link", icon: LinkIcon, label: "Link" },
  { key: "image", icon: ImageIcon, label: "Image" },
];
const privacyOptions: Array<{ key: Privacy; icon: LucideIcon; copy: string }> = [
  { key: "Public", icon: Users, copy: "Anyone can view, post, and comment." },
  { key: "Restricted", icon: Shield, copy: "Anyone can view, but only approved users can contribute." },
  { key: "Private", icon: Lock, copy: "Only approved members can view and contribute." },
];

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { actions, setToast } = useZivan();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result =
      mode === "sign-in"
        ? actions.signIn({ identifier, password })
        : actions.signUp({ email, username, password, confirmPassword });
    if (result.ok) {
      setToast(mode === "sign-in" ? "Welcome back to Zivan." : "Your Zivan account is ready.");
      onClose();
    } else {
      setError(result.message);
    }
  }

  return (
    <Modal title={mode === "sign-in" ? "Sign in to Zivan" : "Create your Zivan account"} onClose={onClose}>
      <div className="mb-5 grid grid-cols-2 rounded-full border border-zivan-line bg-black/25 p-1">
        {[
          ["sign-in", "Sign in"],
          ["sign-up", "Sign up"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMode(key as "sign-in" | "sign-up");
              setError("");
            }}
            className={`zivan-focus rounded-full px-3 py-2 text-sm font-bold transition ${
              mode === key ? "bg-violet-500 text-violet-950" : "text-violet-200/70 hover:text-violet-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "sign-in" ? (
          <TextField
            label="Username or email"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
            placeholder="zivan_admin"
            help="Seed accounts use password zivan123."
          />
        ) : (
          <>
            <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" />
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              placeholder="lowercase_name"
              help="Use 3-20 lowercase letters, numbers, or underscores."
            />
          </>
        )}

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
          minLength={8}
        />

        {mode === "sign-up" ? (
          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        ) : null}

        {mode === "sign-in" ? (
          <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-3 py-2.5">
            <span className="text-sm font-semibold text-violet-100">Remember me on this device</span>
            <input className="h-5 w-5 accent-violet-400" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          </label>
        ) : null}

        {error ? <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{error}</p> : null}
        <PrimaryButton className="w-full" type="submit">
          {mode === "sign-in" ? "Sign in" : "Sign up"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const { actions, setToast } = useZivan();
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result =
      mode === "sign-in"
        ? actions.signIn({ identifier, password })
        : actions.signUp({ email, username, password, confirmPassword });
    if (result.ok) {
      setToast(mode === "sign-in" ? "Welcome back to Zivan." : "Your Zivan account is ready.");
      router.push("/");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <section className="zivan-card p-5 sm:p-7">
        <h1 className="text-3xl font-black text-violet-50">{mode === "sign-in" ? "Sign in to Zivan" : "Create your Zivan account"}</h1>
        <p className="mt-2 text-sm leading-6 text-violet-200/70">
          {mode === "sign-in" ? "Use a seeded demo account or your saved local account." : "Sign up, join z/subzivan automatically, and start posting."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "sign-in" ? (
            <TextField
              label="Username or email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
              placeholder="zivan_admin"
              help="Seed accounts use password zivan123."
            />
          ) : (
            <>
              <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" />
              <TextField
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                placeholder="lowercase_name"
                help="Use 3-20 lowercase letters, numbers, or underscores."
              />
            </>
          )}
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
          {mode === "sign-up" ? (
            <TextField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          ) : (
            <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-3 py-2.5">
              <span className="text-sm font-semibold text-violet-100">Remember me on this device</span>
              <input className="h-5 w-5 accent-violet-400" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            </label>
          )}
          {error ? <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{error}</p> : null}
          <PrimaryButton className="w-full" type="submit">
            {mode === "sign-in" ? "Sign in" : "Sign up"}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-violet-200/65">
          {mode === "sign-in" ? (
            <>
              New here?{" "}
              <Link className="zivan-focus rounded font-bold text-violet-200 hover:text-violet-50" href="/signup">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link className="zivan-focus rounded font-bold text-violet-200 hover:text-violet-50" href="/signin">
                Sign in
              </Link>
            </>
          )}
        </p>
      </section>
    </div>
  );
}

export function CreatePostModal({
  sessionUser,
  defaultCommunity,
  onClose,
}: {
  sessionUser: ZivanUser;
  defaultCommunity?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { state, actions, setToast } = useZivan();
  const [type, setType] = useState<PostType>("text");
  const [communityName, setCommunityName] = useState(defaultCommunity || "subzivan");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [flair, setFlair] = useState("Discussion");
  const [mature, setMature] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = actions.createPost({
      authorId: sessionUser.id,
      communityName,
      type,
      title,
      body,
      url,
      imageUrl,
      flair,
      mature,
    });
    if (result.ok) {
      setToast("Post created.");
      onClose();
      router.push(`/z/${result.post.communityName}/comments/${result.post.id}`);
    } else {
      setError(result.message);
    }
  }

  return (
    <Modal title="Create a post" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {postTypeOptions.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key as PostType)}
              className={`zivan-focus flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                type === key ? "border-violet-400 bg-violet-500/20 text-violet-50" : "border-zivan-line bg-black/20 text-violet-200/70 hover:border-violet-500"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Community" value={communityName} onChange={(event) => setCommunityName(event.target.value)}>
            {state.communities.map((community) => (
              <option key={community.id} value={community.name}>
                z/{community.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Flair" value={flair} onChange={(event) => setFlair(event.target.value)}>
            {flairs.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Write a clear title" />

        {type === "text" ? (
          <TextArea label="Body" value={body} onChange={(event) => setBody(event.target.value)} required placeholder="Share the details..." />
        ) : null}
        {type === "link" ? (
          <>
            <TextField label="Link URL" value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://example.com" />
            <TextArea label="Context" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Why is this worth discussing?" />
          </>
        ) : null}
        {type === "image" ? (
          <>
            <div className="space-y-2">
              <TextField label="Image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} required placeholder="https://images.example/photo.jpg" />
              <SecondaryButton
                onClick={() => setImageUrl("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80")}
              >
                Use demo upload placeholder
              </SecondaryButton>
            </div>
            <TextArea label="Caption" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add context for the image." />
          </>
        ) : null}

        <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-4 py-3">
          <span>
            <span className="block text-sm font-bold text-violet-50">Mature 18+</span>
            <span className="text-xs text-violet-200/60">Mark sensitive or adult-oriented posts.</span>
          </span>
          <input className="h-5 w-5 accent-violet-400" type="checkbox" checked={mature} onChange={(event) => setMature(event.target.checked)} />
        </label>

        {error ? <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Create post</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

export function CreatePostPage({ defaultCommunity }: { defaultCommunity?: string }) {
  const router = useRouter();
  const { state, actions, setToast } = useZivan();
  const sessionUser = getUserById(state, state.sessionUserId);
  const [type, setType] = useState<PostType>("text");
  const [communityName, setCommunityName] = useState(defaultCommunity || "subzivan");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [flair, setFlair] = useState("Discussion");
  const [mature, setMature] = useState(false);
  const [error, setError] = useState("");

  if (!sessionUser) {
    return (
      <EmptyState
        title="Sign in to create a post"
        body="Posts are attached to your Zivan profile and community reputation."
        action={
          <Link href="/signin" className="zivan-focus rounded-full bg-violet-500 px-4 py-2 text-sm font-bold text-violet-950 hover:bg-violet-300">
            Sign in
          </Link>
        }
      />
    );
  }
  const currentUser = sessionUser;

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = actions.createPost({
      authorId: currentUser.id,
      communityName,
      type,
      title,
      body,
      url,
      imageUrl,
      flair,
      mature,
    });
    if (result.ok) {
      setToast("Post created.");
      router.push(`/z/${result.post.communityName}/comments/${result.post.id}`);
    } else {
      setError(result.message);
    }
  }

  return (
    <section className="zivan-card mx-auto max-w-3xl p-5">
      <h1 className="text-3xl font-black text-violet-50">Create a post</h1>
      <p className="mt-2 text-sm text-violet-200/70">Choose a community, post type, flair, and publish straight to a Zivan discussion.</p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {postTypeOptions.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key as PostType)}
              className={`zivan-focus flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition ${
                type === key ? "border-violet-400 bg-violet-500/20 text-violet-50" : "border-zivan-line bg-black/20 text-violet-200/70 hover:border-violet-500"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Community" value={communityName} onChange={(event) => setCommunityName(event.target.value)}>
            {state.communities.map((community) => (
              <option key={community.id} value={community.name}>
                z/{community.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Flair" value={flair} onChange={(event) => setFlair(event.target.value)}>
            {flairs.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Write a clear title" />
        {type === "text" ? <TextArea label="Body" value={body} onChange={(event) => setBody(event.target.value)} required placeholder="Share the details..." /> : null}
        {type === "link" ? (
          <>
            <TextField label="Link URL" value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://example.com" />
            <TextArea label="Context" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Why is this worth discussing?" />
          </>
        ) : null}
        {type === "image" ? (
          <>
            <div className="space-y-2">
              <TextField label="Image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} required placeholder="https://images.example/photo.jpg" />
              <SecondaryButton
                onClick={() => setImageUrl("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80")}
              >
                Use demo upload placeholder
              </SecondaryButton>
            </div>
            <TextArea label="Caption" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add context for the image." />
          </>
        ) : null}
        <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-4 py-3">
          <span>
            <span className="block text-sm font-bold text-violet-50">Mature 18+</span>
            <span className="text-xs text-violet-200/60">Mark sensitive or adult-oriented posts.</span>
          </span>
          <input className="h-5 w-5 accent-violet-400" type="checkbox" checked={mature} onChange={(event) => setMature(event.target.checked)} />
        </label>
        {error ? <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{error}</p> : null}
        <div className="flex justify-end">
          <PrimaryButton type="submit">Create post</PrimaryButton>
        </div>
      </form>
    </section>
  );
}

export function CreateCommunityWizard({
  sessionUser,
  onClose,
}: {
  sessionUser: ZivanUser;
  onClose: () => void;
}) {
  const router = useRouter();
  const { state, actions, setToast } = useZivan();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("Public");
  const [mature, setMature] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdName, setCreatedName] = useState("");
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [error, setError] = useState("");
  const nameStatus = useMemo(() => validateCommunityName(name, state.communities), [name, state.communities]);

  function submit() {
    setError("");
    const result = actions.createCommunity({
      creatorId: sessionUser.id,
      name,
      topic,
      description,
      privacy,
      mature,
    });
    if (result.ok) {
      setCreatedName(result.community.name);
      setToast("You launched a new Zivan community!");
    } else {
      setError(result.message);
    }
  }

  return (
    <Modal title={createdName ? "Community launched" : "Create a community"} onClose={onClose} wide>
      {createdName ? (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-lg border border-violet-400/50 bg-[radial-gradient(circle_at_25%_0%,rgba(196,181,253,0.35),transparent_16rem),linear-gradient(135deg,rgba(139,92,246,0.24),rgba(0,0,0,0.3))] p-5 text-center">
            <span className="absolute left-8 top-5 h-2 w-8 rotate-12 rounded-full bg-violet-300/70" />
            <span className="absolute right-10 top-8 h-2 w-6 -rotate-12 rounded-full bg-fuchsia-300/60" />
            <span className="absolute bottom-6 left-1/3 h-2 w-10 -rotate-6 rounded-full bg-violet-500/80" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-400 text-violet-950">
              <Check className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-black text-violet-50">You launched a new Zivan community!</h3>
            <p className="mt-2 text-sm text-violet-200/75">z/{createdName} is ready for rules, posts, and members.</p>
          </div>
          <div className="rounded-lg border border-zivan-line bg-black/20 p-4">
            <div className="mb-3 h-20 rounded-lg" style={{ background: "linear-gradient(135deg, #09090b, #4c1d95 52%, #18181b)" }} />
            <Avatar label={createdName} size="lg" />
            <h3 className="mt-3 text-lg font-black text-violet-50">z/{createdName}</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300/70">{topic}</p>
            <p className="mt-3 text-sm leading-6 text-violet-200/75">{description}</p>
          </div>
          {showNextSteps ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {["Write the first welcome post", "Invite trusted members", "Add two more rules"].map((item) => (
                <div key={item} className="rounded-lg border border-zivan-line bg-black/20 p-4 text-sm font-semibold text-violet-100">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <SecondaryButton onClick={() => setShowNextSteps((value) => !value)}>View Next Steps</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                onClose();
                router.push(`/z/${createdName}`);
              }}
            >
              Go to Community Page
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center gap-2" aria-label="Create community progress">
            {[1, 2, 3].map((item) => (
              <span key={item} className={`h-2.5 w-2.5 rounded-full ${step === item ? "bg-violet-300" : "bg-zivan-line"}`} />
            ))}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-violet-50">What will your community be about?</h3>
                <p className="mt-2 text-sm text-violet-200/75">Pick one starting topic. You can evolve it later as the community finds its voice.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topics.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    className={`zivan-focus rounded-full border px-3 py-2 text-sm font-bold transition ${
                      topic === item ? "border-violet-300 bg-violet-500/25 text-violet-50" : "border-zivan-line bg-black/20 text-violet-200/70 hover:border-violet-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="mb-4">
                <h3 className="text-2xl font-black text-violet-50">What kind of community is this?</h3>
                <p className="mt-2 text-sm text-violet-200/75">Choose who can view, post, and comment.</p>
              </div>
              {privacyOptions.map(({ key, icon: Icon, copy }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPrivacy(key)}
                  className={`zivan-focus flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
                    privacy === key ? "border-violet-300 bg-violet-500/20" : "border-zivan-line bg-black/20 hover:border-violet-500"
                  }`}
                >
                  <Icon className="h-5 w-5 text-violet-200" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-violet-50">{key}</span>
                    <span className="text-sm text-violet-200/65">{copy}</span>
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${privacy === key ? "border-violet-300 bg-violet-400 text-violet-950" : "border-zivan-line"}`}>
                    {privacy === key ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Radio className="h-3.5 w-3.5 text-violet-300/50" aria-hidden="true" />}
                  </span>
                </button>
              ))}
              <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-4 py-3">
                <span>
                  <span className="block text-sm font-bold text-violet-50">Mature 18+</span>
                  <span className="text-xs text-violet-200/60">Useful for adult themes, intense topics, or sensitive discussion.</span>
                </span>
                <input className="h-5 w-5 accent-violet-400" type="checkbox" checked={mature} onChange={(event) => setMature(event.target.checked)} />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-violet-50">Tell us about your community</h3>
                  <p className="mt-2 text-sm text-violet-200/75">Names use lowercase letters, numbers, and underscores only.</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-violet-100" htmlFor="community-name-input">
                    Community name
                  </label>
                  <div className="flex rounded-lg border border-zivan-line bg-black/30 transition focus-within:border-violet-400">
                    <span className="flex items-center border-r border-zivan-line px-3 text-sm font-black text-violet-300">z/</span>
                    <input
                      id="community-name-input"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="my_community"
                      className="zivan-focus min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/45"
                    />
                  </div>
                  <span className="mt-1.5 block text-xs text-violet-200/65">{name ? nameStatus.message : "3-21 lowercase letters, numbers, and underscores."}</span>
                </div>
                <TextArea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should members post here?" />
              </div>
              <div className="rounded-lg border border-zivan-line bg-black/20 p-4">
                <div className="mb-3 h-20 rounded-lg" style={{ background: "linear-gradient(135deg, #09090b, #4c1d95 52%, #18181b)" }} />
                <Avatar label={name || "new community"} size="lg" />
                <h3 className="mt-3 text-lg font-black text-violet-50">z/{name || "community_name"}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-300/70">{topic}</p>
                <p className="mt-3 text-sm leading-6 text-violet-200/75">{description || "Your description preview will appear here as you type."}</p>
              </div>
            </div>
          ) : null}

          {error ? <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{error}</p> : null}
          <div className="flex justify-between gap-3">
            <SecondaryButton onClick={() => (step === 1 ? onClose() : setStep((value) => value - 1))}>{step === 1 ? "Cancel" : "Back"}</SecondaryButton>
            {step < 3 ? (
              <PrimaryButton onClick={() => setStep((value) => value + 1)} disabled={step === 1 && !topic}>
                Next
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={submit} disabled={!nameStatus.valid || description.trim().length < 12}>
                Create Community
              </PrimaryButton>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function EditCommunityModal({
  community,
  sessionUser,
  onClose,
}: {
  community: ZivanCommunity;
  sessionUser: ZivanUser;
  onClose: () => void;
}) {
  const { actions, setToast } = useZivan();
  const [description, setDescription] = useState(community.description);
  const [avatar, setAvatar] = useState(community.avatar);
  const [banner, setBanner] = useState(community.banner);
  const [rules, setRules] = useState(community.rules.length ? community.rules : ["Be relevant"]);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = actions.editCommunity({
      userId: sessionUser.id,
      communityName: community.name,
      description,
      avatar,
      banner,
      rules,
    });
    if (result.ok) {
      setToast("Community settings updated.");
      onClose();
    } else {
      setError(result.message);
    }
  }

  return (
    <Modal title={`Moderation settings for z/${community.name}`} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <TextArea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
        <TextField label="Avatar image URL or gradient" value={avatar} onChange={(event) => setAvatar(event.target.value)} />
        <TextField label="Banner image URL or gradient" value={banner} onChange={(event) => setBanner(event.target.value)} />
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-violet-100">Rules</span>
            <SecondaryButton onClick={() => setRules((items) => [...items, ""])}>Add rule</SecondaryButton>
          </div>
          <div className="space-y-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex gap-2">
                <TextField
                  aria-label={`Rule ${index + 1}`}
                  label={`Rule ${index + 1}`}
                  value={rule}
                  onChange={(event) => setRules((items) => items.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                />
                <button
                  type="button"
                  onClick={() => setRules((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  className="zivan-focus mt-7 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 hover:border-violet-400"
                  aria-label={`Delete rule ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {error ? <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Save changes</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

export function UtilityModal({
  type,
  sessionUser,
  onClose,
}: {
  type: "messages" | "custom-feeds" | "promote" | "settings";
  sessionUser?: ZivanUser;
  onClose: () => void;
}) {
  const { state, setToast } = useZivan();
  const joined = sessionUser ? state.communities.filter((community) => community.memberIds.includes(sessionUser.id)) : [];

  return (
    <Modal title={type === "messages" ? "Messages" : type === "custom-feeds" ? "Custom feeds" : type === "promote" ? "Promote on Zivan" : "Settings"} onClose={onClose}>
      {type === "messages" ? (
        <div className="space-y-3">
          {[
            ["zivan_admin", "Thanks for the launch feedback. We are tracking compact mode next."],
            ["pixelmage", "Your design token reply was useful. Want to compare naming maps?"],
            ["nightowl", "I saved the terminal theme thread for later."],
          ].map(([from, body]) => (
            <div key={from} className="flex gap-3 rounded-lg border border-zivan-line bg-black/20 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-violet-50">u/{from}</p>
                <p className="text-sm leading-6 text-violet-200/70">{body}</p>
              </div>
            </div>
          ))}
          <PrimaryButton
            className="w-full"
            onClick={() => {
              setToast("Messages marked as reviewed.");
              onClose();
            }}
          >
            Mark all as reviewed
          </PrimaryButton>
        </div>
      ) : type === "custom-feeds" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-violet-200/70">Build a personal feed from communities you have joined.</p>
          {sessionUser && joined.length ? (
            <div className="grid gap-2">
              {joined.map((community) => (
                <div key={community.id} className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-3 py-2">
                  <CommunityLink name={community.name} />
                  <span className="text-xs text-violet-200/60">{community.topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-zivan-line bg-black/20 p-4 text-sm text-violet-200/70">Sign in and join communities to assemble a custom feed.</p>
          )}
          <PrimaryButton
            className="w-full"
            onClick={() => {
              setToast("Custom feed saved for this session.");
              onClose();
            }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Save custom feed
          </PrimaryButton>
        </div>
      ) : type === "promote" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-zivan-line bg-black/20 p-4">
            <Megaphone className="mb-3 h-6 w-6 text-violet-300" aria-hidden="true" />
            <h3 className="text-lg font-black text-violet-50">Promote a launch, community, or post</h3>
            <p className="mt-2 text-sm leading-6 text-violet-200/70">This demo records the intent and shows how a Zivan ad surface would fit without leaving the app.</p>
          </div>
          <TextField label="Campaign name" placeholder="Community launch spotlight" />
          <TextArea label="Goal" placeholder="What should people discover?" />
          <PrimaryButton
            className="w-full"
            onClick={() => {
              setToast("Promotion draft saved.");
              onClose();
            }}
          >
            Save promotion draft
          </PrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-4 py-3">
            <span>
              <span className="block text-sm font-bold text-violet-50">Compact feed density</span>
              <span className="text-xs text-violet-200/60">Keep rows tight for faster reading.</span>
            </span>
            <input className="h-5 w-5 accent-violet-400" type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-zivan-line bg-black/20 px-4 py-3">
            <span>
              <span className="block text-sm font-bold text-violet-50">Email digests</span>
              <span className="text-xs text-violet-200/60">Send weekly community summaries.</span>
            </span>
            <input className="h-5 w-5 accent-violet-400" type="checkbox" />
          </label>
          <PrimaryButton
            className="w-full"
            onClick={() => {
              setToast("Settings saved for this demo.");
              onClose();
            }}
          >
            Save settings
          </PrimaryButton>
        </div>
      )}
    </Modal>
  );
}
