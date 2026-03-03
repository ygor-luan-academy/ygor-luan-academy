interface ProgressTrackerProps {
  totalLessons: number;
  completedLessons: number;
}

export default function ProgressTracker({
  totalLessons,
  completedLessons,
}: ProgressTrackerProps) {
  const percentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">
          {completedLessons} de {totalLessons} aulas concluídas
        </span>
        <span className="font-medium text-white">{percentage}%</span>
      </div>

      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {percentage === 100 && (
        <p className="text-green-400 text-sm font-medium">
          🎉 Parabéns! Você concluiu o curso!
        </p>
      )}
    </div>
  );
}
