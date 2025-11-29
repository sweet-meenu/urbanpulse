"use client";

import { useEffect, useRef, useState } from "react";

export default function Loading() {
  const playerRef = useRef<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let mountedFlag = true;
    (async () => {
      try {
        await import("@lottiefiles/lottie-player");
        if (mountedFlag) setMounted(true);
      } catch (e) {
        console.error("[Loading] failed to load lottie-player", e);
      }
    })();

    return () => {
      mountedFlag = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted || !playerRef.current) return;
    const player = playerRef.current;
    const onComplete = () => {
      // keep looping while loading; handled via `loop` attribute
    };
    player.addEventListener("complete", onComplete);
    return () => player.removeEventListener("complete", onComplete);
  }, [mounted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-6 p-6 rounded-xl bg-white/5 backdrop-blur-md mx-4 sm:mx-0">
        <div className="w-32 h-32 sm:w-40 sm:h-40">
          {mounted ? (
            // @ts-expect-error custom element
            <lottie-player
              ref={playerRef}
              src="/loading.lottie"
              background="transparent"
              speed={1}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div role="status" aria-live="polite" className="text-white text-base sm:text-2xl font-semibold text-center">
          Opening Your Dashboard ...
        </div>
      </div>
    </div>
  );
}
