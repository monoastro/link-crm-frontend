// context/NotificationsContext.jsx
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchNotifications } from "../lib/notifications";

const POLL_MS = 5000;
const STORAGE_KEY = "notif_last_id";
const MAX_TOASTS = 5;
const TOAST_TTL_MS = 8000;
const SOUND_SRC = "/sounds/notification.mp3";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [unseen, setUnseen] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const lastIdRef = useRef(null);
  const hasLoadedCursor = useRef(false);
  const timersRef = useRef(new Map());
  const audioRef = useRef(null);
  const unlockedRef = useRef(false); // whether a user gesture has happened yet
  const isFirstPollRef = useRef(true); // don't play sound for the initial backlog

  // Prepare the audio element once, client-side only.
  useEffect(() => {
    audioRef.current = new Audio(SOUND_SRC);
    audioRef.current.volume = 0.5;

    // Most browsers allow audio once the user has clicked/tapped/typed anywhere.
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
    if (!soundEnabled || !unlockedRef.current || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Autoplay was blocked despite the gesture check, or the file 404s.
      // Non-fatal — just skip the sound this time.
    });
  }, [soundEnabled]);

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

  const poll = useCallback(async () => {
    if (!hasLoadedCursor.current) {
      lastIdRef.current = localStorage.getItem(STORAGE_KEY);
      hasLoadedCursor.current = true;
    }

    try {
      const { items, lastId } = await fetchNotifications(lastIdRef.current);

      if (items.length > 0) {
        setUnseen((prev) => [...prev, ...items]);
        pushToasts(items);

        // Skip the sound on the very first poll of a session — that batch
        // is backlog the user hasn't seen yet, not something "arriving" now.
        if (!isFirstPollRef.current) {
          playSound();
        }
      }
      if (lastId != null) {
        lastIdRef.current = String(lastId);
        localStorage.setItem(STORAGE_KEY, String(lastId));
      }
    } catch {
      // network hiccup — try again next tick
    } finally {
      isFirstPollRef.current = false;
    }
  }, [pushToasts, playSound]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, [poll]);

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
