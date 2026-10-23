import { getChessLevel, type ChessLevelId } from "@cxedu/core";

const ICONS: Record<ChessLevelId, string> = {
  pawn: "♟",
  knight: "♞",
  bishop: "♝",
  rook: "♜",
  queen: "♛",
  king: "♚",
};

export const LevelBadge = ({ level }: { level: ChessLevelId }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
    <span aria-hidden>{ICONS[level]}</span>
    Cấp {getChessLevel(level).name}
  </span>
);
