import { createSeedState } from "./zivan-seed";
import type {
  ActionResult,
  NotificationType,
  PostType,
  Privacy,
  SortMode,
  VoteTargetType,
  VoteValue,
  ZivanComment,
  ZivanCommunity,
  ZivanNotification,
  ZivanPost,
  ZivanState,
  ZivanUser,
  ZivanVote,
} from "./zivan-types";

const communityPattern = /^[a-z0-9_]+$/;
const usernamePattern = /^[a-z0-9_]+$/;

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function cloneState(state: ZivanState): ZivanState {
  return {
    ...state,
    users: [...state.users],
    communities: [...state.communities],
    posts: [...state.posts],
    comments: [...state.comments],
    votes: [...state.votes],
    reactions: [...state.reactions],
    savedPostIds: { ...state.savedPostIds },
    hiddenPostIds: { ...state.hiddenPostIds },
    notifications: [...state.notifications],
  };
}

function ok<T extends object>(state: ZivanState, extra: T): ActionResult<T> {
  return { ok: true, state, ...extra };
}

function fail<T extends object = {}>(state: ZivanState, message: string): ActionResult<T> {
  return { ok: false, state, message };
}

export function createInitialState(): ZivanState {
  return createSeedState();
}

export function validateCommunityName(name: string, communities: ZivanCommunity[]) {
  const normalized = name.trim();
  if (!normalized) {
    return { valid: false, message: "Choose a community name." };
  }
  if (normalized.length < 3 || normalized.length > 21) {
    return { valid: false, message: "Community names must be 3-21 characters." };
  }
  if (normalized !== normalized.toLowerCase()) {
    return { valid: false, message: "Use lowercase letters, numbers, and underscores only." };
  }
  if (!communityPattern.test(normalized)) {
    return { valid: false, message: "Use lowercase letters, numbers, and underscores only." };
  }
  if (communities.some((community) => community.name === normalized)) {
    return { valid: false, message: `z/${normalized} already exists.` };
  }
  return { valid: true, message: "Available." };
}

export function validateAuthInput(input: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Enter a valid email address.";
  }
  if (username.length < 3 || username.length > 20 || username !== username.toLowerCase() || !usernamePattern.test(username)) {
    return "Username must be 3-20 lowercase letters, numbers, or underscores.";
  }
  if (input.password.length < 8 || !/\d/.test(input.password)) {
    return "Password must be at least 8 characters and include a number.";
  }
  if (input.password !== input.confirmPassword) {
    return "Passwords do not match.";
  }
  return "";
}

export function signUpUser(
  state: ZivanState,
  input: { email: string; username: string; password: string; confirmPassword: string },
): ActionResult<{ user: ZivanUser }> {
  const validation = validateAuthInput(input);
  if (validation) return { ok: false, state, message: validation };

  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  if (state.users.some((user) => user.email.toLowerCase() === email)) {
    return { ok: false, state, message: "An account already uses this email." };
  }
  if (state.users.some((user) => user.username === username)) {
    return { ok: false, state, message: "That username is already taken." };
  }

  const user: ZivanUser = {
    id: createId("u"),
    username,
    email,
    password: input.password,
    avatar: "linear-gradient(135deg, #c4b5fd, #7c3aed)",
    reputation: 1,
    joinedAt: nowIso(),
    bio: "New to Zivan and ready to find good communities.",
  };
  const next = cloneState(state);
  next.users = [user, ...next.users];
  next.communities = next.communities.map((community) =>
    community.name === "subzivan" ? { ...community, memberIds: [...new Set([user.id, ...community.memberIds])] } : community,
  );
  next.sessionUserId = user.id;
  next.notifications = [
    makeNotification(user.id, "demo", "Welcome to Zivan", "Find a community, join the discussion, or launch your own space.", "/explore"),
    ...next.notifications,
  ];
  return ok(next, { user });
}

