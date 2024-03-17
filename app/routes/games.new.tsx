import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useFetcher, useSubmit } from "@remix-run/react"
import debounce from "lodash.debounce"
import invariant from "tiny-invariant"

import { createGame } from "~/models/game.server"
import type { ApiMovie } from "~/models/schema"
import { GuessBox } from "~/routes/movies-search"
import { requireUserId } from "~/session.server"
import { useUser } from "~/utils"

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)

  invariant(userId, "userId not found")

  const formData = await request.formData()

  invariant(formData.get("movieId"), "movieId not found")
  invariant(formData.get("movieTitle"), "movieTitle not found")
  invariant(formData.get("movieYear"), "movieYear not found")

  const movieId = Number(formData.get("movieId"))
  const movieTitle = String(formData.get("movieTitle"))
  const movieYear = Number(formData.get("movieYear"))

  const game = await createGame({
    userId,
    movieId,
    movieTitle,
    movieYear,
  })

  return redirect(`/games/${game.id}`)
}

export default function Page() {
  const user = useUser()
  const submit = useSubmit()
  const moviesFetcher = useFetcher<{ movies: ApiMovie[]; query: string }>()

  const movies = moviesFetcher.data?.movies || []

  // const isGuessing =
  //   guessFetcher.state !== "idle" || currentTurn.status !== "InProgress"
  const isGuessing = false

  return (
    <div className="flex w-full items-center justify-center">
      <div className="container max-w-screen-lg pt-12 text-center">
        <h1 className="font-semibold">Create New Game</h1>
        <div className="mt-6">
          <GuessBox
            movies={movies}
            isGuessing={isGuessing}
            handleOnValueChange={(currentValue) => {
              fetchMovies(currentValue, moviesFetcher)
            }}
            handleOnSelect={(movie: ApiMovie) => {
              const params = {
                userId: user.id,
                movieId: movie.id,
                movieTitle: movie.title,
                movieYear: new Date(movie.release_date)
                  .getFullYear()
                  .toString(),
              }
              submit(params, { method: "post" })
            }}
          />
        </div>
      </div>
    </div>
  )
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
