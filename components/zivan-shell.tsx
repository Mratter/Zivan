"use client";

import {
  Bell,
  Bookmark,
  Compass,
  Home,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquarePlus,
  Newspaper,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, FormEvent, useCallback, useContext, useMemo, useState } from "react";
import {
  formatDate,
  formatRelativeTime,
  getCommentCount,
  getCommunityWeeklyStats,
  getCommunityPostCount,
  getReactionCount,
  getScore,
  getUserById,
  getUserReputation,
  sortPostsForView,
} from "@/lib/zivan-store";
import type { ZivanCommunity, ZivanUser } from "@/lib/zivan-types";
import { AuthModal, CreateCommunityWizard, CreatePostModal, EditCommunityModal, UtilityModal } from "./zivan-modals";
import { useZivan } from "./zivan-provider";
import { Avatar, CommunityLink, LoadingScreen, PrimaryButton, SecondaryButton, formatNumber } from "./zivan-ui";

type ModalName = "auth" | "post" | "community" | "messages" | "custom-feeds" | "edit-community" | "promote" | "settings";

interface ChromeContextValue {
  openAuth: () => void;
  openCreatePost: (communityName?: string) => void;
  openCreateCommunity: () => void;
  openMessages: () => void;
  openCustomFeeds: () => void;
  openEditCommunity: (community: ZivanCommunity) => void;
}

const ChromeContext = createContext<ChromeContextValue | undefined>(undefined);

export function useChromeActions() {
  const value = useContext(ChromeContext);
  if (!value) throw new Error("useChromeActions must be used inside ZivanShell.");
  return value;
}

