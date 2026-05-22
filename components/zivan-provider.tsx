"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ZIVAN_STORAGE_KEY } from "@/lib/zivan-seed";
import {
  createComment,
  createCommunity,
  createInitialState,
  createPost,
  editCommunity,
  hidePost,
  joinCommunity,
  leaveCommunity,
  markNotificationsRead,
  normalizePersistedState,
  signInUser,
  signOutUser,
  signUpUser,
  toggleReaction,
  toggleSavedPost,
  voteTarget,
} from "@/lib/zivan-store";
import type { ActionResult, PostType, Privacy, VoteTargetType, VoteValue, ZivanState } from "@/lib/zivan-types";
import type { ZivanComment, ZivanCommunity, ZivanPost, ZivanUser } from "@/lib/zivan-types";

interface ZivanContextValue {
  state: ZivanState;
  loading: boolean;
  toast: string;
  setToast: (message: string) => void;
  actions: {
    signUp: (input: { email: string; username: string; password: string; confirmPassword: string }) => ActionResult<{ user: ZivanUser }>;
    signIn: (input: { identifier: string; password: string }) => ActionResult<{ user: ZivanUser }>;
    signOut: () => void;
    createCommunity: (input: { creatorId: string; name: string; topic: string; description: string; privacy: Privacy; mature: boolean }) => ActionResult<{ community: ZivanCommunity }>;
    editCommunity: (input: { userId: string; communityName: string; description: string; avatar: string; banner: string; rules: string[] }) => ActionResult<{ community: ZivanCommunity }>;
    joinCommunity: (input: { userId: string; communityName: string }) => ActionResult<{ community: ZivanCommunity }>;
    leaveCommunity: (input: { userId: string; communityName: string }) => ActionResult<{ community: ZivanCommunity }>;
    createPost: (input: { authorId: string; communityName: string; type: PostType; title: string; body?: string; url?: string; imageUrl?: string; flair: string; mature: boolean }) => ActionResult<{ post: ZivanPost }>;
    createComment: (input: { authorId: string; postId: string; body: string; parentId?: string }) => ActionResult<{ comment: ZivanComment }>;
    vote: (input: { userId: string; targetType: VoteTargetType; targetId: string; value: VoteValue }) => ActionResult<{ score: number }>;
    toggleReaction: (input: { userId: string; postId: string }) => ActionResult;
    toggleSavedPost: (input: { userId: string; postId: string }) => ActionResult;
    hidePost: (input: { userId: string; postId: string }) => ActionResult;
    markNotificationsRead: (userId: string) => void;
    resetDemo: () => void;
  };
}

const ZivanContext = createContext<ZivanContextValue | undefined>(undefined);

export function ZivanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ZivanState>(() => createInitialState());
  const [loading, setLoading] = useState(true);
  const [toast, setToastState] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ZIVAN_STORAGE_KEY);
      if (raw) {
        setState(normalizePersistedState(JSON.parse(raw)));
      }
    } catch {
      setState(createInitialState());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      window.localStorage.setItem(ZIVAN_STORAGE_KEY, JSON.stringify(state));
    }
  }, [loading, state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToastState(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setToast = useCallback((message: string) => {
    setToastState(message);
  }, []);

  const applyAction = useCallback(<T extends object>(action: ActionResult<T>) => {
    if (action.ok) {
      setState(action.state);
    } else {
      setToastState(action.message);
    }
    return action;
  }, []);

  const actions = useMemo<ZivanContextValue["actions"]>(
    () => ({
      signUp: (input) => applyAction(signUpUser(state, input)),
      signIn: (input) => applyAction(signInUser(state, input)),
      signOut: () => {
        setState((current) => signOutUser(current));
        setToastState("Signed out.");
      },
      createCommunity: (input) => applyAction(createCommunity(state, input)),
      editCommunity: (input) => applyAction(editCommunity(state, input)),
      joinCommunity: (input) => applyAction(joinCommunity(state, input)),
      leaveCommunity: (input) => applyAction(leaveCommunity(state, input)),
      createPost: (input) => applyAction(createPost(state, input)),
      createComment: (input) => applyAction(createComment(state, input)),
      vote: (input) => applyAction(voteTarget(state, input)),
      toggleReaction: (input) => applyAction(toggleReaction(state, input)),
      toggleSavedPost: (input) => applyAction(toggleSavedPost(state, input)),
      hidePost: (input) => applyAction(hidePost(state, input)),
      markNotificationsRead: (userId) => {
        setState((current) => markNotificationsRead(current, userId));
      },
      resetDemo: () => {
        setState(createInitialState());
        setToastState("Demo data restored.");
      },
    }),
    [applyAction, state],
  );

  const value = useMemo(
    () => ({
      state,
      loading,
      toast,
      setToast,
      actions,
    }),
    [actions, loading, setToast, state, toast],
  );

  return <ZivanContext.Provider value={value}>{children}</ZivanContext.Provider>;
}

export function useZivan() {
  const value = useContext(ZivanContext);
  if (!value) {
    throw new Error("useZivan must be used within ZivanProvider.");
  }
  return value;
}
