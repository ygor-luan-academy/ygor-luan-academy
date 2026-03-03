import { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  initialWatchTime?: number;
  onComplete?: () => void;
}

// Extracts Vimeo ID from URL like https://vimeo.com/123456789
function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function VideoPlayer({
  lessonId,
  videoUrl,
  initialWatchTime = 0,
  onComplete,
}: VideoPlayerProps) {
  const [completed, setCompleted] = useState(false);
  const watchTimeRef = useRef(initialWatchTime);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vimeoId = extractVimeoId(videoUrl);
  const embedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?autoplay=0&color=D97706&title=0&byline=0&portrait=0`
    : null;

  const saveWatchTime = async (time: number) => {
    await fetch('/api/progress/watch-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, watchTime: Math.floor(time) }),
    });
  };

  const markComplete = async () => {
    if (completed) return;
    setCompleted(true);

    await fetch('/api/progress/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId }),
    });

    onComplete?.();
  };

  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      watchTimeRef.current += 30;
      saveWatchTime(watchTimeRef.current);
    }, 30_000);

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [lessonId]);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
        URL de vídeo inválida
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Aula"
        />
      </div>

      {!completed && (
        <button
          onClick={markComplete}
          className="btn-secondary text-sm px-4 py-2"
        >
          ✓ Marcar como concluída
        </button>
      )}

      {completed && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span>✓</span>
          <span>Aula concluída!</span>
        </div>
      )}
    </div>
  );
}
