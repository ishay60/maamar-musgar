export type NodeType = "text" | "bracket" | "root";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  easy: "🟢",
  medium: "🟡",
  hard: "🔴",
};

export const DIFFICULTY_LABEL_HE: Record<Difficulty, string> = {
  easy: "קל",
  medium: "בינוני",
  hard: "קשה",
};
export type ClueType =
  | "definition"
  | "fill-blank"
  | "trivia"
  | "wordplay"
  | "association";

export interface PuzzleNode {
  id: string;
  type: NodeType;
  content?: string;
  clue?: string;
  answer?: string;
  children?: PuzzleNode[];
  difficulty?: Difficulty;
  clueType?: ClueType;
  acceptedAnswers?: string[];
  hint?: string;
}

export interface BracketSpec {
  answer: string;
  acceptedAnswers?: string[];
  clueType?: ClueType;
  difficulty?: Difficulty;
  hint?: string;
}

export interface Puzzle {
  id: string;
  date: string;
  title: string;
  finalSentence: string;
  historicalContext?: string;
  tree: PuzzleNode;
  totalBrackets: number;
  maxScore: number;
  language: "he";
  tags?: string[];
  difficulty?: Difficulty;
}
