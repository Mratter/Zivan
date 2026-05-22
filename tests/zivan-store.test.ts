import { describe, expect, it } from "vitest";
import {
  createComment,
  createCommunity,
  createInitialState,
  createPost,
  getCommunityByName,
  sortPostList,
  joinCommunity,
  signInUser,
  signUpUser,
  validateCommunityName,
  voteTarget,
} from "../lib/zivan-store";

describe("Zivan state actions", () => {
  it("seeds the required default community and launch discussions", () => {
    const state = createInitialState();
    const subzivan = getCommunityByName(state, "subzivan");

    expect(subzivan?.topic).toBe("Internet Culture");
    expect(subzivan?.description).toBe(
      "The official community for Zivan updates, feedback, questions, and platform discussion.",
    );
    expect(subzivan?.rules).toEqual([
      "Be relevant to Zivan",
      "No low-effort spam",
      "Use the right flair",
      "Respect other members",
      "Check previous posts before posting",
    ]);
    expect(state.posts.map((post) => post.title)).toEqual(
      expect.arrayContaining([
        "Welcome to Zivan — read this before posting",
        "Feature request thread: what should we build next?",
        "How should community highlights work?",
        "AI tools are changing junior developer workflows",
        "What laptop specs are enough for local models?",
        "What game has the best community right now?",
        "Patch notes discussion thread",
        "Daily discussion: major headlines and context",
        "How do you verify breaking news?",
        "Show your dark-mode dashboard designs",
        "Best practices for dense feed layouts",
        "Ask Zivan: beginner questions thread",
        "What community should exist here that does not yet?",
      ]),
    );
  });

  it("validates community names for route safety and uniqueness", () => {
    const state = createInitialState();

    expect(validateCommunityName("tech_lab", state.communities).valid).toBe(true);
    expect(validateCommunityName("Technology", state.communities).message).toContain("lowercase");
    expect(validateCommunityName("ab", state.communities).message).toContain("3-21");
    expect(validateCommunityName("subzivan", state.communities).message).toContain("already exists");
  });

  it("signs up a validated user and allows sign in with the same credentials", () => {
    const state = createInitialState();
    const signedUp = signUpUser(state, {
      email: "reader@zivan.test",
      username: "reader_one",
      password: "lavender9",
      confirmPassword: "lavender9",
    });

    expect(signedUp.ok).toBe(true);
    if (!signedUp.ok) return;
    expect(signedUp.state.sessionUserId).toBeTruthy();
    expect(getCommunityByName(signedUp.state, "subzivan")?.memberIds).toContain(signedUp.user.id);

    const signedIn = signInUser(
      { ...signedUp.state, sessionUserId: undefined },
      { identifier: "reader_one", password: "lavender9" },
    );
    expect(signedIn.ok).toBe(true);
    if (!signedIn.ok) return;
    expect(signedIn.state.sessionUserId).toBe(signedUp.state.sessionUserId);
  });

  it("keeps post voting one vote per user and swaps direction without duplicates", () => {
    const state = createInitialState();
    const userId = state.users[1].id;
    const postId = state.posts[0].id;
    const originalScore = state.posts[0].baseScore;

    const up = voteTarget(state, { userId, targetId: postId, targetType: "post", value: 1 });
    const duplicateUp = voteTarget(up.state, { userId, targetId: postId, targetType: "post", value: 1 });
    const down = voteTarget(duplicateUp.state, { userId, targetId: postId, targetType: "post", value: -1 });

    expect(up.state.votes.filter((vote) => vote.userId === userId && vote.targetId === postId)).toHaveLength(1);
    expect(duplicateUp.state.votes.filter((vote) => vote.userId === userId && vote.targetId === postId)).toHaveLength(1);
    expect(down.state.posts[0].baseScore).toBe(originalScore);
    expect(down.score).toBe(originalScore - 1);
  });

  it("sorts post lists by new, top, hot, and best modes", () => {
    const state = createInitialState();
    const posts = state.posts.slice(0, 3).map((post, index) => ({
      ...post,
      id: `sort_${index}`,
      baseScore: [8, 30, 12][index],
      createdAt: [
        "2026-05-20T10:00:00.000Z",
        "2026-05-18T10:00:00.000Z",
        "2026-05-21T10:00:00.000Z",
      ][index],
    }));
    const sortedState = {
      ...state,
      posts,
      comments: [
        { id: "sort_cm_1", postId: "sort_0", authorId: state.users[0].id, body: "a", createdAt: "2026-05-20T10:05:00.000Z", baseScore: 1 },
        { id: "sort_cm_2", postId: "sort_0", authorId: state.users[1].id, body: "b", createdAt: "2026-05-20T10:06:00.000Z", baseScore: 1 },
        { id: "sort_cm_3", postId: "sort_2", authorId: state.users[2].id, body: "c", createdAt: "2026-05-21T10:06:00.000Z", baseScore: 1 },
      ],
    };

    expect(sortPostList(sortedState, posts, "new").map((post) => post.id)).toEqual(["sort_2", "sort_0", "sort_1"]);
    expect(sortPostList(sortedState, posts, "top").map((post) => post.id)[0]).toBe("sort_1");
    expect(sortPostList(sortedState, posts, "hot").map((post) => post.id)[0]).toBe("sort_1");
    expect(sortPostList(sortedState, posts, "best").map((post) => post.id)[0]).toBe("sort_0");
  });

  it("creates communities, posts, comments, and one-level replies with notifications", () => {
    const state = createInitialState();
    const creator = state.users[1];
    const community = createCommunity(state, {
      creatorId: creator.id,
      name: "science_hub",
      topic: "Science",
      description: "Research links and thoughtful explainers.",
      privacy: "Public",
      mature: false,
    });

    expect(community.ok).toBe(true);
    if (!community.ok) return;
    expect(community.state.communities.some((item) => item.name === "science_hub")).toBe(true);
    expect(community.state.notifications.some((item) => item.type === "community-created")).toBe(true);

    const joined = joinCommunity(community.state, { userId: creator.id, communityName: "science_hub" });
    const post = createPost(joined.state, {
      authorId: creator.id,
      communityName: "science_hub",
      type: "text",
      title: "What are the best weekly research digests?",
      body: "Looking for accessible summaries with links to papers.",
      flair: "Question",
      mature: false,
    });

    expect(post.ok).toBe(true);
    if (!post.ok) return;

    const comment = createComment(post.state, {
      authorId: state.users[2].id,
      postId: post.post.id,
      body: "Nature Briefing and Quanta are both good starting points.",
    });
    expect(comment.ok).toBe(true);
    if (!comment.ok) return;

    const reply = createComment(comment.state, {
      authorId: creator.id,
      postId: post.post.id,
      parentId: comment.comment.id,
      body: "Perfect, I will add both to my list.",
    });
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.comment.parentId).toBe(comment.comment.id);
    expect(reply.state.notifications.some((item) => item.type === "reply")).toBe(true);
  });
});
