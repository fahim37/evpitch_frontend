"use client";
import { useSession } from "next-auth/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  AlertTriangle,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";

interface VideoPlayerProps {
  /** Pitch id, streamed via HLS from the backend. Ignored when `src` is set. */
  pitchId?: string;
  /** Direct video URL (blob/object URL or hosted file) — bypasses HLS. */
  src?: string;
  className?: string;
  poster?: string;
  title?: string;
  /** Attempt to autoplay (with sound) once the video is ready. Default true. */
  autoPlay?: boolean;
}

const MAX_RETRIES = 4;
const AUTOPLAY_MAX_ATTEMPTS = 2; // keep small to avoid loops
const CONTROLS_HIDE_DELAY = 2500;
const VOLUME_STORAGE_KEY = "evp-player-volume";

const CONTROL_BUTTON_CLASS =
  "flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-white transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function VideoPlayer({
  pitchId,
  src,
  className = "",
  poster = "/assets/thumbnail.png",
  title = "Elevator video pitch",
  autoPlay: shouldAutoPlay = true,
}: VideoPlayerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSourceRef = useRef("");
  const autoplayAttemptsRef = useRef(0);
  const seekingRef = useRef(false); // prevent accidental mute during scrubs
  const suppressToggleRef = useRef(false); // touch: first tap reveals controls, doesn't pause

  const isDirectSrc = Boolean(src?.trim());
  const resolvedSrc = useMemo(() => {
    const directSrc = src?.trim();
    if (directSrc) return directSrc;
    const trimmedId = pitchId?.trim();
    if (!trimmedId) return "";
    const base = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    if (!base) return "";
    return `${base}/elevator-pitch/stream/${trimmedId}`;
  }, [pitchId, src]);
  latestSourceRef.current = resolvedSrc;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // start with sound ON
  const [isEnded, setIsEnded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsInteractionRef = useRef(false);
  const showControlsRef = useRef(showControls);
  showControlsRef.current = showControls;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const persistVolume = (value: number) => {
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  };

  const applyStoredVolume = (video: HTMLVideoElement) => {
    try {
      const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
      if (raw !== null) {
        const parsed = Number.parseFloat(raw);
        if (Number.isFinite(parsed)) {
          video.volume = Math.min(1, Math.max(0, parsed));
        }
      }
    } catch {
      // ignore
    }
  };

  const tryAutoPlay = () => {
    if (!shouldAutoPlay) return;
    const video = videoRef.current;
    if (!video) return;
    // We want sound ON by default. Do NOT force mute here.
    video.defaultMuted = false;
    video.muted = false;
    video.autoplay = true;
    if (!video.paused) return;
    if (autoplayAttemptsRef.current >= AUTOPLAY_MAX_ATTEMPTS) return;
    autoplayAttemptsRef.current += 1;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // Most browsers block autoplay-with-sound. We don't force mute;
        // the first user gesture will play WITH sound.
      });
    }
  };

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const registerCleanup = (fn: () => void) => {
    const wrapped = () => {
      fn();
      if (cleanupRef.current === wrapped) {
        cleanupRef.current = null;
      }
    };
    cleanupRef.current = wrapped;
    return wrapped;
  };

  const runCleanup = () => {
    if (cleanupRef.current) cleanupRef.current();
  };

  const scheduleRetry = (reason: string) => {
    if (retryCount >= MAX_RETRIES) {
      setError("An error occurred while loading the video.");
      setLoading(false);
      return;
    }
    clearRetryTimeout();
    const next = retryCount + 1;
    const delay = 4000;
    setRetryCount(next);
    setLoading(true);
    // eslint-disable-next-line no-console
    console.warn(`Retrying video init (#${next}) in ${delay}ms due to: ${reason}`);
    retryTimeoutRef.current = setTimeout(() => {
      setError(null);
      runCleanup();
      initHls(latestSourceRef.current);
    }, delay);
  };

  const clearControlsHideTimeout = useCallback(() => {
    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsHideTimeout();
    if (!isPlaying) return;
    controlsHideTimeoutRef.current = setTimeout(() => {
      if (!controlsInteractionRef.current) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY);
  }, [clearControlsHideTimeout, isPlaying]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handlePointerActivity = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (event && controlsContainerRef.current) {
        const target = event.target as Node | null;
        if (target && controlsContainerRef.current.contains(target)) {
          return;
        }
      }
      controlsInteractionRef.current = false;
      revealControls();
    },
    [revealControls]
  );

  const handleMouseLeave = useCallback(() => {
    controlsInteractionRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handleControlsPointerEnter = useCallback(() => {
    controlsInteractionRef.current = true;
    setShowControls(true);
    clearControlsHideTimeout();
  }, [clearControlsHideTimeout]);

  const handleControlsPointerLeave = useCallback(() => {
    controlsInteractionRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handleControlsFocus = useCallback(() => {
    controlsInteractionRef.current = true;
    setShowControls(true);
    clearControlsHideTimeout();
  }, [clearControlsHideTimeout]);

  const handleControlsBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
        return;
      }
      controlsInteractionRef.current = false;
      scheduleControlsHide();
    },
    [scheduleControlsHide]
  );

  const initHls = (sourceUrl = resolvedSrc) => {
    const sanitizedSrc = typeof sourceUrl === "string" ? sourceUrl.trim() : "";
    if (!sanitizedSrc) {
      setError("Video source missing.");
      setLoading(false);
      return;
    }
    const video = videoRef.current;
    if (!video) {
      setError("Video element not found.");
      setLoading(false);
      return;
    }
    autoplayAttemptsRef.current = 0;
    runCleanup();
    video.defaultMuted = false;
    video.muted = false;
    applyStoredVolume(video);

    if (isDirectSrc) {
      // Plain file/blob URL — the browser can play it without HLS.
      video.src = sanitizedSrc;
      registerCleanup(() => {
        video.removeAttribute("src");
        try {
          video.load();
        } catch {
          // ignore
        }
      });
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        startLevel: -1,
        autoStartLoad: true,
        xhrSetup: (xhr: XMLHttpRequest) => {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });
      hlsRef.current = hls;
      try {
        hls.attachMedia(video);
        hls.loadSource(sanitizedSrc);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          setRetryCount(0);
          tryAutoPlay();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          // eslint-disable-next-line no-console
          console.error("HLS Error:", data);
          if (!hlsRef.current) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                scheduleRetry("network");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                try {
                  hlsRef.current?.recoverMediaError();
                } catch {
                  scheduleRetry("media");
                }
                break;
              default:
                scheduleRetry("unknown-fatal");
            }
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("HLS Setup Error:", err);
        scheduleRetry("setup");
      }
      registerCleanup(() => {
        if (hlsRef.current) {
          try {
            hlsRef.current.destroy();
          } catch {
            // ignore
          }
          hlsRef.current = null;
        }
      });
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = sanitizedSrc;
      registerCleanup(() => {
        video.removeAttribute("src");
        try {
          video.load();
        } catch {
          // ignore
        }
      });
      return;
    }

    setError("Your browser does not support video playback.");
    setRetryCount(MAX_RETRIES);
    setLoading(false);
  };

  useEffect(() => {
    clearRetryTimeout();
    setRetryCount(0);
    setError(null);
    setLoading(true);
    setIsEnded(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedPercent(0);
    initHls(resolvedSrc);
    return () => {
      runCleanup();
      clearRetryTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc, token]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      clearControlsHideTimeout();
      return;
    }
    scheduleControlsHide();
    return () => {
      clearControlsHideTimeout();
    };
  }, [isPlaying, scheduleControlsHide, clearControlsHideTimeout]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(
    () => () => {
      clearControlsHideTimeout();
    },
    [clearControlsHideTimeout]
  );

  const updateBuffered = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const { buffered } = video;
    let end = 0;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= video.currentTime + 0.5 && buffered.end(i) > end) {
        end = buffered.end(i);
      }
    }
    setBufferedPercent(Math.min(100, (end / video.duration) * 100));
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        video.play().catch(() => setError("Playback failed. Please try again."));
      } else {
        video.pause();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Play/Pause Error:", err);
      setError("Unable to control playback.");
    }
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.currentTime = 0;
      setCurrentTime(0);
      setIsEnded(false);
      video.play().catch(() => setError("Playback failed. Please try again."));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Replay Error:", err);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Mute Error:", err);
      setError("Unable to control volume.");
    }
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const newVol = Number.parseFloat(e.target.value);
      const shouldMute = newVol === 0;
      seekingRef.current = false;
      video.volume = newVol;
      video.muted = shouldMute;
      setVolume(newVol);
      setIsMuted(shouldMute);
      persistVolume(newVol);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Volume Change Error:", err);
      setError("Unable to adjust volume.");
    }
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const base = video.muted ? 0 : video.volume;
    const next = Math.min(1, Math.max(0, base + delta));
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
    setIsMuted(next === 0);
    persistVolume(next);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    try {
      seekingRef.current = true;
      const prevMuted = video.muted;
      const clamped = Number.isFinite(video.duration)
        ? Math.min(Math.max(0, time), video.duration)
        : Math.max(0, time);
      video.currentTime = clamped;
      // Some mobile browsers can emit a stray volumechange; keep prior mute state
      if (video.muted !== prevMuted) {
        video.muted = prevMuted;
        setIsMuted(prevMuted);
      }
      seekingRef.current = false;
      setCurrentTime(clamped);
      if (!Number.isFinite(video.duration) || clamped < video.duration) {
        setIsEnded(false);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Seek Error:", err);
      setError("Unable to seek video.");
      seekingRef.current = false;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number.parseFloat(e.target.value));
  };

  const seekBy = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    seekTo(video.currentTime + delta);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null;
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {
            /* ignore */
          });
        } else {
          doc.webkitExitFullscreen?.();
        }
        return;
      }
      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          /* ignore */
        });
        return;
      }
      if (container?.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
        return;
      }
      // iPhone Safari: only the video element itself can go fullscreen
      video?.webkitEnterFullscreen?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Fullscreen Error:", err);
      setError("Unable to toggle fullscreen.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT") {
      // range inputs handle arrow keys natively
      revealControls();
      return;
    }
    switch (e.key) {
      case " ":
      case "k":
      case "K":
        if (tag === "BUTTON" && e.key === " ") break; // let the focused button handle space
        e.preventDefault();
        togglePlay();
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "ArrowLeft":
        e.preventDefault();
        seekBy(-5);
        break;
      case "ArrowRight":
        e.preventDefault();
        seekBy(5);
        break;
      case "ArrowUp":
        e.preventDefault();
        adjustVolume(0.1);
        break;
      case "ArrowDown":
        e.preventDefault();
        adjustVolume(-0.1);
        break;
      case "Home":
      case "0":
        e.preventDefault();
        seekTo(0);
        break;
      default:
        break;
    }
    revealControls();
  };

  // On touch devices, the first tap on a playing video should only reveal the
  // controls — not pause. Snapshot the decision at pointerdown, before state updates.
  const handleVideoPointerDown = (e: React.PointerEvent<HTMLVideoElement>) => {
    suppressToggleRef.current =
      e.pointerType === "touch" && isPlayingRef.current && !showControlsRef.current;
  };

  const handleVideoClick = () => {
    if (suppressToggleRef.current) {
      suppressToggleRef.current = false;
      return;
    }
    togglePlay();
  };

  const fatalError = Boolean(error) && retryCount >= MAX_RETRIES;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const remainingTime = Math.max(0, duration - currentTime);
  const controlsVisible = showControls || !isPlaying || isScrubbing;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={title}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`group relative mx-auto w-full max-w-5xl select-none overflow-hidden bg-[#0c1522] shadow-2xl outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-primary ${
        isFullscreen ? "rounded-none" : "rounded-xl sm:rounded-2xl"
      } ${className}`}
      onPointerMove={handlePointerActivity}
      onPointerEnter={handlePointerActivity}
      onPointerDown={handlePointerActivity}
      onPointerLeave={handleMouseLeave}
    >
      <div className={`relative w-full ${isFullscreen ? "h-full" : "aspect-video"}`}>
        <video
          ref={videoRef}
          poster={poster}
          className={`absolute inset-0 h-full w-full bg-black object-contain transition-opacity duration-500 ${
            loading ? "opacity-0" : "opacity-100"
          }`}
          playsInline
          autoPlay={shouldAutoPlay}
          muted={isMuted} // state-driven, default false
          preload="auto"
          crossOrigin={isDirectSrc ? undefined : "anonymous"}
          onPointerDown={handleVideoPointerDown}
          onClick={handleVideoClick}
          onPlay={() => {
            autoplayAttemptsRef.current = 0;
            setIsPlaying(true);
            setIsEnded(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsEnded(true);
            setIsBuffering(false);
            setShowControls(true);
          }}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (!video) return;
            setCurrentTime(video.currentTime);
            updateBuffered();
          }}
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (!video) return;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
            setLoading(false);
            setRetryCount(0);
            tryAutoPlay();
          }}
          onCanPlay={() => {
            setLoading(false);
            setIsBuffering(false);
            tryAutoPlay();
          }}
          onVolumeChange={() => {
            const video = videoRef.current;
            // Avoid muting side-effects during seeks on some browsers
            if (!video || seekingRef.current) return;
            setVolume(video.volume);
            setIsMuted(video.muted);
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onSeeked={() => setIsBuffering(false)}
          onProgress={updateBuffered}
          onError={() => scheduleRetry("video-error")}
          aria-label={title}
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* Initial loading / reconnecting overlay */}
      {loading && !fatalError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#0c1522]/95">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
          </div>
          <p className="text-xs font-medium text-white/70 sm:text-sm">
            {retryCount > 0
              ? `Reconnecting… (${retryCount}/${MAX_RETRIES})`
              : "Loading pitch…"}
          </p>
        </div>
      )}

      {/* Fatal error overlay */}
      {fatalError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 px-4">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <p className="text-sm text-white/85 sm:text-base">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setLoading(true);
                initHls();
              }}
              className="touch-manipulation rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Buffering spinner while playing */}
      {!loading && !fatalError && isBuffering && isPlaying && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-white/15" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          </div>
        </div>
      )}

      {/* Center play / replay overlay */}
      {!loading && !fatalError && !isPlaying && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-colors duration-300 ${
            isEnded ? "bg-black/60" : "bg-black/20"
          }`}
        >
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={isEnded ? replay : togglePlay}
              className="flex h-16 w-16 touch-manipulation items-center justify-center rounded-full bg-primary/90 text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/25 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-primary active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:h-20 sm:w-20"
              aria-label={isEnded ? "Watch again" : "Play video"}
            >
              {isEnded ? (
                <RotateCcw className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
              ) : (
                <Play
                  className="h-7 w-7 translate-x-0.5 sm:h-9 sm:w-9"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              )}
            </button>
            {isEnded && (
              <span className="text-sm font-medium text-white/90">Watch again</span>
            )}
          </div>
        </div>
      )}

      {/* Top bar: title + time remaining */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 transition-opacity duration-300 ${
          controlsVisible && !fatalError ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-3 pb-10 pt-3 sm:px-5 sm:pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(209_66%_49%_/_0.6)]"
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium text-white/95 sm:text-base">
              {title}
            </span>
          </div>
          {duration > 0 && !isEnded && (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm sm:text-xs"
              aria-label={`${formatTime(remainingTime)} remaining`}
            >
              <Timer className="h-3.5 w-3.5 text-v0-blue-300" aria-hidden="true" />
              {formatTime(remainingTime)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 transition-all duration-300 ease-out ${
          controlsVisible && !fatalError
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0"
        }`}
      >
        <div
          ref={controlsContainerRef}
          role="toolbar"
          aria-label="Video controls"
          className={`bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-2.5 pt-10 sm:px-4 sm:pb-3 ${
            controlsVisible && !fatalError ? "pointer-events-auto" : "pointer-events-none"
          }`}
          onPointerEnter={handleControlsPointerEnter}
          onPointerLeave={handleControlsPointerLeave}
          onPointerDown={handleControlsPointerEnter}
          onFocusCapture={handleControlsFocus}
          onBlurCapture={handleControlsBlur}
        >
          {/* Progress / seek */}
          <div className="group/progress relative flex h-7 w-full cursor-pointer items-center">
            <div className="relative h-1 w-full rounded-full bg-white/20 transition-all duration-150 group-hover/progress:h-1.5">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/25"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-v0-blue-400"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-primary transition-all duration-150 ${
                  isScrubbing
                    ? "scale-125 opacity-100"
                    : "opacity-100 sm:opacity-0 sm:group-hover/progress:opacity-100"
                }`}
                style={{ left: `calc(${progressPercent}% - 7px)` }}
                aria-hidden="true"
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="any"
              value={currentTime}
              onChange={handleSeek}
              onPointerDown={() => setIsScrubbing(true)}
              onPointerUp={() => setIsScrubbing(false)}
              onPointerCancel={() => setIsScrubbing(false)}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
              aria-label="Seek"
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-0.5 text-white sm:gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className={`${CONTROL_BUTTON_CLASS} bg-white/10`}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
              ) : (
                <Play
                  className="h-5 w-5 translate-x-[1px]"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className={CONTROL_BUTTON_CLASS}
              aria-label={isMuted || volume === 0 ? "Unmute video" : "Mute video"}
            >
              <VolumeIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Volume slider: SM+ screens only */}
            <div className="group/volume relative hidden h-8 w-20 shrink-0 cursor-pointer items-center sm:flex">
              <div className="relative h-1 w-full rounded-full bg-white/20">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{ width: `${volumePercent}%` }}
                />
                <div
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/volume:opacity-100"
                  style={{ left: `calc(${volumePercent}% - 5px)` }}
                  aria-hidden="true"
                />
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeSliderChange}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
                aria-label="Volume"
              />
            </div>

            <span className="ml-1 whitespace-nowrap text-[11px] font-medium tabular-nums text-white/90 sm:ml-1.5 sm:text-[13px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
              <button
                type="button"
                onClick={replay}
                className={CONTROL_BUTTON_CLASS}
                aria-label="Restart video"
              >
                <RotateCcw className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className={CONTROL_BUTTON_CLASS}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Maximize className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
