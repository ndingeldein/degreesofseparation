import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { createGame } from "~/models/game.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const movieId = 107;
  const movieTitle = "Snatch";
  const movieYear = 2000;

  const game = await createGame({
    userId,
    movieId,
    movieTitle,
    movieYear,
  });

  return redirect(`/games/${game.id}`);
};
