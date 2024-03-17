import type { User, Game, Prisma } from "@prisma/client"
import invariant from "tiny-invariant"

import { prisma } from "~/db.server"
import type { CastMember } from "~/models/schema"
import {
  ApiMovieSchema,
  ApiMoviesSchema,
  CastMembersSchema,
  GameResultSchema,
  GameStatusSchema,
  TurnStatusSchema,
} from "~/models/schema"

export type { Game } from "@prisma/client"

export async function getNewMovie() {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1&region=US&api_key=${process.env.TMDB_API_KEY}`,
  )

  const data = await response.json()

  // get random movie from top rated
  const newMovie = ApiMovieSchema.parse(
    data.results[Math.floor(Math.random() * data.results.length)],
  )

  return { newMovie }
}

export async function createGame({
  userId,
  movieId,
  movieTitle,
  movieYear,
}: {
  userId: User["id"]
  movieId: number
  movieTitle: string
  movieYear: number
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
  })

  invariant(player2, "player2 not found")

  const game = await prisma.game.create({
    data: {
      player1Id: userId,
      player2Id: player2.id,
      currentTurnUserId: player2.id,
    },
  })

  const cast = await fetchMovieCredits(movieId)

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
  })

  return game
}

async function fetchMovieCredits(movieId: number) {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.TMDB_API_KEY}`,
  )
  const data = await response.json()

  const cast = CastMembersSchema.parse(data.cast)

  return cast
}

export async function findMovieCastConnection(
  castAIds: number[],
  movieB: number,
) {
  const castB = await fetchMovieCredits(movieB)

  // find matching cast ids
  // CastMember are mapped automatically with Zod schema
  const commonCast = castB.filter((member: CastMember) =>
    castAIds.includes(member.id),
  )

  return commonCast
}

export async function searchMovies({ query }: { query: string }) {
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      query,
    )}&include_adult=false&language=en-US&page=1&api_key=${
      process.env.TMDB_API_KEY
    }`,
  )

  const data = await response.json()
  return { results: ApiMoviesSchema.parse(data.results.slice(0, 5)) }
}

export async function getGame({
  id,
}: Pick<Game, "id"> & {
  userId: User["id"]
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
  })

  invariant(game, "game not found")
  invariant(game.turns, "no game turns found")

  return { game }
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
  })
}

async function getTurn(turnId: string) {
  const turn = await prisma.turn.findFirst({
    include: { guesses: true },
    where: {
      id: turnId,
    },
  })
  invariant(turn, "turn not found")
  return turn
}

async function createNextTurn({
  commonCast,
  gameId,
  userId,
  player1Id,
  player2Id,
  turnId,
  guessMovieId,
}: {
  commonCast: CastMember[]
  gameId: string
  userId: string
  player1Id: string
  player2Id: string
  turnId: string
  guessMovieId: number
}) {
  const commonCastAsJson = commonCast as Prisma.JsonArray

  // console.log("common actors")
  // console.log(commonCast)

  // previous turn was a success
  await prisma.turn.update({
    where: {
      id: turnId,
    },
    data: {
      status: TurnStatusSchema.enum.Success,
      commonCast: commonCastAsJson,
    },
  })

  // create new turn

  // get next movie title and year
  const nextMovieResponse = await fetch(
    `https://api.themoviedb.org/3/movie/${guessMovieId}?api_key=${process.env.TMDB_API_KEY}`,
  )
  const { title, release_date } = await nextMovieResponse.json()

  const cast = await fetchMovieCredits(guessMovieId)

  const nextUserId = userId === player1Id ? player2Id : player1Id

  await prisma.turn.create({
    data: {
      gameId: gameId,
      userId: nextUserId,
      movieId: guessMovieId,
      movieTitle: title,
      movieYear: new Date(release_date).getFullYear(),
      castIds: cast.map((c: CastMember) => c.id),
    },
  })

  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      currentTurnUserId: nextUserId,
      status: GameStatusSchema.enum.Ongoing,
    },
  })
}

async function endGame({
  gameId,
  player1Id,
  userId,
}: {
  gameId: string
  player1Id: string
  userId: string
}) {
  const result =
    userId === player1Id
      ? GameResultSchema.enum.Player2Wins
      : GameResultSchema.enum.Player1Wins

  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      status: GameStatusSchema.enum.Completed,
      result: result,
    },
  })
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
  gameId: Game["id"]
  userId: User["id"]
  player1Id: User["id"]
  player2Id: User["id"]
  guessMovieId: number
  guessMovieTitle: string
  guessMovieYear: number
  turnId: string
  turnMovieId: number
}) {
  // console.log(`checking guess: ${turnMovieId} ${guessMovieId}`)

  if (turnMovieId === guessMovieId) {
    return
  }

  const currentTurn = await getTurn(turnId)

  const turnCastIds = currentTurn.castIds

  const totalGuesses = currentTurn.guesses.length

  // check if guess has any connections
  const commonCast = await findMovieCastConnection(turnCastIds, guessMovieId)

  let notification = null

  //
  if (commonCast.length > 0) {
    // check if commonCast includes castMember.id from previous turns commonCast
    const previousTurns = await prisma.turn.findMany({
      where: {
        gameId: gameId,
        status: TurnStatusSchema.enum.Success,
      },
      select: {
        commonCast: true,
      },
    })

    const castMemberCounts = new Map()
    const previousTurnCommonCasts = previousTurns
      .filter((previousTurn) => previousTurn.commonCast !== null)
      .map((previousTurn) => CastMembersSchema.parse(previousTurn.commonCast))

    previousTurnCommonCasts.forEach((cast) => {
      cast.forEach((castMember: CastMember) => {
        const currentCount = castMemberCounts.get(castMember.id) || 0
        castMemberCounts.set(castMember.id, currentCount + 1)
      })
    })

    const isCastMemberOverused = commonCast.some((castMember) => {
      const appearances = castMemberCounts.get(castMember.id) || 0
      return appearances >= 3
    })

    if (isCastMemberOverused) {
      notification = "Actor has already been used three times!"
      // console.log(`notification: ${notification}`)

      await prisma.notification.create({
        data: {
          userId: userId,
          message: notification,
        },
      })
      return
    }
  }

  const result = commonCast.length > 0 ? true : false
  // console.log(`guess result: ${result}`)

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
  })

  if (result) {
    await createNextTurn({
      commonCast,
      gameId,
      userId,
      player1Id,
      player2Id,
      turnId,
      guessMovieId,
    })
  } else if (totalGuesses >= 2) {
    // mark turn as failed
    await prisma.turn.update({
      where: {
        id: turnId,
      },
      data: {
        status: TurnStatusSchema.enum.Fail,
      },
    })

    // end game
    endGame({ gameId, player1Id, userId })
  }
}

// export async function createTurn() {}
