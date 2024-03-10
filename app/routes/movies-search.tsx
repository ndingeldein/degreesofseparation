import type { LoaderFunction } from "@remix-run/node";
import invariant from "tiny-invariant";

import { searchMovies } from "~/models/game.server";
import { requireUserId } from "~/session.server";

// This loader acts as a proxy to TheMovieDB API
export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  invariant(typeof query === "string", "query is required");

  const { results } = await searchMovies({ query });

  console.log(`loader query: ${query}`);

  return { movies: results, query };
};