export function ZivanShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, loading, toast, setToast, actions } = useZivan();
  const [modal, setModal] = useState<ModalName | "">("");
  const [modalCommunity, setModalCommunity] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const sessionUser = getUserById(state, state.sessionUserId);
  const query = searchParams.get("q") || "";
  const [searchText, setSearchText] = useState(query);
  const unread = sessionUser ? state.notifications.filter((item) => item.userId === sessionUser.id && !item.read).length : 0;

  const openCreatePost = useCallback((communityName?: string) => {
    if (!sessionUser) {
      setModal("auth");
      return;
    }
    setModalCommunity(communityName || "");
    setModal("post");
  }, [sessionUser]);

  const openCreateCommunity = useCallback(() => {
    if (!sessionUser) {
      setModal("auth");
      return;
    }
    setModal("community");
  }, [sessionUser]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = searchText.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  const chromeActions = useMemo<ChromeContextValue>(
    () => ({
      openAuth: () => setModal("auth"),
      openCreatePost,
      openCreateCommunity,
      openMessages: () => (sessionUser ? setModal("messages") : setModal("auth")),
      openCustomFeeds: () => setModal("custom-feeds"),
      openEditCommunity: (community) => {
        setModalCommunity(community.name);
        setModal("edit-community");
      },
    }),
    [openCreateCommunity, openCreatePost, sessionUser],
  );

  if (loading) return <LoadingScreen />;

  return (
    <ChromeContext.Provider value={chromeActions}>
      <div className="min-h-screen">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-zivan-line bg-zivan-ink/88 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileMenu((value) => !value)}
              className="zivan-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Link href="/" className="zivan-focus flex items-center gap-2 rounded-full pr-2" aria-label="Zivan home">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-lg font-black text-violet-950 shadow-violet">
                Z
              </span>
              <span className="hidden text-xl font-black tracking-tight text-violet-50 sm:block">Zivan</span>
            </Link>

            <form onSubmit={submitSearch} className="mx-auto flex min-w-0 flex-1 items-center lg:max-w-2xl">
              <label className="relative w-full">
                <span className="sr-only">Search Zivan</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-200/55" aria-hidden="true" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search Zivan"
                  className="zivan-focus h-11 w-full rounded-full border border-zivan-line bg-zivan-panel2/90 px-11 text-sm text-violet-50 placeholder:text-violet-200/45 transition hover:border-violet-500"
                />
              </label>
            </form>

            <button
              type="button"
              onClick={() => setModal("promote")}
              className="zivan-focus hidden h-10 w-10 items-center justify-center rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 transition hover:border-violet-400 lg:inline-flex"
              aria-label="Promote on Zivan"
            >
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => openCreatePost()}
              className="zivan-focus hidden items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-black text-violet-950 transition hover:bg-violet-300 sm:inline-flex"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create
            </button>
            <button
              type="button"
              onClick={() => (sessionUser ? setModal("messages") : setModal("auth"))}
              className="zivan-focus hidden h-10 w-10 items-center justify-center rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 transition hover:border-violet-400 md:inline-flex"
              aria-label="Messages"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!sessionUser) {
                    setModal("auth");
                    return;
                  }
                  setNotificationsOpen((value) => !value);
                  actions.markNotificationsRead(sessionUser.id);
                }}
                className="zivan-focus relative h-10 w-10 rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 transition hover:border-violet-400"
                aria-label="Notifications"
              >
                <Bell className="mx-auto h-4 w-4" aria-hidden="true" />
                {unread ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-400 px-1 text-[10px] font-black text-violet-950">
                    {unread}
                  </span>
                ) : null}
              </button>
              {notificationsOpen && sessionUser ? (
                <NotificationsDropdown user={sessionUser} onClose={() => setNotificationsOpen(false)} />
              ) : null}
            </div>
            {sessionUser ? (
              <div className="group relative">
                <button
                  type="button"
                  className="zivan-focus flex items-center gap-2 rounded-full border border-zivan-line bg-zivan-panel2 px-1.5 py-1.5 text-sm text-violet-50"
                  aria-label="Profile menu"
                >
                  <Avatar user={sessionUser} size="sm" />
                  <span className="hidden max-w-28 truncate pr-2 font-bold lg:block">{sessionUser.username}</span>
                </button>
                <div className="absolute right-0 top-12 hidden w-56 rounded-lg border border-zivan-line bg-zivan-panel p-2 shadow-violet group-focus-within:block group-hover:block">
                  <Link href={`/u/${sessionUser.username}`} className="zivan-focus flex rounded-md px-3 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/15">
                    View profile
                  </Link>
                  <Link href={`/u/${sessionUser.username}?tab=posts`} className="zivan-focus flex rounded-md px-3 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/15">
                    My posts
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModal("settings")}
                    className="zivan-focus flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-violet-500/15"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={actions.signOut}
                    className="zivan-focus flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-violet-500/15"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                  <button
                    type="button"
                    onClick={actions.resetDemo}
                    className="zivan-focus w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-violet-100 hover:bg-violet-500/15"
                  >
                    Reset demo data
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setModal("auth")}
                className="zivan-focus rounded-full border border-violet-400/70 bg-violet-500/15 px-4 py-2 text-sm font-black text-violet-100 transition hover:bg-violet-500/25"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {mobileMenu ? (
          <div className="fixed inset-x-3 top-20 z-30 rounded-lg border border-zivan-line bg-zivan-panel p-3 shadow-violet lg:hidden">
            <LeftSidebar sessionUser={sessionUser} activePath={pathname} onCreateCommunity={openCreateCommunity} onCustomFeeds={() => setModal("custom-feeds")} mobile />
          </div>
        ) : null}

        <div className="mx-auto grid max-w-[1440px] gap-5 px-3 pb-10 pt-20 sm:px-5 lg:grid-cols-[250px_minmax(0,1fr)_320px]">
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto pr-1 lg:block">
            <LeftSidebar sessionUser={sessionUser} activePath={pathname} onCreateCommunity={openCreateCommunity} onCustomFeeds={() => setModal("custom-feeds")} />
          </aside>
          <main className="min-w-0">
            {toast ? (
              <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-violet-400/50 bg-zivan-panel px-4 py-2 text-sm font-semibold text-violet-50 shadow-violet">
                {toast}
              </div>
            ) : null}
            {children}
          </main>
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto xl:block">{right || <DefaultRightSidebar />}</aside>
        </div>

        {modal === "auth" ? <AuthModal onClose={() => setModal("")} /> : null}
        {modal === "post" && sessionUser ? <CreatePostModal sessionUser={sessionUser} defaultCommunity={modalCommunity} onClose={() => setModal("")} /> : null}
        {modal === "community" && sessionUser ? <CreateCommunityWizard sessionUser={sessionUser} onClose={() => setModal("")} /> : null}
        {modal === "messages" ? <UtilityModal type="messages" sessionUser={sessionUser} onClose={() => setModal("")} /> : null}
        {modal === "custom-feeds" ? <UtilityModal type="custom-feeds" sessionUser={sessionUser} onClose={() => setModal("")} /> : null}
        {modal === "promote" ? <UtilityModal type="promote" sessionUser={sessionUser} onClose={() => setModal("")} /> : null}
        {modal === "settings" ? <UtilityModal type="settings" sessionUser={sessionUser} onClose={() => setModal("")} /> : null}
        {modal === "edit-community" && sessionUser && modalCommunity ? (
          <EditCommunityModal
            sessionUser={sessionUser}
            community={state.communities.find((community) => community.name === modalCommunity) || state.communities[0]}
            onClose={() => setModal("")}
          />
        ) : null}
      </div>
    </ChromeContext.Provider>
  );
}

