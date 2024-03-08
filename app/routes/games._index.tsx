import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, useLoaderData } from "@remix-run/react";

import { getPlayerGames } from "~/models/game.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const playerGames = await getPlayerGames({ userId });
  return json({ playerGames });
};

export default function GameIndexPage() {
  const user = useUser();
  const data = useLoaderData<typeof loader>();

  return (
    <div className="w-full flex items-center justify-center">
      {data.playerGames.length === 0 ? (
        <p className="p-4">No games yet</p>
      ) : (
        <div className="container max-w-screen-lg flex justify-center flex-col space-y-12 pt-12">
          {data.playerGames.map((game) => (
            <div key={game.id} className="mx-auto max-w-sm w-full">
              <NavLink
                className="flex flex-col rounded space-y-2 items-center justify-center bg-gray-800 border-gray-700 border overflow-hidden hover:border-white"
                to={game.id}
              >
                <div className="px-4 py-2 bg-success-500 w-full font-semibold text-sm text-center text-white uppercase tracking-wide">
                  {game.currentTurnUserId === user.id
                    ? "Your Turn"
                    : "Opponent's Turn"}
                </div>
                <div className="flex flex-col text-center text-sm">
                  <span className="block text-gray-100 font-semibold">
                    {game.player1.name}
                  </span>
                  <span className="block">vs</span>
                  <span className="block text-gray-100 font-semibold">
                    {game.player2.name}
                  </span>
                </div>
                <div className="py-2 border-t border-gray-600 border-dashed w-full text-center text-xs">
                  {game.status}
                </div>
              </NavLink>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
