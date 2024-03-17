import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useFetcher, useSubmit } from "@remix-run/react"
import debounce from "lodash.debounce"
import { useState } from "react"
import invariant from "tiny-invariant"

import { createGame } from "~/models/game.server"
import type { ApiMovie } from "~/models/schema"
import { GuessBox } from "~/routes/movies-search"
import { requireUserId } from "~/session.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)

  invariant(userId, "userId not found")

  const formData = await request.formData()

  invariant(formData.get("movieId"), "movieId not found")
  invariant(formData.get("movieTitle"), "movieTitle not found")
  invariant(formData.get("movieYear"), "movieYear not found")

  invariant(formData.get("destinationMovieId"), "destinationMovieId not found")
  invariant(
    formData.get("destinationMovieTitle"),
    "destinationMovieTitle not found",
  )
  invariant(
    formData.get("destinationMovieYear"),
    "destinationMovieYear not found",
  )

  const movieId = Number(formData.get("movieId"))
  const movieTitle = String(formData.get("movieTitle"))
  const movieYear = Number(formData.get("movieYear"))

  const destinationMovieId = Number(formData.get("destinationMovieId"))
  const destinationMovieTitle = String(formData.get("destinationMovieTitle"))
  const destinationMovieYear = Number(formData.get("destinationMovieYear"))

  const movieData = {
    userId,
    movieId,
    movieTitle,
    movieYear,
    destinationMovieId,
    destinationMovieTitle,
    destinationMovieYear,
  }

  const game = await createGame(movieData)

  return redirect(`/games/${game.id}`)
}

const defaultMovieParams = {
  movieId: 105,
  movieTitle: "Back to the Future",
  movieYear: 1985,
}

const defaultDestinationMovieParams = {
  destinationMovieId: 5925,
  destinationMovieTitle: "The Great Escape",
  destinationMovieYear: 1963,
}

export default function Page() {
  const submit = useSubmit()
  const moviesFetcher = useFetcher<{ movies: ApiMovie[]; query: string }>()
  const destinationMoviesFetcher = useFetcher<{
    movies: ApiMovie[]
    query: string
  }>()

  const movies = moviesFetcher.data?.movies || []
  const destinationMovies = destinationMoviesFetcher.data?.movies || []

  const isGuessing =
    moviesFetcher.state !== "idle" || destinationMoviesFetcher.state !== "idle"

  const [movieParams, setMovieParams] = useState(defaultMovieParams)
  const [destinationMovieParams, setDestinationMovieParams] = useState(
    defaultDestinationMovieParams,
  )

  return (
    <div className="flex w-full items-center justify-center">
      <div className="container max-w-screen-sm pt-12 text-center">
        <h1 className="font-semibold">Create New Game</h1>
        <div className="mx-auto mt-6 flex w-full max-w-[400px]">
          <div
            className={
              isGuessing
                ? "pointer-events-none w-full flex-col items-center space-y-6 opacity-50"
                : "w-full flex-col items-center space-y-6"
            }
          >
            <GuessBox
              movies={movies}
              isGuessing={isGuessing}
              handleOnValueChange={(currentValue) => {
                fetchMovies(currentValue, moviesFetcher)
              }}
              handleOnSelect={(movie: ApiMovie) => {
                const params = {
                  movieId: movie.id,
                  movieTitle: movie.title,
                  movieYear: new Date(movie.release_date).getFullYear(),
                }
                setMovieParams(params)
              }}
              buttonText={`Starting: ${movieParams.movieTitle}`}
            />
            <GuessBox
              movies={destinationMovies}
              isGuessing={isGuessing}
              handleOnValueChange={(currentValue) => {
                fetchMovies(currentValue, destinationMoviesFetcher)
              }}
              handleOnSelect={(movie: ApiMovie) => {
                const params = {
                  destinationMovieId: movie.id,
                  destinationMovieTitle: movie.title,
                  destinationMovieYear: new Date(
                    movie.release_date,
                  ).getFullYear(),
                }
                setDestinationMovieParams(params)
              }}
              buttonText={`Destination: ${destinationMovieParams.destinationMovieTitle}`}
              keyCode="j"
            />
            <button
              type="submit"
              className="focus:bg-blue-400 mx-auto flex w-full justify-center rounded bg-success-600 px-4 py-2 font-medium text-white hover:bg-success-500"
              onClick={() => {
                submit(
                  {
                    ...movieParams,
                    ...destinationMovieParams,
                  },
                  { method: "post" },
                )
              }}
            >
              Create Game
            </button>
          </div>
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