function LeftSidebar({
  sessionUser,
  activePath,
  onCreateCommunity,
  onCustomFeeds,
  mobile = false,
}: {
  sessionUser?: ZivanUser;
  activePath: string;
  onCreateCommunity: () => void;
  onCustomFeeds: () => void;
  mobile?: boolean;
}) {
  const { state } = useZivan();
  const recent = state.communities
    .slice()
    .sort((a, b) => getCommunityPostCount(state, b.name) - getCommunityPostCount(state, a.name))
    .slice(0, mobile ? 4 : 7);
  const joined = sessionUser ? state.communities.filter((community) => community.memberIds.includes(sessionUser.id)) : [];
  const seededShortcuts = ["subzivan", "technology", "gaming", "newsroom", "design"]
    .map((name) => state.communities.find((community) => community.name === name))
    .filter(Boolean) as ZivanCommunity[];

  const nav = [
    ["/", Home, "Home"],
    ["/popular", TrendingUp, "Popular"],
    ["/news", Newspaper, "News"],
    ["/explore", Compass, "Explore"],
  ] as const;

  return (
    <nav className="space-y-5" aria-label="Primary">
      <div className="space-y-1">
        {nav.map(([href, Icon, label]) => {
          const active = activePath === href;
          return (
            <Link
              key={href}
              href={href}
              className={`zivan-focus flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                active ? "bg-violet-500/20 text-violet-50" : "text-violet-200/75 hover:bg-violet-500/12 hover:text-violet-50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-1 border-t border-zivan-line pt-4">
        <button
          type="button"
          onClick={onCreateCommunity}
          className="zivan-focus flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-violet-200/75 transition hover:bg-violet-500/12 hover:text-violet-50"
        >
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          Create a community
        </button>
        <button
          type="button"
          onClick={onCustomFeeds}
          className="zivan-focus flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-violet-200/75 transition hover:bg-violet-500/12 hover:text-violet-50"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Custom feeds
        </button>
        <Link
          href={sessionUser ? `/u/${sessionUser.username}?tab=posts` : "/"}
          className="zivan-focus flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-violet-200/75 transition hover:bg-violet-500/12 hover:text-violet-50"
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          My posts
        </Link>
      </div>

      {sessionUser ? (
        <div className="border-t border-zivan-line pt-4">
          <p className="mb-2 px-3 text-xs font-black uppercase tracking-[0.18em] text-violet-300/60">Joined communities</p>
          <div className="space-y-1">
            {joined.length ? (
              joined.slice(0, mobile ? 4 : 8).map((community) => (
                <Link
                  key={community.id}
                  href={`/z/${community.name}`}
                  className="zivan-focus flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-violet-200/75 hover:bg-violet-500/12 hover:text-violet-50"
                >
                  <Avatar label={community.name} value={community.avatar} size="sm" />
                  z/{community.name}
                </Link>
              ))
            ) : (
              <p className="px-3 text-sm text-violet-200/55">Join communities to pin them here.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="border-t border-zivan-line pt-4">
        <p className="mb-2 px-3 text-xs font-black uppercase tracking-[0.18em] text-violet-300/60">Seeded communities</p>
        <div className="mb-4 space-y-1">
          {seededShortcuts.map((community) => (
            <Link
              key={community.id}
              href={`/z/${community.name}`}
              className="zivan-focus flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-violet-200/75 hover:bg-violet-500/12 hover:text-violet-50"
            >
              <Avatar label={community.name} value={community.avatar} size="sm" />
              <span className="truncate">z/{community.name}</span>
            </Link>
          ))}
        </div>
        <p className="mb-2 px-3 text-xs font-black uppercase tracking-[0.18em] text-violet-300/60">Recent communities</p>
        <div className="space-y-1">
          {recent.map((community) => (
            <Link
              key={community.id}
              href={`/z/${community.name}`}
              className="zivan-focus flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-violet-200/75 hover:bg-violet-500/12 hover:text-violet-50"
            >
              <Avatar label={community.name} value={community.avatar} size="sm" />
              <span className="truncate">z/{community.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function NotificationsDropdown({ user, onClose }: { user: ZivanUser; onClose: () => void }) {
  const { state } = useZivan();
  const notifications = state.notifications.filter((item) => item.userId === user.id).slice(0, 6);
  return (
    <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-zivan-line bg-zivan-panel p-2 shadow-violet">
      <div className="flex items-center justify-between px-2 pb-2">
        <p className="text-sm font-black text-violet-50">Notifications</p>
        <Link href="/notifications" onClick={onClose} className="zivan-focus rounded px-2 py-1 text-xs font-bold text-violet-300 hover:text-violet-100">
          View page
        </Link>
      </div>
      {notifications.length ? (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              onClick={onClose}
              className="zivan-focus block rounded-md px-3 py-2 hover:bg-violet-500/12"
            >
              <span className="block text-sm font-bold text-violet-50">{notification.title}</span>
              <span className="mt-1 block text-xs leading-5 text-violet-200/65">{notification.message}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-zivan-line bg-black/20 p-3 text-sm text-violet-200/65">No notifications yet.</p>
      )}
    </div>
  );
}

export function DefaultRightSidebar() {
  const { state } = useZivan();
  const main = state.communities.find((community) => community.name === "subzivan") || state.communities[0];
  return <RightSidebar community={main} />;
}

export function RightSidebar({ community }: { community?: ZivanCommunity }) {
  const { state } = useZivan();
  const trending = state.communities
    .slice()
    .sort((a, b) => getCommunityPostCount(state, b.name) + b.memberIds.length - (getCommunityPostCount(state, a.name) + a.memberIds.length))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {community ? <CommunityInfoCard community={community} /> : null}
      <div className="zivan-card p-4">
        <h3 className="text-sm font-black text-violet-50">Trending communities</h3>
        <div className="mt-3 space-y-3">
          {trending.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar label={item.name} value={item.avatar} size="sm" />
                <div className="min-w-0">
                  <CommunityLink name={item.name} className="block truncate" />
                  <p className="text-xs text-violet-200/55">{formatNumber(item.memberIds.length)} members</p>
                </div>
              </div>
              <span className="rounded-full bg-violet-500/15 px-2 py-1 text-xs font-bold text-violet-200">{item.topic}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="zivan-card p-4">
        <h3 className="text-sm font-black text-violet-50">Platform pulse</h3>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Posts" value={state.posts.length} />
          <Stat label="Comments" value={state.comments.length} />
          <Stat label="Communities" value={state.communities.length} />
        </div>
      </div>
    </div>
  );
}

export function CommunityInfoCard({ community }: { community: ZivanCommunity }) {
  const { state } = useZivan();
  const weeklyStats = getCommunityWeeklyStats(state, community.name);
  return (
    <div className="zivan-card overflow-hidden">
      <div className="h-20" style={{ background: community.banner }} />
      <div className="p-4">
        <div className="-mt-10 mb-3">
          <Avatar label={community.name} value={community.avatar} size="lg" />
        </div>
        <CommunityLink name={community.name} className="text-base" />
        <p className="mt-2 text-sm leading-6 text-violet-200/70">{community.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Visibility" value={community.privacy} />
          <Stat label="Created" value={formatDate(community.createdAt)} />
          <Stat label="Weekly visitors" value={weeklyStats.weeklyVisitors} />
          <Stat label="Weekly contributors" value={weeklyStats.weeklyContributors} />
          <Stat label="Members" value={community.memberIds.length} />
          <Stat label="Posts" value={getCommunityPostCount(state, community.name)} />
        </div>
        <details className="mt-4 rounded-lg border border-zivan-line bg-black/20 p-3" open>
          <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-violet-300/70">Community rules</summary>
          <ol className="mt-3 space-y-2">
            {community.rules.map((rule, index) => (
              <li key={`${rule}-${index}`} className="flex gap-2 text-sm text-violet-200/75">
                <span className="font-black text-violet-300">{index + 1}</span>
                {rule}
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-zivan-line bg-black/20 px-2 py-3">
      <p className="text-base font-black text-violet-50">{typeof value === "number" ? formatNumber(value) : value}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-300/55">{label}</p>
    </div>
  );
}

export function useSignedInUser() {
  const { state } = useZivan();
  return getUserById(state, state.sessionUserId);
}

export function useDefaultFeedStats() {
  const { state } = useZivan();
  const topPost = sortPostsForView(state, "popular")[0];
  return {
    topPostTitle: topPost?.title || "No posts yet",
    topPostScore: topPost ? getScore(state, "post", topPost.id) : 0,
    topPostComments: topPost ? getCommentCount(state, topPost.id) : 0,
    topPostReactions: topPost ? getReactionCount(state, topPost.id) : 0,
  };
}

export function UserSummaryCard({ user }: { user: ZivanUser }) {
  const { state } = useZivan();
  const postCount = state.posts.filter((post) => post.authorId === user.id).length;
  const commentCount = state.comments.filter((comment) => comment.authorId === user.id).length;
  const joined = state.communities.filter((community) => community.memberIds.includes(user.id)).length;

  return (
    <div className="zivan-card p-4">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="lg" />
        <div>
          <p className="text-lg font-black text-violet-50">u/{user.username}</p>
          <p className="text-xs text-violet-200/55">Joined {formatDate(user.joinedAt)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-violet-200/70">{user.bio}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Reputation" value={getUserReputation(state, user.id)} />
        <Stat label="Posts" value={postCount} />
        <Stat label="Comments" value={commentCount} />
        <Stat label="Joined" value={joined} />
      </div>
    </div>
  );
}
