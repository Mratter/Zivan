"use client";

import {
  Bookmark,
  Check,
  ExternalLink,
  EyeOff,
  Flame,
  LayoutList,
  MessageCircle,
  MoreHorizontal,
  Reply,
  Share2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ZIVAN_TOPICS } from "@/lib/zivan-seed";
import {
  formatDate,
  formatRelativeTime,
  getCommentCount,
  getCommunityByName,
  getCommunityPostCount,
  getPostById,
  getPostComments,
  getReactionCount,
  getScore,
  getUserById,
  getUserByUsername,
  getUserReputation,
  sortPostList,
  sortPostsForView,
} from "@/lib/zivan-store";
import type { SortMode, ZivanComment, ZivanCommunity, ZivanPost, ZivanUser } from "@/lib/zivan-types";
import { useChromeActions, useDefaultFeedStats, useSignedInUser, UserSummaryCard, RightSidebar, Stat } from "./zivan-shell";
import { useZivan } from "./zivan-provider";
import {
  Avatar,
  CommunityLink,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  UserLink,
  VoteButtons,
  formatNumber,
} from "./zivan-ui";

type FeedView = "home" | "popular" | "news" | "explore";

const pageCopy: Record<FeedView, { title: string; subtitle: string }> = {
  home: {
    title: "Home",
    subtitle: "Fresh threads from your joined communities, plus the Zivan pulse when you are signed out.",
  },
  popular: {
    title: "Popular",
    subtitle: "Posts with momentum across Zivan, ranked by votes and comment activity.",
  },
  news: {
    title: "News",
    subtitle: "Context-first reporting and current-events discussion from news communities.",
  },
  explore: {
    title: "Explore",
    subtitle: "Find communities, topics, and conversations worth joining.",
  },
};

