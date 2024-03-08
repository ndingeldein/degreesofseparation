import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

// This loader acts as a proxy to TheMovieDB API
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (!query) {
    return json({ error: "Query is required" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      query,
    )}&include_adult=false&language=en-US&page=1&api_key=${
      process.env.TMDB_API_KEY
    }`,
  );

  const data = await response.json();
  return json(data.results.slice(0, 5));
};
