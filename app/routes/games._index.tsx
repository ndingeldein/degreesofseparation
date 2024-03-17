import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { NavLink, useLoaderData } from "@remix-run/react"

import { getPlayerGames } from "~/models/game.server"
import type { GameResult, GameStatus, GameWinCondition } from "~/models/schema"
import {
  GameResultSchema,
  GameStatusSchema,
  GameWinConditionSchema,
} from "~/models/schema"
import { requireUserId } from "~/session.server"
import { useUser } from "~/utils"

interface Game {
  id: string
  player1: {
    id: string
    name: string
  }
  player2: {
    id: string
    name: string
  }
  status: GameStatus
  result?: GameResult
  currentTurnUserId: string
  winCondition?: GameWinCondition
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const playerGames = await getPlayerGames({ userId })
  return json({ playerGames })
}

function getGameResultForUser(
  result: GameResult,
  userId: string,
  player1Id: string,
  player2Id: string,
): string {
  if (result === GameResultSchema.enum.Canceled) {
    return "Canceled"
  }

  if (userId === player1Id) {
    return result === GameResultSchema.enum.Player1Wins ? "You Won" : "You Lost"
  }

  if (userId === player2Id) {
    return result === GameResultSchema.enum.Player2Wins ? "You Won" : "You Lost"
  }

  return "Draw"
}

export default function GameIndexPage() {
  const user = useUser()
  const data = useLoaderData<typeof loader>()

  const currentGames = data.playerGames.filter(
    (game) =>
      game.status === GameStatusSchema.enum.Ongoing ||
      game.status === GameStatusSchema.enum.Pending,
  )
  const completedGames = data.playerGames.filter(
    (game) => game.status === GameStatusSchema.enum.Completed,
  )

  return (
    <div className="space-y-12 text-center">
      <div className="flex w-full items-center justify-center">
        {currentGames.length === 0 ? (
          <p className="p-4">You have no games in progress</p>
        ) : (
          <div className="container flex max-w-screen-lg flex-col justify-center space-y-12 pt-12">
            {currentGames.map((game) => (
              <div key={game.id} className="mx-auto w-full max-w-sm">
                <GameCard
                  game={game as Game}
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
      <div className="flex w-full items-center justify-center">
        <div className="w-full">
          <div className="flex items-center justify-center">
            <span className="grow border border-dashed border-gray-700/70"></span>
            <p className="mx-3 text-xl">Completed Games</p>
            <span className="grow border border-dashed border-gray-700/70"></span>
          </div>

          {completedGames.length === 0 ? (
            <p className="p-4">You have no completed games</p>
          ) : (
            <div className="container mt-6 flex max-w-screen-lg flex-col justify-center space-y-12">
              {completedGames.map((game) => (
                <div key={game.id} className="mx-auto w-full max-w-sm">
                  <GameCard
                    game={game as Game}
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
  )
}

function getGameWinCondition(winCondition: GameWinCondition) {
  switch (winCondition) {
    case GameWinConditionSchema.enum.Draw:
      return "Draw"
    case GameWinConditionSchema.enum.DestinationMovie:
      return "Destination Connection!"
    case GameWinConditionSchema.enum.Forfeit:
      return "Forfeit"
    case GameWinConditionSchema.enum.WrongGuess:
      return "Wrong Guess"
  }
}

function GameCard({
  game,
  headerText,
  headerClass = "bg-gray-700",
}: {
  game: Game
  headerText: string
  headerClass: string
}) {
  return (
    <NavLink
      className="flex flex-col items-center justify-center space-y-2 overflow-hidden rounded border border-gray-700 bg-gray-800 hover:border-white"
      to={game.id}
    >
      <div
        className={`w-full px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-white ${headerClass}`}
      >
        {headerText}
      </div>
      <div className="flex flex-col text-center text-sm">
        <span className="block font-semibold text-gray-100">
          {game.player1.name}
        </span>
        <span className="block">vs</span>
        <span className="block font-semibold text-gray-100">
          {game.player2.name}
        </span>
      </div>
      <div className="w-full border-t border-dashed border-gray-600 py-2 text-center text-xs">
        {game.winCondition
          ? getGameWinCondition(game.winCondition)
          : game.status}
      </div>
    </NavLink>
  )
}
