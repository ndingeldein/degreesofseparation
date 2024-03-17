import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import {
  Link,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useRouteError,
} from "@remix-run/react"
import debounce from "lodash.debounce"
import { toast } from "sonner"
import invariant from "tiny-invariant"

import { createGuess, getGame } from "~/models/game.server"
import { ApiMovie, CastMember, Turn, TurnStatusSchema } from "~/models/schema"
import { GuessBox } from "~/routes/movies-search"
import { requireUserId } from "~/session.server"
import { useUser } from "~/utils"

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await requireUserId(request)
  const formData = await request.formData()

  const userId = String(formData.get("userId"))
  const gameId = String(formData.get("gameId"))
  const player1Id = String(formData.get("player1Id"))
  const player2Id = String(formData.get("player2Id"))
  const guessMovieId = Number(formData.get("guessMovieId"))
  const guessMovieTitle = String(formData.get("guessMovieTitle"))
  const guessMovieYear = Number(formData.get("guessMovieYear"))
  const turnMovieId = Number(formData.get("turnMovieId"))
  const turnId = String(formData.get("turnId"))

  invariant(userId, "userId not found")
  invariant(gameId, "gameId not found")
  invariant(player1Id, "player1Id not found")
  invariant(player2Id, "player2Id not found")
  invariant(guessMovieId, "guessMovieId not found")
  invariant(guessMovieTitle, "guessMovieTitle not found")
  invariant(guessMovieYear, "guessMovieYear not found")
  invariant(turnMovieId, "turnMovieId not found")
  invariant(turnId, "turnId not found")

  await createGuess({
    gameId,
    userId,
    player1Id,
    player2Id,
    guessMovieId,
    guessMovieTitle,
    guessMovieYear,
    turnId,
    turnMovieId,
  })

  return redirect(`/games/${params.gameId}`)
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  invariant(params.gameId, "gameId not found")

  const { game } = await getGame({ id: params.gameId, userId })
  if (!game) {
    throw new Response("Not Found", { status: 404 })
  }

  return json({ game })
}

