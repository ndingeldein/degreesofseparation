import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { createGame, getNewMovie } from "~/models/game.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const { newMovie } = await getNewMovie();

  const game = await createGame({
    userId,
    movieId: newMovie.id,
    movieTitle: newMovie.title,
    movieYear: new Date(newMovie.release_date).getFullYear(),
  });

  return redirect(`/games/${game.id}`);
};
