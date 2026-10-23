/** Lộ trình đào tạo 6 cấp của Dương Sinh. */
export const CHESS_LEVELS = [
  { id: "pawn", order: 1, name: "Tốt", englishName: "Pawn" },
  { id: "knight", order: 2, name: "Mã", englishName: "Knight" },
  { id: "bishop", order: 3, name: "Tượng", englishName: "Bishop" },
  { id: "rook", order: 4, name: "Xe", englishName: "Rook" },
  { id: "queen", order: 5, name: "Hậu", englishName: "Queen" },
  { id: "king", order: 6, name: "Vua", englishName: "King" },
] as const;

export type ChessLevelId = (typeof CHESS_LEVELS)[number]["id"];

export const chessLevelIds = CHESS_LEVELS.map((level) => level.id) as [
  ChessLevelId,
  ...ChessLevelId[],
];

export const getChessLevel = (id: ChessLevelId) =>
  CHESS_LEVELS.find((level) => level.id === id) ?? CHESS_LEVELS[0];

/** Cấp kế tiếp, hoặc `null` khi đã ở cấp Vua. */
export const nextChessLevel = (id: ChessLevelId) => {
  const current = getChessLevel(id);
  return (
    CHESS_LEVELS.find((level) => level.order === current.order + 1) ?? null
  );
};
