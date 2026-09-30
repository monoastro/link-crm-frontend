// context/NotificationsContext.jsx
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchNotifications } from "../lib/notifications";

const API = process.env.NEXT_PUBLIC_API;
const STORAGE_KEY = "notif_last_id";
const MAX_TOASTS = 5;
const TOAST_TTL_MS = 8000;
const SOUND_SRC = "/sounds/notification.mp3";
const FALLBACK_POLL_MS = 60000; // safety net only; SSE does the real work

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [unseen, setUnseen] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const lastIdRef = useRef(null);
  const hasLoadedCursor = useRef(false);
  const timersRef = useRef(new Map());
  const audioRef = useRef(null);
  const unlockedRef = useRef(false);
  const isFirstPollRef = useRef(true);
  const seenIdsRef = useRef(new Set()); // dedupe between poll and stream
  const soundEnabledRef = useRef(true);

  // Keep the latest value in a ref so toggling sound doesn't restart the stream.
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    audioRef.current = new Audio(SOUND_SRC);
    audioRef.current.volume = 0.5;

    const unlock = () => {
      unlockedRef.current = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabledRef.current || !unlockedRef.current || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const pushToasts = useCallback(
    (newItems) => {
      const reversed = [...newItems].reverse();
      setToasts((prev) => [...reversed, ...prev].slice(0, MAX_TOASTS));
      for (const item of reversed) {
        const timer = setTimeout(() => dismissToast(item.id), TOAST_TTL_MS);
        timersRef.current.set(item.id, timer);
      }
    },
    [dismissToast]
  );

  const advanceCursor = useCallback((id) => {
    if (id == null) return;
    lastIdRef.current = String(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  // Shared by both the poll (catch-up) and the stream (live).
  const handleIncoming = useCallback(
    (items, { silent = false } = {}) => {
      const fresh = items.filter((n) => !seenIdsRef.current.has(String(n.id)));
      if (fresh.length === 0) return;

      for (const n of fresh) seenIdsRef.current.add(String(n.id));

      setUnseen((prev) => [...prev, ...fresh]);
      pushToasts(fresh);
      if (!silent) playSound();
    },
    [pushToasts, playSound]
  );

  // Catch-up: fetch anything after our cursor.
  const catchUp = useCallback(async () => {
    if (!hasLoadedCursor.current) {
      lastIdRef.current = localStorage.getItem(STORAGE_KEY);
      hasLoadedCursor.current = true;
    }

    try {
      const { items, lastId } = await fetchNotifications(lastIdRef.current);

      // First load is backlog, so no sound.
      handleIncoming(items, { silent: isFirstPollRef.current });
      advanceCursor(lastId);
    } catch {
      // network hiccup, next trigger will retry
    } finally {
      isFirstPollRef.current = false;
    }
  }, [handleIncoming, advanceCursor]);

  useEffect(() => {
    let source;
    let hasOpenedBefore = false;

    // Load backlog first, then open the stream so nothing falls in the gap.
    catchUp().then(() => {
      source = new EventSource(`${API}/notifications/stream`, { withCredentials: true });

      source.onopen = () => {
        // On a reconnect, catch up on anything missed while disconnected.
        if (hasOpenedBefore) catchUp();
        hasOpenedBefore = true;
      };
      source.onerror = () => console.log("SSE error, readyState:", source.readyState);

      source.addEventListener("notification", (e) => {
        console.log("notification event", e.data);
        try {
          const n = JSON.parse(e.data);
          handleIncoming([n]);
          advanceCursor(n.id);
        } catch {
          // malformed event, ignore
        }
      });

      // EventSource reconnects on its own after errors, so nothing to do here.
      source.onerror = () => {};
    });

    const fallback = setInterval(catchUp, FALLBACK_POLL_MS);
    const onFocus = () => catchUp();
    window.addEventListener("focus", onFocus);

    return () => {
      source?.close();
      clearInterval(fallback);
      window.removeEventListener("focus", onFocus);
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, [catchUp, handleIncoming, advanceCursor]);

  const clearUnseen = useCallback(() => setUnseen([]), []);

  return (
    <NotificationsContext.Provider
      value={{ unseen, clearUnseen, toasts, dismissToast, soundEnabled, setSoundEnabled }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotificationsContext must be used within NotificationsProvider");
  return ctx;
}
