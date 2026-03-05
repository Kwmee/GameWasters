export type UserGenreStatsRow = {
  hashedSteamId: string;
  genreName: string;
  playtimeHours: number;
  gamesCount: number;
  percentage: number;
};

export type GenreWeights = Record<string, number>;

export type SteamTopGame = {
  appId: number;
  title: string;
  gameGenres: string[];
  concurrentPlayers?: number;
};

export type RankedGame = {
  appId: number;
  title: string;
  score: number;
};

type WeightParams = {
  hRef: number;
  gRef: number;
  alpha: number;
  lambda: number;
  epsilon: number;
};

type MatchParams = {
  sumWeight: number;
  maxWeight: number;
  overlapBase: number;
  overlapScale: number;
  popularityWeight: number;
};

const DEFAULT_WEIGHT_PARAMS: WeightParams = {
  hRef: 500,
  gRef: 20,
  alpha: 0.55,
  lambda: 0.7,
  epsilon: 1e-9,
};

const DEFAULT_MATCH_PARAMS: MatchParams = {
  sumWeight: 0.6,
  maxWeight: 0.4,
  overlapBase: 0.4,
  overlapScale: 0.6,
  popularityWeight: 0.12,
};

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function normalizeGenreName(name: string): string {
  return name.trim().toLowerCase();
}

function logNormalized(value: number, reference: number): number {
  if (reference <= 0) return 0;
  return clamp01(Math.log1p(Math.max(0, value)) / Math.log1p(reference));
}

function normalizeWeightsBySum(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return {};
  }

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = value / total;
  }

  return normalized;
}

export function computeGenreWeights(stats: UserGenreStatsRow[]): GenreWeights {
  if (stats.length === 0) {
    return {};
  }

  const params = DEFAULT_WEIGHT_PARAMS;
  const rawWeights: GenreWeights = {};

  for (const row of stats) {
    const genreKey = normalizeGenreName(row.genreName);
    const h = Math.max(0, row.playtimeHours);
    const g = Math.max(0, row.gamesCount);
    const p = clamp01(row.percentage / 100);

    const hn = logNormalized(h, params.hRef);
    const gn = logNormalized(g, params.gRef);
    const harmonic = (2 * hn * gn) / (hn + gn + params.epsilon);
    const linear = params.alpha * hn + (1 - params.alpha) * gn;
    const structure = params.lambda * harmonic + (1 - params.lambda) * linear;
    const rawWeight = Math.sqrt(p) * structure;

    rawWeights[genreKey] = (rawWeights[genreKey] ?? 0) + rawWeight;
  }

  return normalizeWeightsBySum(rawWeights);
}

export function scoreSteamGame(
  genreWeights: GenreWeights,
  game: SteamTopGame,
  popularityBounds?: { min: number; max: number },
): number {
  const params = DEFAULT_MATCH_PARAMS;
  const genres = game.gameGenres.map(normalizeGenreName).filter(Boolean);

  if (genres.length === 0) {
    return 0;
  }

  let sumMatch = 0;
  let maxMatch = 0;
  let overlapCount = 0;

  for (const genre of genres) {
    const weight = genreWeights[genre] ?? 0;
    sumMatch += weight;
    if (weight > maxMatch) {
      maxMatch = weight;
    }
    if (weight > 0) {
      overlapCount += 1;
    }
  }

  if (sumMatch <= 0) {
    return 0;
  }

  const overlapRatio = overlapCount / genres.length;
  const base = params.sumWeight * sumMatch + params.maxWeight * maxMatch;
  const overlapPenalty = params.overlapBase + params.overlapScale * overlapRatio;

  let popularityBonus = 0;
  if (
    popularityBounds &&
    typeof game.concurrentPlayers === "number" &&
    popularityBounds.max > popularityBounds.min
  ) {
    const normalizedPopularity =
      (game.concurrentPlayers - popularityBounds.min) /
      (popularityBounds.max - popularityBounds.min);
    popularityBonus = params.popularityWeight * clamp01(normalizedPopularity);
  }

  return base * overlapPenalty + popularityBonus;
}

export function scoreGamesByGenreWeights(
  genreWeights: GenreWeights,
  steamTopGames: SteamTopGame[],
): RankedGame[] {
  if (steamTopGames.length === 0) {
    return [];
  }

  const concurrentValues = steamTopGames
    .map((game) => game.concurrentPlayers)
    .filter((value): value is number => typeof value === "number");

  const popularityBounds =
    concurrentValues.length > 0
      ? { min: Math.min(...concurrentValues), max: Math.max(...concurrentValues) }
      : undefined;

  return steamTopGames
    .map((game) => ({
      appId: game.appId,
      title: game.title,
      score: scoreSteamGame(genreWeights, game, popularityBounds),
    }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