export function signInUser(state: ZivanState, input: { identifier: string; password: string }): ActionResult<{ user: ZivanUser }> {
  const identifier = input.identifier.trim().toLowerCase();
  const user = state.users.find((item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier);
  if (!user || user.password !== input.password) {
    return { ok: false, state, message: "Username, email, or password is incorrect." };
  }
  return ok({ ...state, sessionUserId: user.id }, { user });
}

export function signOutUser(state: ZivanState): ZivanState {
  return { ...state, sessionUserId: undefined };
}

export function createCommunity(
  state: ZivanState,
  input: {
    creatorId: string;
    name: string;
    topic: string;
    description: string;
    privacy: Privacy;
    mature: boolean;
  },
): ActionResult<{ community: ZivanCommunity }> {
  const creator = getUserById(state, input.creatorId);
  if (!creator) return fail(state, "Sign in to create a community.");

  const normalizedName = input.name.trim();
  const validation = validateCommunityName(normalizedName, state.communities);
  if (!validation.valid) return fail(state, validation.message);
  if (input.description.trim().length < 12) {
    return fail(state, "Add a description with at least 12 characters.");
  }

  const community: ZivanCommunity = {
    id: createId("c"),
    name: normalizedName,
    topic: input.topic,
    description: input.description.trim(),
    privacy: input.privacy,
    mature: input.mature,
    avatar: "linear-gradient(135deg, #c4b5fd, #6d28d9)",
    banner: "linear-gradient(135deg, #09090b, #4c1d95 52%, #18181b)",
    creatorId: input.creatorId,
    createdAt: nowIso(),
    rules: ["Be relevant", "No spam", "Respect members"],
    memberIds: [input.creatorId],
    highlights: [input.topic, input.privacy, input.mature ? "Mature 18+" : "All ages"],
  };

  const next = cloneState(state);
  next.communities = [community, ...next.communities];
  next.notifications = [
    makeNotification(
      input.creatorId,
      "community-created",
      "You launched a new Zivan community!",
      `z/${community.name} is live. Add rules, invite members, and start the first post.`,
      `/z/${community.name}`,
    ),
    ...next.notifications,
  ];
  return ok(next, { community });
}

export function editCommunity(
  state: ZivanState,
  input: { userId: string; communityName: string; description: string; avatar: string; banner: string; rules: string[] },
): ActionResult<{ community: ZivanCommunity }> {
  const community = getCommunityByName(state, input.communityName);
  if (!community) return fail(state, "Community not found.");
  if (community.creatorId !== input.userId) return fail(state, "Only the creator can edit this community.");
  if (input.description.trim().length < 12) return fail(state, "Description must be at least 12 characters.");

  const next = cloneState(state);
  let updated = community;
  next.communities = next.communities.map((item) => {
    if (item.name !== community.name) return item;
    updated = {
      ...item,
      description: input.description.trim(),
      avatar: input.avatar.trim() || item.avatar,
      banner: input.banner.trim() || item.banner,
      rules: input.rules.map((rule) => rule.trim()).filter(Boolean).slice(0, 8),
    };
    return updated;
  });
  return ok(next, { community: updated });
}

export function joinCommunity(
  state: ZivanState,
  input: { userId: string; communityName: string },
): ActionResult<{ community: ZivanCommunity }> {
  const community = getCommunityByName(state, input.communityName);
  if (!community) return fail(state, "Community not found.");
  if (!getUserById(state, input.userId)) return fail(state, "Sign in to join communities.");
  if (community.memberIds.includes(input.userId)) return ok(state, { community });

  const next = cloneState(state);
  const updated = { ...community, memberIds: [...community.memberIds, input.userId] };
  next.communities = next.communities.map((item) => (item.name === input.communityName ? updated : item));
  return ok(next, { community: updated });
}

export function leaveCommunity(
  state: ZivanState,
  input: { userId: string; communityName: string },
): ActionResult<{ community: ZivanCommunity }> {
  const community = getCommunityByName(state, input.communityName);
  if (!community) return fail(state, "Community not found.");
  const next = cloneState(state);
  const updated = { ...community, memberIds: community.memberIds.filter((id) => id !== input.userId) };
  next.communities = next.communities.map((item) => (item.name === input.communityName ? updated : item));
  return ok(next, { community: updated });
}

export function createPost(
  state: ZivanState,
  input: {
    authorId: string;
    communityName: string;
    type: PostType;
    title: string;
    body?: string;
    url?: string;
    imageUrl?: string;
    flair: string;
    mature: boolean;
  },
): ActionResult<{ post: ZivanPost }> {
  if (!getUserById(state, input.authorId)) return fail(state, "Sign in to create posts.");
  if (!getCommunityByName(state, input.communityName)) return fail(state, "Choose an existing community.");
  if (input.title.trim().length < 4) return fail(state, "Post title must be at least 4 characters.");
  if (input.type === "text" && !input.body?.trim()) return fail(state, "Add body text for a text post.");
  if (input.type === "link" && !isHttpUrl(input.url || "")) return fail(state, "Add a valid link URL.");
  if (input.type === "image" && !isHttpUrl(input.imageUrl || "")) return fail(state, "Add a valid image URL.");

  const post: ZivanPost = {
    id: createId("p"),
    communityName: input.communityName,
    authorId: input.authorId,
    type: input.type,
    title: input.title.trim(),
    body: input.body?.trim(),
    url: input.url?.trim(),
    imageUrl: input.imageUrl?.trim(),
    thumbnail: input.type === "image" ? input.imageUrl?.trim() : undefined,
    flair: input.flair.trim() || "Discussion",
    mature: input.mature,
    createdAt: nowIso(),
    baseScore: 1,
  };
  const next = cloneState(state);
  next.posts = [post, ...next.posts];
  return ok(next, { post });
}

export function createComment(
  state: ZivanState,
  input: { authorId: string; postId: string; body: string; parentId?: string },
): ActionResult<{ comment: ZivanComment }> {
  const author = getUserById(state, input.authorId);
  const post = getPostById(state, input.postId);
  if (!author) return fail(state, "Sign in to comment.");
  if (!post) return fail(state, "Post not found.");
  if (input.body.trim().length < 2) return fail(state, "Comment must be at least 2 characters.");

  let parent: ZivanComment | undefined;
  if (input.parentId) {
    parent = state.comments.find((comment) => comment.id === input.parentId);
    if (!parent || parent.postId !== post.id) return fail(state, "Parent comment not found.");
    if (parent.parentId) return fail(state, "Replies are limited to one nested level.");
  }

  const comment: ZivanComment = {
    id: createId("cm"),
    postId: input.postId,
    authorId: input.authorId,
    parentId: input.parentId,
    body: input.body.trim(),
    createdAt: nowIso(),
    baseScore: 1,
  };
  const next = cloneState(state);
  next.comments = [...next.comments, comment];

  const recipientId = parent?.authorId || post.authorId;
  if (recipientId !== input.authorId) {
    next.notifications = [
      makeNotification(
        recipientId,
        parent ? "reply" : "comment",
        parent ? `${author.username} replied to your comment` : `${author.username} commented on your post`,
        trimForNotification(input.body),
        `/z/${post.communityName}/comments/${post.id}`,
      ),
      ...next.notifications,
    ];
  }
  return ok(next, { comment });
}

export function voteTarget(
  state: ZivanState,
  input: { userId: string; targetType: VoteTargetType; targetId: string; value: VoteValue },
): ActionResult<{ score: number }> {
  if (!getUserById(state, input.userId)) return fail(state, "Sign in to vote.");
  if (!targetExists(state, input.targetType, input.targetId)) return fail(state, "Could not find that item.");

  const next = cloneState(state);
  const existingIndex = next.votes.findIndex(
    (vote) => vote.userId === input.userId && vote.targetType === input.targetType && vote.targetId === input.targetId,
  );
  if (existingIndex >= 0) {
    const existing = next.votes[existingIndex];
    if (existing.value !== input.value) {
      next.votes[existingIndex] = { ...existing, value: input.value };
    }
  } else {
    next.votes = [...next.votes, { ...input }];
  }

  return ok(next, { score: getScore(next, input.targetType, input.targetId) });
}

export function toggleReaction(state: ZivanState, input: { userId: string; postId: string }): ActionResult {
  if (!getUserById(state, input.userId)) return fail(state, "Sign in to react.");
  if (!getPostById(state, input.postId)) return fail(state, "Post not found.");
  const next = cloneState(state);
  const existing = next.reactions.some((reaction) => reaction.userId === input.userId && reaction.postId === input.postId);
  next.reactions = existing
    ? next.reactions.filter((reaction) => !(reaction.userId === input.userId && reaction.postId === input.postId))
    : [...next.reactions, { userId: input.userId, postId: input.postId, emoji: "spark" }];
  return ok(next, {});
}

export function toggleSavedPost(state: ZivanState, input: { userId: string; postId: string }): ActionResult {
  if (!getUserById(state, input.userId)) return fail(state, "Sign in to save posts.");
  const saved = state.savedPostIds[input.userId] || [];
  const next = cloneState(state);
  next.savedPostIds[input.userId] = saved.includes(input.postId) ? saved.filter((id) => id !== input.postId) : [...saved, input.postId];
  return ok(next, {});
}

export function hidePost(state: ZivanState, input: { userId: string; postId: string }): ActionResult {
  if (!getUserById(state, input.userId)) return fail(state, "Sign in to hide posts.");
  const hidden = state.hiddenPostIds[input.userId] || [];
  const next = cloneState(state);
  next.hiddenPostIds[input.userId] = hidden.includes(input.postId) ? hidden : [...hidden, input.postId];
  return ok(next, {});
}

export function markNotificationsRead(state: ZivanState, userId: string): ZivanState {
  return {
    ...state,
    notifications: state.notifications.map((notification) =>
      notification.userId === userId ? { ...notification, read: true } : notification,
    ),
  };
}

export function getScore(state: ZivanState, targetType: VoteTargetType, targetId: string) {
  const target = targetType === "post" ? getPostById(state, targetId) : state.comments.find((comment) => comment.id === targetId);
  const baseScore = target?.baseScore || 0;
  return state.votes
    .filter((vote) => vote.targetType === targetType && vote.targetId === targetId)
    .reduce((score, vote) => score + vote.value, baseScore);
}

export function getUserVote(state: ZivanState, userId: string | undefined, targetType: VoteTargetType, targetId: string) {
  if (!userId) return 0;
  return state.votes.find((vote) => vote.userId === userId && vote.targetType === targetType && vote.targetId === targetId)?.value || 0;
}

export function getUserById(state: ZivanState, id: string | undefined) {
  return state.users.find((user) => user.id === id);
}

export function getUserByUsername(state: ZivanState, username: string) {
  return state.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
}

export function getCommunityByName(state: ZivanState, name: string | undefined) {
  return state.communities.find((community) => community.name === name);
}

export function getPostById(state: ZivanState, id: string | undefined) {
  return state.posts.find((post) => post.id === id);
}

export function getPostComments(state: ZivanState, postId: string) {
  return state.comments
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getCommentCount(state: ZivanState, postId: string) {
  return state.comments.filter((comment) => comment.postId === postId).length;
}

export function getCommunityPostCount(state: ZivanState, communityName: string) {
  return state.posts.filter((post) => post.communityName === communityName).length;
}

export function getReactionCount(state: ZivanState, postId: string) {
  return state.reactions.filter((reaction) => reaction.postId === postId).length;
}

export function getUserReputation(state: ZivanState, userId: string) {
  const posts = state.posts.filter((post) => post.authorId === userId).reduce((total, post) => total + getScore(state, "post", post.id), 0);
  const comments = state.comments
    .filter((comment) => comment.authorId === userId)
    .reduce((total, comment) => total + getScore(state, "comment", comment.id), 0);
  const user = getUserById(state, userId);
  return (user?.reputation || 0) + posts + comments;
}

export function sortPostList(state: ZivanState, posts: ZivanPost[], mode: SortMode) {
  const weight = (post: ZivanPost) => {
    const score = getScore(state, "post", post.id);
    const comments = getCommentCount(state, post.id);
    const ageHours = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / 3600000);
    if (mode === "new") return new Date(post.createdAt).getTime();
    if (mode === "top") return score;
    if (mode === "hot") return score * 2 + comments * 4 - ageHours * 0.35;
    return score + comments * 12 - ageHours * 0.08;
  };
  return posts.slice().sort((a, b) => weight(b) - weight(a));
}

export function sortPostsForView(state: ZivanState, view: "home" | "popular" | "news" | "explore", userId?: string) {
  const hidden = userId ? state.hiddenPostIds[userId] || [] : [];
  let posts = state.posts.filter((post) => !hidden.includes(post.id));
  if (view === "home" && userId) {
    const joined = state.communities.filter((community) => community.memberIds.includes(userId)).map((community) => community.name);
    const popularIds = state.posts
      .slice()
      .sort((a, b) => getScore(state, "post", b.id) + getCommentCount(state, b.id) - (getScore(state, "post", a.id) + getCommentCount(state, a.id)))
      .slice(0, 4)
      .map((post) => post.id);
    posts = posts.filter((post) => joined.includes(post.communityName) || popularIds.includes(post.id));
  }
  if (view === "news") {
    posts = posts.filter((post) => getCommunityByName(state, post.communityName)?.topic === "News & Politics" || post.communityName === "newsroom");
  }
  if (view === "popular") {
    return sortPostList(state, posts, "top");
  }
  return sortPostList(state, posts, "new");
}

export function getCommunityWeeklyStats(state: ZivanState, communityName: string) {
  const posts = state.posts.filter((post) => post.communityName === communityName);
  const comments = state.comments.filter((comment) => {
    const post = getPostById(state, comment.postId);
    return post?.communityName === communityName;
  });
  const contributorIds = new Set([...posts.map((post) => post.authorId), ...comments.map((comment) => comment.authorId)]);
  const visitors = Math.max(120, posts.reduce((total, post) => total + getScore(state, "post", post.id), 0) * 9 + comments.length * 18);
  return {
    weeklyVisitors: visitors,
    weeklyContributors: Math.max(contributorIds.size, Math.ceil(contributorIds.size * 1.6)),
  };
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function normalizePersistedState(value: unknown): ZivanState {
  if (!value || typeof value !== "object") return createInitialState();
  const maybe = value as Partial<ZivanState>;
  if (!Array.isArray(maybe.users) || !Array.isArray(maybe.communities) || !Array.isArray(maybe.posts)) {
    return createInitialState();
  }
  const seed = createInitialState();
  return {
    version: 2,
    users: maybe.users,
    communities: maybe.communities,
    posts: maybe.posts,
    comments: Array.isArray(maybe.comments) ? maybe.comments : seed.comments,
    votes: Array.isArray(maybe.votes) ? maybe.votes : [],
    reactions: Array.isArray(maybe.reactions) ? maybe.reactions : [],
    savedPostIds: maybe.savedPostIds || {},
    hiddenPostIds: maybe.hiddenPostIds || {},
    notifications: Array.isArray(maybe.notifications) ? maybe.notifications : seed.notifications,
    sessionUserId: maybe.sessionUserId,
  };
}

function makeNotification(userId: string, type: NotificationType, title: string, message: string, href: string): ZivanNotification {
  return {
    id: createId("n"),
    userId,
    type,
    title,
    message,
    href,
    createdAt: nowIso(),
    read: false,
  };
}

function trimForNotification(value: string) {
  return value.length > 96 ? `${value.slice(0, 93)}...` : value;
}

function targetExists(state: ZivanState, targetType: VoteTargetType, targetId: string) {
  return targetType === "post" ? Boolean(getPostById(state, targetId)) : state.comments.some((comment) => comment.id === targetId);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
