import type { LoaderFunction } from "@remix-run/node"
// import { useFetcher } from "@remix-run/react";
// import debounce from "lodash.debounce";
import { ChevronsUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import invariant from "tiny-invariant"

import { Button } from "~/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { searchMovies } from "~/models/game.server"
import { requireUserId } from "~/session.server"

// This loader acts as a proxy to TheMovieDB API
export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request)

  const url = new URL(request.url)
  const query = url.searchParams.get("query")

  invariant(typeof query === "string", "query is required")

  const { results } = await searchMovies({ query })

  return { movies: results, query }
}

// interface Movie {
//   id: string;
//   title: string;
//   year: string;
// }

interface ApiMovie {
  id: number
  title: string
  release_date: string
}

function GuessBox({
  movies,
  isGuessing,
  handleOnValueChange,
  handleOnSelect,
  buttonText = "Select a movie...",
  keyCode = "k",
}: {
  movies: ApiMovie[]
  isGuessing: boolean
  handleOnValueChange: (currentValue: string) => void
  handleOnSelect: (movie: ApiMovie) => void
  buttonText?: string
  keyCode?: string
}) {
  const [open, setOpen] = useState(false)
  // const [value] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === keyCode && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [keyCode])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="mx-auto w-full max-w-[400px] justify-between"
        >
          {buttonText}
          <span className="flex items-center space-x-1">
            <span className="rounded bg-gray-700 px-1 py-0.5 text-xs">
              ⌘ {keyCode.toUpperCase()}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-w-full p-0">
        <Command shouldFilter={false}>
          {/* fetching works on value change when typing in input */}
          <CommandInput
            placeholder="Search movies..."
            name="query"
            onValueChange={handleOnValueChange}
            disabled={isGuessing}
          />
          <CommandEmpty>No movie found.</CommandEmpty>

          <CommandList>
            {movies.map((movie: ApiMovie) => (
              <CommandItem
                key={movie.id}
                value={String(movie.id)}
                onSelect={() => {
                  if (isGuessing) return
                  // const newValue = movie.id === value ? "" : movie;
                  // setValue(newValue);
                  setOpen(false)
                  handleOnSelect(movie)
                }}
              >
                <span className="line-clamp-1 pl-7">
                  {movie.title}{" "}
                  <span className="text-xs text-gray-400">
                    ({new Date(movie.release_date).getFullYear()})
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { GuessBox }
