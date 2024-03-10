import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { GuessBox } from "~/components/GuessBox";
import { getGame } from "~/models/game.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.gameId, "gameId not found");

  const { game, movie } = await getGame({ id: params.gameId, userId });
  if (!game) {
    throw new Response("Not Found", { status: 404 });
  }

  if (!movie) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ game, movie });
};

// export const action = async ({ params, request }: ActionFunctionArgs) => {
//   const userId = await requireUserId(request);
//   invariant(params.noteId, "noteId not found");

//   await deleteNote({ id: params.noteId, userId });

//   return redirect("/notes");
// };

export default function GamePage() {
  const user = useUser();
  const { game, movie } = useLoaderData<typeof loader>();

  const isUsersTurn = game.currentTurnUserId === user.id;

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
          <div className="flex mt-4 w-full">
            {isUsersTurn ? <GuessBox /> : null}
          </div>
          <div className="space-y-12 flex flex-col justify-center items-center pt-12">
            <div className="rounded-xl px-8 py-4 bg-gray-700 flex flex-col text-center justify-center items-center shadow-lg">
              <p>{movie.title}</p>
              <div className="flex space-x-1 justify-center text-sm mt-3">
                <p className="border rounded px-1.5 border-white text-white opacity-50">
                  X
                </p>
                <p className="border rounded px-1.5 border-white text-white opacity-50">
                  X
                </p>
                <p className="border rounded px-1.5 border-white text-white opacity-50">
                  X
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
