import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, useLoaderData } from "@remix-run/react";

import { getPlayerGames } from "~/models/game.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

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

interface Game {
  id: string;
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
  status: GameStatus;
  result?: GameResult;
  currentTurnUserId: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const playerGames = await getPlayerGames({ userId });
  return json({ playerGames });
};

function getGameResultForUser(
  result: GameResult,
  userId: string,
  player1Id: string,
  player2Id: string,
): string {
  if (result === GameResult.Canceled) {
    return "Canceled";
  }

  if (userId === player1Id) {
    return result === GameResult.Player1Wins ? "You Won" : "You Lost";
  }

  if (userId === player2Id) {
    return result === GameResult.Player2Wins ? "You Won" : "You Lost";
  }

  return "Draw";
}

export default function GameIndexPage() {
  const user = useUser();
  const data = useLoaderData<typeof loader>();

  const currentGames = data.playerGames.filter(
    (game) =>
      game.status === GameStatus.Ongoing || game.status === GameStatus.Pending,
  ) as Game[];
  const completedGames = data.playerGames.filter(
    (game) => game.status === GameStatus.Completed,
  ) as Game[];

  return (
    <div className="text-center space-y-12">
      <div className="w-full flex items-center justify-center">
        {currentGames.length === 0 ? (
          <p className="p-4">You have no games in progress</p>
        ) : (
          <div className="container max-w-screen-lg flex justify-center flex-col space-y-12 pt-12">
            {currentGames.map((game) => (
              <div key={game.id} className="mx-auto max-w-sm w-full">
                <GameCard
                  game={game}
                  headerText={
                    game.currentTurnUserId === user.id
                      ? "Your Turn"
                      : "Opponent's Turn"
                  }
                  headerClass={
                    game.currentTurnUserId === user.id
                      ? "bg-success-600"
                      : "bg-gray-700"
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-full flex items-center justify-center">
        <div className="w-full">
          <div className="flex justify-center items-center">
            <span className="grow border border-dashed border-gray-700/70"></span>
            <p className="text-xl mx-3">Completed Games</p>
            <span className="grow border border-dashed border-gray-700/70"></span>
          </div>

          {completedGames.length === 0 ? (
            <p className="p-4">You have no completed games</p>
          ) : (
            <div className="container max-w-screen-lg flex justify-center flex-col space-y-12 mt-6">
              {completedGames.map((game) => (
                <div key={game.id} className="mx-auto max-w-sm w-full">
                  <GameCard
                    game={game}
                    headerText={
                      game.result
                        ? getGameResultForUser(
                            game.result,
                            user.id,
                            game.player1.id,
                            game.player2.id,
                          )
                        : ""
                    }
                    headerClass={"bg-gray-700"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameCard({
  game,
  headerText,
  headerClass = "bg-gray-700",
}: {
  game: Game;
  headerText: string;
  headerClass: string;
}) {
  return (
    <NavLink
      className="flex flex-col rounded space-y-2 items-center justify-center bg-gray-800 border-gray-700 border overflow-hidden hover:border-white"
      to={game.id}
    >
      <div
        className={`px-4 py-2 w-full font-semibold text-sm text-center text-white uppercase tracking-wide ${headerClass}`}
      >
        {headerText}
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
  );
}
