import { useFetcher } from "@remix-run/react";
import debounce from "lodash.debounce";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

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

interface Movie {
  id: string;
  title: string;
}

export function GuessBox() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const moviesFetcher = useFetcher<{ movies: Movie[]; query: string }>();
  const movies = moviesFetcher.data?.movies ?? [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[400px] justify-between mx-auto"
        >
          {value
            ? movies.find((movie: Movie) => movie.id === value)?.title
            : "Select a movie..."}

          <span className="flex items-center space-x-1">
            <span className="px-1 py-0.5 rounded bg-gray-700 text-xs">⌘ K</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 max-w-full">
        <Command shouldFilter={false}>
          {/* fetching works on value change when typing in input */}
          <CommandInput
            placeholder="Search movies..."
            name="query"
            onValueChange={(currentValue) =>
              fetchMovies(currentValue, moviesFetcher)
            }
          />
          <CommandEmpty>No movie found.</CommandEmpty>

          <CommandList>
            {movies.map((movie: Movie) => (
              <CommandItem
                key={movie.id}
                value={movie.id}
                onSelect={() => {
                  setValue(movie.id === value ? "" : movie.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === movie.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="line-clamp-1">{movie.title}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
