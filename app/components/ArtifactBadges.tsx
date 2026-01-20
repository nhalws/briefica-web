interface ArtifactBadgesProps {
  hasTopGrade: boolean;
  isProfessorVerified: boolean;
}

export function ArtifactBadges({ 
  hasTopGrade, 
  isProfessorVerified 
}: ArtifactBadgesProps) {
  if (!hasTopGrade && !isProfessorVerified) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {hasTopGrade && (
        <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-600 rounded-full text-yellow-500 text-sm flex items-center gap-1.5">
          <span>🏆</span>
          <span className="font-medium">Top Grade</span>
        </span>
      )}
      
      {isProfessorVerified && (
        <span className="px-3 py-1 bg-blue-900/30 border border-blue-600 rounded-full text-blue-500 text-sm flex items-center gap-1.5">
          <span>👨‍🏫</span>
          <span className="font-medium">Professor Verified</span>
        </span>
      )}
    </div>
  );
}
