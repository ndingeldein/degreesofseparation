import { Form, Link, Outlet } from "@remix-run/react";

import { useUser } from "~/utils";

export default function NotesPage() {
  const user = useUser();

  return (
    <div className="min-h-dvh flex w-full flex-col">
      <header className="py-2 px-6 flex justify-between border-b border-gray-700 text-sm">
        <h1 className="">
          <Link to="." className="hover:underline hover:text-white font-medium">
            Games
          </Link>
        </h1>
        <div className="flex justify-end">
          <p className="mr-4">{user.name}</p>
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="hover:text-white hover:underline font-medium"
            >
              Logout
            </button>
          </Form>
        </div>
      </header>

      <main className="flex font-medium grow">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
      <footer className="text-xs text-gray-400 px-6 py-2">
        <div className="justify-end italic flex items-baseline space-x-2">
          <p>
            This product uses the TMDB API but is not endorsed or certified by
          </p>
          <a href="https://www.themoviedb.org/">
            <img src="/tmdb.svg" alt="TMDB" className="w-auto h-3 grayscale" />
          </a>
          .
        </div>
      </footer>
    </div>
  );
}