export default function GamePage() {
  const user = useUser()
  const { game } = useLoaderData<typeof loader>()

  // current turn is most recently created turn
  const currentTurn: Turn = game.turns[0] as Turn

  const movie = {
    id: currentTurn.movieId,
    title: currentTurn.movieTitle,
  }

  const moviesFetcher = useFetcher<{ movies: ApiMovie[]; query: string }>()
  const guessFetcher = useFetcher()

  const movies =
    moviesFetcher.data?.movies.filter((m) => m.id != movie.id) ?? []

  const isUsersTurn = game.currentTurnUserId === user.id

  const isGuessing =
    guessFetcher.state !== "idle" || currentTurn.status !== "InProgress"

  return (
    <div className="flex w-full items-center justify-center">
      <div className="container max-w-screen-lg pt-12">
        <div className="flex items-center justify-between rounded-xl bg-gray-800 px-6 py-2 shadow-lg">
          <div className="w-36 text-sm font-medium text-gray-100">
            {game.player1.name}
          </div>
          <div className="text-center text-xl font-black uppercase text-gray-400">
            VS
          </div>
          <div className="w-36 text-right text-sm font-medium text-gray-100">
            {game.player2.name}
          </div>
        </div>
        <div className="mt-3 flex justify-center text-center">
          <div className="rounded border border-success-500/50 bg-success-600/20 px-3 py-1.5 text-sm">
            <p className="inline-block font-semibold text-success-400">
              Destination:
            </p>{" "}
            <p className="inline-block text-success-50">
              {game.destinationMovieTitle}{" "}
              <span className="text-xs text-success-300">
                ({game.destinationMovieYear})
              </span>
            </p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mt-4 flex w-full justify-center text-center">
            {game.status === "Completed" ? (
              <div className="text-center">
                <span className="font-semibold text-success-400">
                  {game.result === "Player1Wins"
                    ? `${game.player1.name} Wins!`
                    : `${game.player2.name} Wins!`}{" "}
                </span>

                <Link
                  to="/games/new"
                  className="mt-2 flex flex-col items-center justify-center rounded bg-success-600 px-4 py-2 text-white hover:bg-success-500"
                >
                  <span>Rematch</span>
                </Link>
              </div>
            ) : isUsersTurn ? (
              <div
                className={
                  isGuessing
                    ? "pointer-events-none w-full opacity-50"
                    : "w-full"
                }
              >
                <GuessBox
                  movies={movies}
                  isGuessing={isGuessing}
                  handleOnValueChange={(currentValue) => {
                    fetchMovies(currentValue, moviesFetcher)
                  }}
                  handleOnSelect={(movie: ApiMovie) => {
                    if (user.id !== game.currentTurnUserId) {
                      toast.warning("It's not your turn to guess.")
                      return
                    }

                    if (
                      checkIfGuessHasBeenUsed(game.turns as Turn[], movie.id)
                    ) {
                      toast.warning(`${movie.title} has already been used.`)
                      return
                    }

                    const params = {
                      gameId: game.id,
                      player1Id: game.player1.id,
                      player2Id: game.player2.id,
                      userId: user.id,
                      turnId: currentTurn.id,
                      turnMovieId: currentTurn.movieId,
                      guessMovieId: movie.id,
                      guessMovieTitle: movie.title,
                      guessMovieYear: new Date(movie.release_date)
                        .getFullYear()
                        .toString(),
                    }
                    guessFetcher.submit(params, { method: "POST" })
                  }}
                />
              </div>
            ) : (
              <div className="rounded bg-black px-4 py-2">
                Waiting for opponent to guess
              </div>
            )}
          </div>
          {game.winCondition && game.winCondition === "DestinationMovie" ? (
            <div className="mt-6 flex w-full justify-center">
              <div className="flex w-auto flex-col rounded-xl bg-gray-700 px-4 py-4 text-center shadow-lg md:w-[380px]">
                <p className="w-full border-b border-dashed border-gray-600 px-4 pb-2 text-center text-sm font-semibold uppercase tracking-wide text-success-300">
                  Destination Connection!
                </p>
                <p className="mt-3 line-clamp-1 text-gray-100">
                  {game.destinationMovieTitle} ({game.destinationMovieYear})
                </p>
                <div className="mt-3">
                  <p className="text-xs italic">
                    {game.turns.length}° of Separation!
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <Turns
            turns={game.turns as Turn[]}
            player1={game.player1}
            player2={game.player2}
          />
        </div>
      </div>
    </div>
  )
}

function CommonCast({ cast }: { cast: CastMember[] }) {
  // maximum number of names to display
  const maxNames = 5
  return (
    <ul className="mx-auto mb-6 w-[250px] max-w-full space-y-1 text-center">
      {cast.slice(0, maxNames).map((castMember: CastMember) => (
        <li
          key={castMember.id}
          className="rounded border border-transparent bg-success-600 px-2 py-1 shadow-md"
        >
          <p className="mr-3 line-clamp-1 text-center text-xs text-gray-100">
            {castMember.name}
          </p>
        </li>
      ))}
      {cast.length > 5 ? (
        <li className="rounded border border-success-600/70 px-2 py-1 shadow-md">
          <p className="mr-3 line-clamp-1 text-center text-xs text-gray-100">
            +{cast.length - maxNames} more
          </p>
        </li>
      ) : null}
    </ul>
  )
}

interface TurnUser {
  id: string
  name: string
}

function Turns({
  turns,
  player1,
  player2,
}: {
  turns: Turn[]
  player1: TurnUser
  player2: TurnUser
}) {
  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-col items-center justify-center space-y-6 pt-6">
      {turns.map((turn, index) => (
        <div key={turn.id} className="w-full">
          {turn.status === "Success" ? (
            <CommonCast cast={turn.commonCast as CastMember[]} />
          ) : null}
          <TurnCard
            turn={turn}
            index={index}
            player={turn.userId === player1.id ? player1 : player2}
          />
        </div>
      ))}
    </div>
  )
}

function TurnCard({
  turn,
  index,
  player,
}: {
  turn: Turn
  index: number
  player: TurnUser
}) {
  return (
    <div
      className={`${
        index ? "opacity-50 hover:opacity-100" : ""
      } flex w-full flex-col items-center justify-center rounded-xl bg-gray-700 px-4 py-4 text-center shadow-lg`}
    >
      <p className="line-clamp-1 text-gray-100">
        {turn.movieTitle} ({turn.movieYear})
      </p>
      <div className="mt-3 flex flex-col space-y-0.5 text-xs">
        {turn.guesses.map((guess) => (
          <div
            key={guess.id}
            className="text flex items-center justify-between rounded bg-gray-600 px-2 py-1"
          >
            <p className="mr-3 line-clamp-1 text-gray-100">
              {guess.movieTitle}{" "}
              <span className="text-xs text-gray-400">({guess.movieYear})</span>
            </p>
            <p className="text-gray-100">{guess.result ? "✅" : "❌"}</p>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <p className="text-xs italic">{getPlayerTurnStatus(turn, player)}</p>
      </div>
    </div>
  )
}

function getPlayerTurnStatus(turn: Turn, player: TurnUser) {
  if (turn.status === TurnStatusSchema.enum.Success) {
    return `Successful guess by ${player.name}`
  }

  if (turn.status === TurnStatusSchema.enum.Fail) {
    return `Too many wrong guesses by ${player.name}`
  }

  return `${player.name}'s turn in progress...`
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>
  }

  if (error.status === 404) {
    return <div>Game or Movie not found</div>
  }

  return <div>An unexpected error occurred: {error.statusText}</div>
}

function checkIfGuessHasBeenUsed(turns: Turn[], movieId: number) {
  return turns.some((turn: Turn) => {
    return turn.movieId == movieId
  })
  return false
}

const fetchMovies = debounce((query, fetcher) => {
  query &&
    query.length > 1 &&
    fetcher.submit(
      { query: query },
      {
        method: "get",
        action: "/movies-search",
      },
    )
}, 300)
