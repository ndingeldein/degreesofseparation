import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import { useFetcher } from "@remix-run/react";
import debounce from "lodash.debounce";

const fetchMovies = debounce((event, movies) => {
  event.target.value.length > 1 && movies.submit(event.target.form);
}, 300);

export function GuessBox() {
  const movies = useFetcher();
  return (
    <movies.Form method="get" action="/movies-search">
      <Combobox aria-label="Movies">
        <div>
          <ComboboxInput
            className="rounded bg-black px-4 py-2 w-96"
            name="query"
            placeholder="Search for a movie..."
            onChange={(event) => fetchMovies(event, movies)}
          />
          {movies.state === "submitting" ? "searching..." : null}
        </div>

        {movies.data ? (
          <ComboboxPopover className="shadow-popup">
            {movies.data.error ? (
              <p>Failed to load movies :(</p>
            ) : movies.data.length ? (
              <ComboboxList>
                {movies.data.map((movie) => (
                  <ComboboxOption key={movie.id} value={movie.title} />
                ))}
              </ComboboxList>
            ) : (
              <span>No results found</span>
            )}
          </ComboboxPopover>
        ) : null}
      </Combobox>
    </movies.Form>
  );
}