export function FeedPage({ view }: { view: FeedView }) {
  const { state } = useZivan();
  const sessionUser = useSignedInUser();
  const stats = useDefaultFeedStats();
  const [sortMode, setSortMode] = useState<SortMode>(view === "popular" ? "top" : "best");
  const [layout, setLayout] = useState<"compact" | "card">("compact");
  const basePosts = sortPostsForView(state, view, sessionUser?.id);
  const posts = sortPostList(state, basePosts, sortMode);
  const heading = pageCopy[view];
  const isHomeEmpty = view === "home" && sessionUser && basePosts.length === 0;
  const showFeed = view !== "explore";

  return (
    <div className="space-y-4">
      <section className="zivan-card overflow-hidden p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-violet-50 md:text-3xl">{heading.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-200/70">{heading.subtitle}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:w-[330px]">
            <Stat label="Top score" value={stats.topPostScore} />
            <Stat label="Comments" value={stats.topPostComments} />
            <Stat label="Reactions" value={stats.topPostReactions} />
          </div>
        </div>
      </section>

      {view === "explore" ? <ExploreCommunityGrid /> : null}

      {showFeed ? (
        <section className="zivan-card flex flex-wrap items-center justify-between gap-3 p-2">
          <div className="flex flex-wrap gap-1">
            {(["best", "hot", "new", "top"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`zivan-focus rounded-full px-4 py-2 text-sm font-black capitalize transition ${
                  sortMode === mode ? "bg-violet-500 text-violet-950" : "text-violet-200/75 hover:bg-violet-500/12 hover:text-violet-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLayout((value) => (value === "compact" ? "card" : "compact"))}
            className="zivan-focus inline-flex items-center gap-2 rounded-full border border-zivan-line bg-black/20 px-3 py-2 text-sm font-bold text-violet-100 hover:border-violet-400"
            aria-label="Toggle feed view"
          >
            <LayoutList className="h-4 w-4" aria-hidden="true" />
            {layout === "compact" ? "Compact" : "Card"}
          </button>
        </section>
      ) : null}

      {isHomeEmpty ? (
        <EmptyState
          title="Your home feed is waiting"
          body="Join a few communities and their posts will collect here. Until then, Popular and Explore are good launch points."
          action={
            <Link href="/explore" className="zivan-focus rounded-full bg-violet-500 px-4 py-2 text-sm font-bold text-violet-950 hover:bg-violet-300">
              Explore communities
            </Link>
          }
        />
      ) : showFeed && posts.length ? (
        <section className={`zivan-card overflow-hidden ${layout === "card" ? "space-y-2 bg-transparent p-0 shadow-none" : ""}`}>
          {posts.map((post, index) =>
            layout === "card" ? (
              <div key={post.id} className="zivan-card overflow-hidden">
                <PostRow post={post} />
              </div>
            ) : (
              <PostRow key={post.id} post={post} withDivider={index !== posts.length - 1} />
            ),
          )}
        </section>
      ) : showFeed ? (
        <EmptyState title="No posts found" body="This view has no posts yet. Create a post or join more communities to wake it up." />
      ) : null}
    </div>
  );
}

export function ExploreCommunityGrid() {
  const { state } = useZivan();
  const sessionUser = useSignedInUser();
  const { actions, setToast } = useZivan();
  const chrome = useChromeActions();
  const [topic, setTopic] = useState("All");
  const topics = ["All", ...ZIVAN_TOPICS];
  const communities = state.communities.filter((community) => topic === "All" || community.topic === topic);

  function toggleJoin(community: ZivanCommunity) {
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    const joined = community.memberIds.includes(sessionUser.id);
    const result = joined
      ? actions.leaveCommunity({ userId: sessionUser.id, communityName: community.name })
      : actions.joinCommunity({ userId: sessionUser.id, communityName: community.name });
    if (result.ok) setToast(joined ? `Left z/${community.name}.` : `Joined z/${community.name}.`);
  }

  return (
    <section className="zivan-card p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {topics.map((item) => {
          const count = item === "All" ? state.communities.length : state.communities.filter((community) => community.topic === item).length;
          return (
          <button
            key={item}
            type="button"
            onClick={() => setTopic(item)}
            className={`zivan-focus rounded-full border px-3 py-1.5 text-sm font-bold transition ${
              topic === item ? "border-violet-300 bg-violet-500/20 text-violet-50" : "border-zivan-line bg-black/20 text-violet-200/70 hover:border-violet-500"
            }`}
          >
            {item}
            <span className="ml-1 text-xs opacity-60">{count}</span>
          </button>
          );
        })}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {communities.map((community) => {
          const joined = Boolean(sessionUser && community.memberIds.includes(sessionUser.id));
          return (
            <article key={community.id} className="rounded-lg border border-zivan-line bg-black/20 p-4">
              <div className="h-20 rounded-lg" style={{ background: community.banner }} />
              <div className="-mt-6 flex items-end justify-between">
                <Avatar label={community.name} value={community.avatar} size="lg" />
                <button
                  type="button"
                  onClick={() => toggleJoin(community)}
                  className={`zivan-focus rounded-full px-4 py-2 text-sm font-black transition ${
                    joined ? "border border-zivan-line bg-zivan-panel2 text-violet-100 hover:border-violet-400" : "bg-violet-500 text-violet-950 hover:bg-violet-300"
                  }`}
                >
                  {joined ? "Joined" : "Join"}
                </button>
              </div>
              <div className="mt-3">
                <CommunityLink name={community.name} className="text-base" />
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-violet-200/70">{community.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-violet-200/70">
                  <span className="rounded-full bg-violet-500/15 px-2 py-1">{community.topic}</span>
                  <span className="rounded-full bg-violet-500/15 px-2 py-1">{formatNumber(community.memberIds.length)} members</span>
                  <span className="rounded-full bg-violet-500/15 px-2 py-1">{formatNumber(getCommunityPostCount(state, community.name))} posts</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PostRow({ post, withDivider = false, detail = false }: { post: ZivanPost; withDivider?: boolean; detail?: boolean }) {
  const { state, actions, setToast } = useZivan();
  const chrome = useChromeActions();
  const sessionUser = useSignedInUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const author = getUserById(state, post.authorId);
  const community = getCommunityByName(state, post.communityName);
  const comments = getCommentCount(state, post.id);
  const reactions = getReactionCount(state, post.id);
  const saved = Boolean(sessionUser && (state.savedPostIds[sessionUser.id] || []).includes(post.id));
  const reacted = Boolean(sessionUser && state.reactions.some((reaction) => reaction.userId === sessionUser.id && reaction.postId === post.id));
  const detailHref = `/z/${post.communityName}/comments/${post.id}`;

  function requireUser(action: () => void) {
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    action();
  }

  function vote(value: 1 | -1) {
    requireUser(() => actions.vote({ userId: sessionUser!.id, targetType: "post", targetId: post.id, value }));
  }

  function react() {
    requireUser(() => {
      const result = actions.toggleReaction({ userId: sessionUser!.id, postId: post.id });
      if (result.ok) setToast(reacted ? "Reaction removed." : "Reaction added.");
    });
  }

  function save() {
    requireUser(() => {
      const result = actions.toggleSavedPost({ userId: sessionUser!.id, postId: post.id });
      if (result.ok) setToast(saved ? "Removed from saved posts." : "Saved post.");
    });
  }

  function hide() {
    requireUser(() => {
      const result = actions.hidePost({ userId: sessionUser!.id, postId: post.id });
      if (result.ok) setToast("Post hidden from your feeds.");
    });
  }

  async function share() {
    const url = `${window.location.origin}${detailHref}`;
    try {
      await window.navigator.clipboard.writeText(url);
      setToast("Post link copied.");
    } catch {
      setToast(url);
    }
  }

  return (
    <article className={`${withDivider ? "border-b border-zivan-line" : ""} ${detail ? "p-4 sm:p-5" : "p-3 sm:p-4"}`}>
      <div className="flex gap-3">
        <div className="hidden sm:block">
          <VoteButtons state={state} sessionUserId={sessionUser?.id} targetType="post" targetId={post.id} onVote={vote} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-violet-200/60">
            {community ? <Avatar label={community.name} value={community.avatar} size="sm" /> : null}
            <CommunityLink name={post.communityName} />
            <span>posted by</span>
            {author ? <UserLink username={author.username} /> : <span>unknown</span>}
            <span>{formatRelativeTime(post.createdAt)}</span>
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-bold text-violet-200">{post.flair}</span>
            {post.mature ? <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-bold text-violet-200">18+</span> : null}
          </div>
          <Link href={detailHref} className="zivan-focus mt-2 block rounded text-violet-50 hover:text-violet-200">
            <h2 className={`${detail ? "text-2xl md:text-3xl" : "text-lg"} font-black leading-snug tracking-tight`}>{post.title}</h2>
          </Link>
          <div className={`mt-2 grid gap-3 ${post.thumbnail && !detail ? "sm:grid-cols-[1fr_118px]" : ""}`}>
            <div className="min-w-0">
              {post.body ? <p className={`${detail ? "" : "line-clamp-3"} text-sm leading-6 text-violet-200/72`}>{post.body}</p> : null}
              {post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="zivan-focus mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-zivan-line bg-black/20 px-3 py-1.5 text-sm font-semibold text-violet-200 hover:border-violet-400"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{post.url}</span>
                </a>
              ) : null}
            </div>
            {post.thumbnail && !detail ? (
              <Link href={detailHref} className="zivan-focus block overflow-hidden rounded-lg border border-zivan-line">
                <img src={post.thumbnail} alt="" className="h-24 w-full object-cover transition hover:scale-105" />
              </Link>
            ) : null}
            {post.imageUrl && detail ? <img src={post.imageUrl} alt="" className="mt-2 max-h-[520px] w-full rounded-lg border border-zivan-line object-cover" /> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1 text-sm text-violet-200/70">
            <div className="sm:hidden">
              <VoteButtons state={state} sessionUserId={sessionUser?.id} targetType="post" targetId={post.id} onVote={vote} compact />
            </div>
            <Link href={detailHref} className="zivan-focus inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold hover:bg-violet-500/12 hover:text-violet-50">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {formatNumber(comments)} comments
            </Link>
            <button
              type="button"
              onClick={react}
              aria-label={reacted ? "Remove reaction" : "React to post"}
              className={`zivan-focus inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold transition hover:bg-violet-500/12 hover:text-violet-50 ${
                reacted ? "text-violet-300" : ""
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {formatNumber(reactions)}
            </button>
            <button type="button" onClick={share} className="zivan-focus inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold hover:bg-violet-500/12 hover:text-violet-50">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </button>
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="zivan-focus inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-violet-500/12 hover:text-violet-50"
                aria-label="More post actions"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 w-52 rounded-lg border border-zivan-line bg-zivan-panel p-2 shadow-violet">
                  <button type="button" onClick={save} className="menu-action">
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                    {saved ? "Unsave post" : "Save post"}
                  </button>
                  <button type="button" onClick={hide} className="menu-action">
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    Hide post
                  </button>
                  <Link href={`/z/${post.communityName}`} className="menu-action">
                    <Flame className="h-4 w-4" aria-hidden="true" />
                    View community
                  </Link>
                  {author ? (
                    <Link href={`/u/${author.username}`} className="menu-action">
                      <Avatar user={author} size="sm" />
                      View author
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CommunityPage({ name }: { name: string }) {
  const { state, actions, setToast } = useZivan();
  const chrome = useChromeActions();
  const sessionUser = useSignedInUser();
  const community = getCommunityByName(state, name);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const posts = sortPostList(
    state,
    state.posts.filter((post) => post.communityName === name),
    sortMode,
  );

  if (!community) {
    return <EmptyState title="Community not found" body={`z/${name} does not exist yet. Try Explore or launch it yourself if the name is available.`} action={<SecondaryButton onClick={chrome.openCreateCommunity}>Create a community</SecondaryButton>} />;
  }

  const communityName = community.name;
  const joined = Boolean(sessionUser && community.memberIds.includes(sessionUser.id));
  const isCreator = Boolean(sessionUser && sessionUser.id === community.creatorId);

  function toggleJoin() {
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    const result = joined
      ? actions.leaveCommunity({ userId: sessionUser.id, communityName })
      : actions.joinCommunity({ userId: sessionUser.id, communityName });
    if (result.ok) setToast(joined ? `Left z/${communityName}.` : `Joined z/${communityName}.`);
  }

  async function shareCommunity() {
    const url = `${window.location.origin}/z/${communityName}`;
    try {
      await window.navigator.clipboard.writeText(url);
      setToast(`z/${communityName} link copied.`);
    } catch {
      setToast(url);
    }
  }

  return (
    <div className="space-y-4">
      <section className="zivan-card overflow-hidden">
        <div className="h-40 md:h-52" style={{ background: community.banner }} />
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-11 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar label={community.name} value={community.avatar} size="xl" />
              <div className="pb-1">
                <h1 className="text-3xl font-black tracking-tight text-violet-50">z/{community.name}</h1>
                <p className="text-sm font-semibold text-violet-200/65">{community.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleJoin}
                className={`zivan-focus rounded-full px-4 py-2 text-sm font-black transition ${
                  joined ? "border border-zivan-line bg-zivan-panel2 text-violet-100 hover:border-violet-400" : "bg-violet-500 text-violet-950 hover:bg-violet-300"
                }`}
              >
                {joined ? "Joined" : "Join"}
              </button>
              <PrimaryButton onClick={() => chrome.openCreatePost(community.name)}>Create Post</PrimaryButton>
              {isCreator ? <SecondaryButton onClick={() => chrome.openEditCommunity(community)}>Edit community</SecondaryButton> : null}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCommunityMenuOpen((value) => !value)}
                  className="zivan-focus inline-flex h-10 w-10 items-center justify-center rounded-full border border-zivan-line bg-zivan-panel2 text-violet-100 transition hover:border-violet-400"
                  aria-label="More community actions"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
                {communityMenuOpen ? (
                  <div className="absolute right-0 top-12 z-20 w-56 rounded-lg border border-zivan-line bg-zivan-panel p-2 shadow-violet">
                    <button type="button" onClick={shareCommunity} className="menu-action">
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      Copy community link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        chrome.openCreatePost(community.name);
                        setCommunityMenuOpen(false);
                      }}
                      className="menu-action"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Start discussion
                    </button>
                    {isCreator ? (
                      <button
                        type="button"
                        onClick={() => {
                          chrome.openEditCommunity(community);
                          setCommunityMenuOpen(false);
                        }}
                        className="menu-action"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Moderation tools
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {community.highlights.map((item) => (
              <span key={item} className="rounded-full border border-zivan-line bg-black/20 px-3 py-1.5 text-xs font-bold text-violet-200">
                {item}
              </span>
            ))}
            <span className="rounded-full border border-zivan-line bg-black/20 px-3 py-1.5 text-xs font-bold text-violet-200">{community.privacy}</span>
            {community.mature ? <span className="rounded-full border border-zivan-line bg-black/20 px-3 py-1.5 text-xs font-bold text-violet-200">Mature 18+</span> : null}
          </div>
        </div>
      </section>

      <section className="zivan-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet-300/70">Community highlights</h2>
          <div className="flex flex-wrap gap-1">
            {(["best", "hot", "new", "top"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`zivan-focus rounded-full px-3 py-1.5 text-xs font-black capitalize transition ${
                  sortMode === mode ? "bg-violet-500 text-violet-950" : "text-violet-200/75 hover:bg-violet-500/12 hover:text-violet-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {community.highlights.map((item) => (
            <div key={item} className="rounded-lg border border-zivan-line bg-black/20 p-4">
              <p className="text-sm font-black text-violet-50">{item}</p>
              <p className="mt-2 text-xs leading-5 text-violet-200/60">A quick entry point for current z/{community.name} discussions.</p>
            </div>
          ))}
        </div>
      </section>

      {posts.length ? (
        <section className="zivan-card overflow-hidden">
          {posts.map((post, index) => (
            <PostRow key={post.id} post={post} withDivider={index !== posts.length - 1} />
          ))}
        </section>
      ) : (
        <EmptyState title="No posts in this community yet" body="Start the first thread and give members something to gather around." action={<PrimaryButton onClick={() => chrome.openCreatePost(community.name)}>Create Post</PrimaryButton>} />
      )}
    </div>
  );
}

export function CommunityRight({ name }: { name: string }) {
  const { state } = useZivan();
  const community = getCommunityByName(state, name);
  return <RightSidebar community={community} />;
}

export function PostDetailPage({ communityName, postId }: { communityName: string; postId: string }) {
  const { state, actions, setToast } = useZivan();
  const chrome = useChromeActions();
  const sessionUser = useSignedInUser();
  const post = getPostById(state, postId);
  const [body, setBody] = useState("");

  if (!post || post.communityName !== communityName) {
    return <EmptyState title="Post not found" body="That discussion may have moved or been hidden. The community feed is still here." action={<Link href={`/z/${communityName}`} className="zivan-focus rounded-full bg-violet-500 px-4 py-2 text-sm font-bold text-violet-950">Back to community</Link>} />;
  }

  const comments = getPostComments(state, post.id);
  const topLevel = comments.filter((comment) => !comment.parentId);
  const currentPost = post;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    const result = actions.createComment({ authorId: sessionUser.id, postId: currentPost.id, body });
    if (result.ok) {
      setBody("");
      setToast("Comment posted.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="zivan-card overflow-hidden">
        <PostRow post={post} detail />
      </section>
      <section className="zivan-card p-4">
        <h2 className="text-lg font-black text-violet-50">Join the discussion</h2>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={sessionUser ? "Add a thoughtful comment..." : "Sign in to comment"}
            className="zivan-focus min-h-28 w-full resize-y rounded-lg border border-zivan-line bg-black/30 px-3 py-2.5 text-sm text-violet-50 placeholder:text-violet-300/45"
          />
          <div className="flex justify-end">
            <PrimaryButton type="submit">{sessionUser ? "Comment" : "Sign in to comment"}</PrimaryButton>
          </div>
        </form>
      </section>
      <section className="zivan-card divide-y divide-zivan-line overflow-hidden">
        {topLevel.length ? (
          topLevel.map((comment) => <CommentThread key={comment.id} comment={comment} replies={comments.filter((reply) => reply.parentId === comment.id)} post={post} />)
        ) : (
          <div className="p-8 text-center text-sm text-violet-200/65">No comments yet. A first reply has surprising power.</div>
        )}
      </section>
    </div>
  );
}

function CommentThread({ comment, replies, post }: { comment: ZivanComment; replies: ZivanComment[]; post: ZivanPost }) {
  const { state, actions, setToast } = useZivan();
  const chrome = useChromeActions();
  const sessionUser = useSignedInUser();
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const author = getUserById(state, comment.authorId);

  function vote(value: 1 | -1) {
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    actions.vote({ userId: sessionUser.id, targetType: "comment", targetId: comment.id, value });
  }

  function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    const result = actions.createComment({ authorId: sessionUser.id, postId: post.id, parentId: comment.id, body });
    if (result.ok) {
      setBody("");
      setReplying(false);
      setToast("Reply posted.");
    }
  }

  return (
    <article className="p-4">
      <div className="flex gap-3">
        <VoteButtons state={state} sessionUserId={sessionUser?.id} targetType="comment" targetId={comment.id} onVote={vote} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {author ? <Avatar user={author} size="sm" /> : null}
            {author ? <UserLink username={author.username} /> : <span className="text-sm text-violet-200/70">unknown</span>}
            <span className="text-xs text-violet-200/55">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-violet-100/85">{comment.body}</p>
          <button
            type="button"
            onClick={() => (sessionUser ? setReplying((value) => !value) : chrome.openAuth())}
            className="zivan-focus mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-violet-200/70 hover:bg-violet-500/12 hover:text-violet-50"
          >
            <Reply className="h-4 w-4" aria-hidden="true" />
            Reply
          </button>
          {replying ? (
            <form onSubmit={submitReply} className="mt-3 space-y-3">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="zivan-focus min-h-20 w-full rounded-lg border border-zivan-line bg-black/25 px-3 py-2 text-sm text-violet-50"
                placeholder="Write a one-level reply..."
              />
              <div className="flex justify-end gap-2">
                <SecondaryButton onClick={() => setReplying(false)}>Cancel</SecondaryButton>
                <PrimaryButton type="submit">Reply</PrimaryButton>
              </div>
            </form>
          ) : null}
          {replies.length ? (
            <div className="mt-4 space-y-3 border-l border-zivan-line pl-4">
              {replies.map((reply) => (
                <ReplyComment key={reply.id} comment={reply} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ReplyComment({ comment }: { comment: ZivanComment }) {
  const { state, actions } = useZivan();
  const chrome = useChromeActions();
  const sessionUser = useSignedInUser();
  const author = getUserById(state, comment.authorId);

  function vote(value: 1 | -1) {
    if (!sessionUser) {
      chrome.openAuth();
      return;
    }
    actions.vote({ userId: sessionUser.id, targetType: "comment", targetId: comment.id, value });
  }

  return (
    <div className="rounded-lg border border-zivan-line bg-black/20 p-3">
      <div className="flex gap-3">
        <VoteButtons state={state} sessionUserId={sessionUser?.id} targetType="comment" targetId={comment.id} onVote={vote} compact />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {author ? <Avatar user={author} size="sm" /> : null}
            {author ? <UserLink username={author.username} /> : null}
            <span className="text-xs text-violet-200/55">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-violet-100/85">{comment.body}</p>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const { state } = useZivan();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const [tab, setTab] = useState<"posts" | "communities" | "users">("posts");

  const posts = state.posts.filter((post) => `${post.title} ${post.body || ""} ${post.flair} ${post.communityName}`.toLowerCase().includes(query));
  const communities = state.communities.filter((community) => `${community.name} ${community.description} ${community.topic}`.toLowerCase().includes(query));
  const users = state.users.filter((user) => `${user.username} ${user.bio}`.toLowerCase().includes(query));

  return (
    <div className="space-y-4">
      <section className="zivan-card p-5">
        <h1 className="text-3xl font-black text-violet-50">Search</h1>
        <p className="mt-2 text-sm text-violet-200/70">{query ? `Results for "${query}"` : "Type in the top search bar to find posts, communities, and users."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["posts", `Posts (${posts.length})`],
            ["communities", `Communities (${communities.length})`],
            ["users", `Users (${users.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as "posts" | "communities" | "users")}
              className={`zivan-focus rounded-full border px-4 py-2 text-sm font-bold transition ${
                tab === key ? "border-violet-300 bg-violet-500/20 text-violet-50" : "border-zivan-line bg-black/20 text-violet-200/70 hover:border-violet-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {!query ? (
        <EmptyState title="Search Zivan" body="Try searching for technology, design, focus, launch, or a seeded user like pixelmage." />
      ) : tab === "posts" ? (
        posts.length ? (
          <section className="zivan-card overflow-hidden">
            {posts.map((post, index) => (
              <PostRow key={post.id} post={post} withDivider={index !== posts.length - 1} />
            ))}
          </section>
        ) : (
          <EmptyState title="No posts match" body="Try a broader term or switch tabs." />
        )
      ) : tab === "communities" ? (
        communities.length ? (
          <section className="grid gap-3 md:grid-cols-2">
            {communities.map((community) => (
              <Link key={community.id} href={`/z/${community.name}`} className="zivan-card block overflow-hidden transition hover:border-violet-500">
                <div className="h-20" style={{ background: community.banner }} />
                <div className="p-4">
                  <Avatar label={community.name} value={community.avatar} size="lg" />
                  <h2 className="mt-3 text-lg font-black text-violet-50">z/{community.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-violet-200/70">{community.description}</p>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <EmptyState title="No communities match" body="Try a topic like games, news, design, or questions." />
        )
      ) : users.length ? (
        <section className="grid gap-3 md:grid-cols-2">
          {users.map((user) => (
            <Link key={user.id} href={`/u/${user.username}`} className="zivan-card block p-4 transition hover:border-violet-500">
              <div className="flex items-center gap-3">
                <Avatar user={user} size="lg" />
                <div>
                  <h2 className="text-lg font-black text-violet-50">u/{user.username}</h2>
                  <p className="text-sm text-violet-200/60">{formatNumber(getUserReputation(state, user.id))} reputation</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-violet-200/70">{user.bio}</p>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState title="No users match" body="Try a seeded user such as nova_builder or orbit_reader." />
      )}
    </div>
  );
}

export function ProfilePage({ username }: { username: string }) {
  const { state } = useZivan();
  const user = getUserByUsername(state, username);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "comments" ? "comments" : searchParams.get("tab") === "communities" ? "communities" : "posts";
  const [tab, setTab] = useState<"posts" | "comments" | "communities">(initialTab);

  if (!user) {
    return <EmptyState title="User not found" body={`u/${username} is not a Zivan profile.`} />;
  }

  const posts = state.posts.filter((post) => post.authorId === user.id);
  const comments = state.comments.filter((comment) => comment.authorId === user.id);
  const communities = state.communities.filter((community) => community.memberIds.includes(user.id));

  return (
    <div className="space-y-4">
      <section className="zivan-card overflow-hidden">
        <div className="h-36 bg-[radial-gradient(circle_at_20%_20%,rgba(196,181,253,0.35),transparent_22rem),linear-gradient(135deg,#09090b,#4c1d95_55%,#18181b)]" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar user={user} size="xl" />
              <div className="pb-1">
                <h1 className="text-3xl font-black text-violet-50">u/{user.username}</h1>
                <p className="text-sm text-violet-200/65">Joined {formatDate(user.joinedAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-96">
              <Stat label="Reputation" value={getUserReputation(state, user.id)} />
              <Stat label="Posts" value={posts.length} />
              <Stat label="Comments" value={comments.length} />
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-violet-200/75">{user.bio}</p>
        </div>
      </section>

      <div className="zivan-card p-2">
        <div className="flex flex-wrap gap-2">
          {[
            ["posts", `Posts (${posts.length})`],
            ["comments", `Comments (${comments.length})`],
            ["communities", `Joined communities (${communities.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as "posts" | "comments" | "communities")}
              className={`zivan-focus rounded-full px-4 py-2 text-sm font-bold ${tab === key ? "bg-violet-500 text-violet-950" : "text-violet-200/70 hover:bg-violet-500/12"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "posts" ? (
        posts.length ? (
          <section className="zivan-card overflow-hidden">
            {posts.map((post, index) => (
              <PostRow key={post.id} post={post} withDivider={index !== posts.length - 1} />
            ))}
          </section>
        ) : (
          <EmptyState title="No posts yet" body="This profile has not posted anything yet." />
        )
      ) : tab === "comments" ? (
        comments.length ? (
          <section className="zivan-card divide-y divide-zivan-line overflow-hidden">
            {comments.map((comment) => {
              const post = getPostById(state, comment.postId);
              return (
                <Link key={comment.id} href={post ? `/z/${post.communityName}/comments/${post.id}` : "#"} className="zivan-focus block p-4 hover:bg-violet-500/10">
                  <p className="text-sm leading-6 text-violet-100">{comment.body}</p>
                  <p className="mt-2 text-xs text-violet-200/55">{post ? `on ${post.title}` : "Original post missing"} · {formatRelativeTime(comment.createdAt)}</p>
                </Link>
              );
            })}
          </section>
        ) : (
          <EmptyState title="No comments yet" body="This profile has not commented yet." />
        )
      ) : communities.length ? (
        <section className="grid gap-3 md:grid-cols-2">
          {communities.map((community) => (
            <Link key={community.id} href={`/z/${community.name}`} className="zivan-card block p-4 transition hover:border-violet-500">
              <div className="flex items-center gap-3">
                <Avatar label={community.name} value={community.avatar} size="lg" />
                <div>
                  <h2 className="text-lg font-black text-violet-50">z/{community.name}</h2>
                  <p className="text-sm text-violet-200/60">{community.topic}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState title="No joined communities" body="Joined communities will appear here." />
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { state, actions } = useZivan();
  const chrome = useChromeActions();
  const sessionUser = useSignedInUser();

  if (!sessionUser) {
    return <EmptyState title="Sign in for notifications" body="Comment, reply, and community-created alerts are attached to your Zivan account." action={<PrimaryButton onClick={chrome.openAuth}>Sign in</PrimaryButton>} />;
  }

  const notifications = state.notifications.filter((notification) => notification.userId === sessionUser.id);

  return (
    <div className="space-y-4">
      <section className="zivan-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-violet-50">Notifications</h1>
          <p className="mt-2 text-sm text-violet-200/70">Demo items plus live alerts for comments, replies, and community launches.</p>
        </div>
        <SecondaryButton onClick={() => actions.markNotificationsRead(sessionUser.id)}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Mark read
        </SecondaryButton>
      </section>
      {notifications.length ? (
        <section className="zivan-card divide-y divide-zivan-line overflow-hidden">
          {notifications.map((notification) => (
            <Link key={notification.id} href={notification.href} className="zivan-focus flex gap-3 p-4 hover:bg-violet-500/10">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.read ? "bg-zivan-line" : "bg-violet-300"}`} />
              <span>
                <span className="block text-sm font-black text-violet-50">{notification.title}</span>
                <span className="mt-1 block text-sm leading-6 text-violet-200/70">{notification.message}</span>
                <span className="mt-1 block text-xs text-violet-200/45">{formatRelativeTime(notification.createdAt)}</span>
              </span>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState title="No notifications yet" body="When someone comments, replies, or a community is created, it will appear here." />
      )}
    </div>
  );
}

export function ProfileRight({ username }: { username: string }) {
  const { state } = useZivan();
  const user = getUserByUsername(state, username);
  return user ? <UserSummaryCard user={user} /> : <RightSidebar />;
}
