import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import debounce from "lodash.debounce";
import invariant from "tiny-invariant";

import { createGuess, getGame } from "~/models/game.server";
import { GuessBox } from "~/routes/movies-search";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

// interface Movie {
//   id: string;
//   title: string;
//   year: number;
// }

interface ApiMovie {
  id: string;
  title: string;
  release_date: string;
}

interface Guess {
  id: string;
  movieId: string;
  movieTitle: string;
  movieYear: number;
  result: boolean;
}

interface Turn {
  id: string;
  movieId: string;
  movieTitle: string;
  movieYear: number;
  guesses: Guess[];
  status: string;
  castIds?: number[];
  commonCast?: CastMember[] | null;
}

interface CastMember {
  id?: number;
  name?: string;
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await requireUserId(request);
  const formData = await request.formData();

  const userId = String(formData.get("userId"));
  const gameId = String(formData.get("gameId"));
  const player1Id = String(formData.get("player1Id"));
  const player2Id = String(formData.get("player2Id"));
  const guessMovieId = String(formData.get("guessMovieId"));
  const guessMovieTitle = String(formData.get("guessMovieTitle"));
  const guessMovieYear = Number(formData.get("guessMovieYear"));
  const turnMovieId = String(formData.get("turnMovieId"));
  const turnId = String(formData.get("turnId"));

  invariant(userId, "userId not found");
  invariant(gameId, "gameId not found");
  invariant(player1Id, "player1Id not found");
  invariant(player2Id, "player2Id not found");
  invariant(guessMovieId, "guessMovieId not found");
  invariant(guessMovieTitle, "guessMovieTitle not found");
  invariant(guessMovieYear, "guessMovieYear not found");
  invariant(turnMovieId, "turnMovieId not found");
  invariant(turnId, "turnId not found");

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
  });

  return redirect(`/games/${params.gameId}`);
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.gameId, "gameId not found");

  const { game } = await getGame({ id: params.gameId, userId });
  if (!game) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ game });
};

const fetchMovies = debounce((query, fetcher) => {
  query &&
    query.length > 1 &&
    fetcher.submit(
      { query: query },
      {
        method: "get",
        action: "/movies-search",
      },
    );
}, 300);

export default function GamePage() {
  const user = useUser();
  const { game } = useLoaderData<typeof loader>();

  // current turn is most recently created turn
  const currentTurn: Turn = game.turns[0] as Turn;

  const movie = {
    id: currentTurn.movieId,
    title: currentTurn.movieTitle,
  };

  const moviesFetcher = useFetcher<{ movies: ApiMovie[]; query: string }>();
  const guessFetcher = useFetcher();

  const movies =
    moviesFetcher.data?.movies.filter((m) => m.id != movie.id) ?? [];

  const isUsersTurn = game.currentTurnUserId === user.id;

  const isGuessing =
    guessFetcher.state === "submitting" ||
    guessFetcher.state === "loading" ||
    currentTurn.status !== "InProgress";

  return (
    <div className="w-full flex items-center justify-center">
      <div className="container max-w-screen-lg pt-12">
        <div className="flex justify-between py-2 px-6 bg-gray-800 items-center rounded-xl shadow-lg">
          <div className="text-sm font-medium text-gray-100 w-36">
            {game.player1.name}
          </div>
          <div className="text-xl font-black uppercase text-gray-400 text-center">
            VS
          </div>
          <div className="text-sm font-medium text-gray-100 w-36 text-right">
            {game.player2.name}
          </div>
        </div>
        <div>
          <div className="flex mt-4 w-full justify-center">
            {game.status === "Completed" ? (
              <div className="bg-success-600 text-white rounded px-4 py-2">
                {game.result === "Player1Wins"
                  ? `${game.player1.name} Wins!`
                  : `${game.player2.name} Wins!`}
              </div>
            ) : isUsersTurn ? (
              <div
                className={isGuessing ? "opacity-50 pointer-events-none" : ""}
              >
                <GuessBox
                  movies={movies}
                  isGuessing={isGuessing}
                  handleOnValueChange={(currentValue) => {
                    fetchMovies(currentValue, moviesFetcher);
                  }}
                  handleOnSelect={(movie: ApiMovie) => {
                    if (user.id !== game.currentTurnUserId) return;
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
                    };
                    guessFetcher.submit(params, { method: "POST" });
                  }}
                />
              </div>
            ) : (
              <div className="bg-black rounded px-4 py-2">
                Waiting for opponent to guess
              </div>
            )}
          </div>
          <Turns turns={game.turns as Turn[]} />
        </div>
      </div>
    </div>
  );
}

function CommonCast({ cast }: { cast: CastMember[] }) {
  return (
    <ul className="text-center w-[250px] max-w-full mx-auto space-y-1 mb-6">
      {cast.slice(0, 3).map((castMember: CastMember) => (
        <li
          key={castMember.id}
          className="bg-success-600 shadow-md px-2 py-1 rounded border border-transparent"
        >
          <p className="text-gray-100 mr-3 line-clamp-1 text-xs text-center">
            {castMember.name}
          </p>
        </li>
      ))}
      {cast.length > 3 ? (
        <li className="border border-success-600/70 shadow-md px-2 py-1 rounded">
          <p className="text-gray-100 mr-3 line-clamp-1 text-xs text-center">
            +{cast.length - 3} more
          </p>
        </li>
      ) : null}
    </ul>
  );
}

function Turns({ turns }: { turns: Turn[] }) {
  return (
    <div className="space-y-6 flex flex-col justify-center items-center pt-12">
      {turns.map((turn, index) => (
        <div key={turn.id}>
          {turn.status === "Success" ? (
            <CommonCast cast={turn.commonCast as CastMember[]} />
          ) : null}
          <div
            className={`${
              index ? "opacity-50 hover:opacity-100" : ""
            } rounded-xl px-4 py-4 bg-gray-700 flex flex-col text-center justify-center items-center shadow-lg w-auto md:w-[380px]`}
          >
            <p className="text-gray-100 line-clamp-1">
              {turn.movieTitle} ({turn.movieYear})
            </p>
            <div className="flex space-y-0.5 text-xs mt-3 flex-col">
              {turn.guesses.map((guess) => (
                <div
                  key={guess.id}
                  className="flex items-center text bg-gray-600 px-2 py-1 rounded justify-between"
                >
                  <p className="text-gray-100 mr-3 line-clamp-1">
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
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Game or Movie not found</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}
