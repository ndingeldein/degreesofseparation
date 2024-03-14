import type { User, Game, Prisma } from "@prisma/client";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";

export type { Game } from "@prisma/client";

enum GameStatus {
  Pending = "Pending",
  Ongoing = "Ongoing",
  Completed = "Completed",
}

enum GameResult {
  Player1Wins = "Player1Wins",
  Player2Wins = "Player2Wins",
  Draw = "Draw",
  Canceled = "Canceled",
}

enum TurnStatus {
  InProgress = "InProgress",
  Success = "Success",
  Fail = "Fail",
}

interface CastMember {
  id: number;
  name: string;
}

// Utility function to fetch movie titles by ID
// async function fetchMovieTitles(
//   movieIds: string[],
// ): Promise<Record<string, string>> {
//   const titles: Record<string, string> = {};
//   const uniqueIds = [...new Set(movieIds)]; // Remove duplicates

//   await Promise.all(
//     uniqueIds.map(async (id: string) => {
//       const response = await fetch(
//         `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`,
//       );
//       const { title } = await response.json();

//       titles[id] = title;
//     }),
//   );

//   return titles;
// }

export async function getNewMovie() {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1&region=US&api_key=${process.env.TMDB_API_KEY}`,
  );

  const data = await response.json();

  // get random movie from top rated
  const { id, title, release_date } =
    data.results[Math.floor(Math.random() * data.results.length)];

  return {
    newMovie: {
      id,
      title,
      release_date,
    },
  };
}

export async function createGame({
  userId,
  movieId,
  movieTitle,
  movieYear,
}: {
  userId: User["id"];
  movieId: number;
  movieTitle: string;
  movieYear: number;
}) {
  const player2 = await prisma.user.findFirst({
    where: {
      id: {
        not: userId,
      },
    },
    select: {
      id: true,
    },
  });

  invariant(player2, "player2 not found");

  const game = await prisma.game.create({
    data: {
      player1Id: userId,
      player2Id: player2.id,
      currentTurnUserId: player2.id,
    },
  });

  const cast = await fetchMovieCredits(movieId);

  await prisma.turn.create({
    data: {
      gameId: game.id,
      userId: player2.id,
      movieId: movieId,
      movieTitle: movieTitle,
      movieYear: movieYear,
      castIds: cast.map((c: CastMember) => c.id),
    },
    select: {
      id: true,
    },
  });

  return game;
}

async function fetchMovieCredits(movieId: number) {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.TMDB_API_KEY}`,
  );
  const { cast } = await response.json();
  return cast;
}

export async function findMovieCastConnection(
  castAIds: number[],
  movieB: number,
) {
  const castB = await fetchMovieCredits(movieB);

  // find matching cast ids and map to cast member objects of only id and name
  const commonCast = castB.filter((member: CastMember) =>
    castAIds.includes(member.id),
  );

  const commonCastOnlyNamesAndIds = commonCast.map((member: CastMember) => ({
    id: member.id,
    name: member.name,
  }));

  return commonCastOnlyNamesAndIds;
}

export async function searchMovies({ query }: { query: string }) {
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      query,
    )}&include_adult=false&language=en-US&page=1&api_key=${
      process.env.TMDB_API_KEY
    }`,
  );

  const data = await response.json();
  return { results: data.results.slice(0, 5) };
}

export async function getGame({
  id,
}: Pick<Game, "id"> & {
  userId: User["id"];
}) {
  const game = await prisma.game.findFirst({
    include: {
      turns: {
        orderBy: { createdAt: "desc" },
        include: { guesses: true },
      },
      player1: {
        select: { id: true, name: true },
      },
      player2: {
        select: { id: true, name: true },
      },
    },
    where: { id: id as string },
  });

  invariant(game, "game not found");
  invariant(game.turns, "no game turns found");

  return { game };
}

export function getPlayerGames({ userId }: { userId: User["id"] }) {
  return prisma.game.findMany({
    where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
    select: {
      id: true,
      player1: true,
      player2: true,
      status: true,
      result: true,
      currentTurnUserId: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getTurn(turnId: string) {
  const turn = await prisma.turn.findFirst({
    include: { guesses: true },
    where: {
      id: turnId,
    },
  });
  invariant(turn, "turn not found");
  return turn;
}

export async function createGuess({
  userId,
  gameId,
  player1Id,
  player2Id,
  guessMovieId,
  guessMovieTitle,
  guessMovieYear,
  turnId,
  turnMovieId,
}: {
  gameId: Game["id"];
  userId: User["id"];
  player1Id: User["id"];
  player2Id: User["id"];
  guessMovieId: number;
  guessMovieTitle: string;
  guessMovieYear: number;
  turnId: string;
  turnMovieId: number;
}) {
  console.log(`checking guess: ${turnMovieId} ${guessMovieId}`);

  // *** MOVED to guess box. should never happen
  // check if the movie has been used on a previous turn
  // const existingGuess = await prisma.turn.findFirst({
  //   where: {
  //     movieId: guessMovieId,
  //     status: TurnStatus.Success,
  //   },
  // });

  // if (existingGuess) {
  //   // const message = encodeURIComponent("Movie already used before");
  //   return redirect(`/games`);
  // }

  const currentTurn = await getTurn(turnId);

  const turnCastIds = currentTurn.castIds;

  const totalGuesses = currentTurn.guesses.length;

  const commonCast = await findMovieCastConnection(turnCastIds, guessMovieId);

  const result = commonCast.length > 0 ? true : false;

  console.log(`guess result: ${result}`);

  await prisma.guess.create({
    data: {
      turn: {
        connect: {
          id: turnId,
        },
      },
      movieId: guessMovieId,
      movieTitle: guessMovieTitle,
      movieYear: guessMovieYear,
      result: result,
    },
  });

  if (result) {
    const commonCastAsJson = commonCast as Prisma.JsonArray;

    console.log("common actors");
    console.log(commonCast);

    await prisma.turn.update({
      where: {
        id: turnId,
      },
      data: {
        status: TurnStatus.Success,
        commonCast: commonCastAsJson,
      },
    });

    // create new turn

    // get next movie title and year
    const nextMovieResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${guessMovieId}?api_key=${process.env.TMDB_API_KEY}`,
    );
    const { title, release_date } = await nextMovieResponse.json();

    const cast = await fetchMovieCredits(guessMovieId);

    const nextUserId = userId === player1Id ? player2Id : player1Id;

    await prisma.turn.create({
      data: {
        gameId: gameId,
        userId: nextUserId,
        movieId: guessMovieId,
        movieTitle: title,
        movieYear: new Date(release_date).getFullYear(),
        castIds: cast.map((c: CastMember) => c.id),
      },
    });

    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        currentTurnUserId: nextUserId,
        status: GameStatus.Ongoing,
      },
    });
  } else if (totalGuesses >= 2) {
    await prisma.turn.update({
      where: {
        id: turnId,
      },
      data: {
        status: TurnStatus.Fail,
      },
    });

    // end game
    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        result:
          userId === player1Id
            ? GameResult.Player2Wins
            : GameResult.Player1Wins,
        status: GameStatus.Completed,
      },
    });
  }

  return redirect(`/games/${gameId}`);
}

// export async function createTurn() {}
