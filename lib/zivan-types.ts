export type Privacy = "Public" | "Restricted" | "Private";
export type PostType = "text" | "link" | "image";
export type VoteTargetType = "post" | "comment";
export type VoteValue = -1 | 1;
export type NotificationType = "demo" | "comment" | "reply" | "community-created";
export type SortMode = "best" | "hot" | "new" | "top";

export interface ZivanUser {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  reputation: number;
  joinedAt: string;
  bio: string;
}

export interface ZivanCommunity {
  id: string;
  name: string;
  topic: string;
  description: string;
  privacy: Privacy;
  mature: boolean;
  avatar: string;
  banner: string;
  creatorId: string;
  createdAt: string;
  rules: string[];
  memberIds: string[];
  highlights: string[];
}

export interface ZivanPost {
  id: string;
  communityName: string;
  authorId: string;
  type: PostType;
  title: string;
  body?: string;
  url?: string;
  imageUrl?: string;
  thumbnail?: string;
  flair: string;
  mature: boolean;
  createdAt: string;
  baseScore: number;
}

export interface ZivanComment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  body: string;
  createdAt: string;
  baseScore: number;
}

export interface ZivanVote {
  userId: string;
  targetType: VoteTargetType;
  targetId: string;
  value: VoteValue;
}

export interface ZivanReaction {
  userId: string;
  postId: string;
  emoji: "spark";
}

export interface ZivanNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface ZivanState {
  version: 2;
  users: ZivanUser[];
  communities: ZivanCommunity[];
  posts: ZivanPost[];
  comments: ZivanComment[];
  votes: ZivanVote[];
  reactions: ZivanReaction[];
  savedPostIds: Record<string, string[]>;
  hiddenPostIds: Record<string, string[]>;
  notifications: ZivanNotification[];
  sessionUserId?: string;
}

export type ActionResult<T extends object = {}> =
  | ({ ok: true; state: ZivanState } & T)
  | { ok: false; state: ZivanState; message: string };
