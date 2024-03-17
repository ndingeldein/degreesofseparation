import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import {
  Form,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useRouteError,
} from "@remix-run/react"
import debounce from "lodash.debounce"
import { toast } from "sonner"
import invariant from "tiny-invariant"

import { createGuess, getGame } from "~/models/game.server"
import type { ApiMovie, CastMember, Turn } from "~/models/schema"
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
        <div>
          <div className="mt-4 flex w-full justify-center text-center">
            {game.status === "Completed" ? (
              <div className="text-center">
                <span className="font-semibold text-success-400">
                  {game.result === "Player1Wins"
                    ? `${game.player1.name} Wins!`
                    : `${game.player2.name} Wins!`}
                </span>
                <Form
                  action={`/games/${game.id}/rematch`}
                  method="post"
                  className="flex justify-center text-center"
                >
                  <button
                    type="submit"
                    className="mt-2 flex flex-col items-center justify-center rounded bg-success-600 px-4 py-2 text-white hover:bg-success-500"
                  >
                    <span>Rematch</span>
                  </button>
                </Form>
              </div>
            ) : isUsersTurn ? (
              <div
                className={isGuessing ? "pointer-events-none opacity-50" : ""}
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
          <Turns turns={game.turns as Turn[]} />
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

function Turns({ turns }: { turns: Turn[] }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 pt-12">
      {turns.map((turn, index) => (
        <div key={turn.id}>
          {turn.status === "Success" ? (
            <CommonCast cast={turn.commonCast as CastMember[]} />
          ) : null}
          <div
            className={`${
              index ? "opacity-50 hover:opacity-100" : ""
            } flex w-auto flex-col items-center justify-center rounded-xl bg-gray-700 px-4 py-4 text-center shadow-lg md:w-[380px]`}
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
                    <span className="text-xs text-gray-400">
                      ({guess.movieYear})
                    </span>
                  </p>
                  <p className="text-gray-100">{guess.result ? "✅" : "❌"}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-xs italic">{turn.status}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
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
