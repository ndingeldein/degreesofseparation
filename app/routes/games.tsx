import { Form, Link, Outlet } from "@remix-run/react"
import { useEffect } from "react"
import { toast } from "sonner"

import { useUser } from "~/utils"

export default function GamesPage() {
  const user = useUser()

  useEffect(() => {
    if (user.notifications.length > 0) {
      const currentNotification = user.notifications[0]
      // if notification was created more than 3 seconds ago, don't show it
      if (
        Date.now() - new Date(currentNotification.createdAt).getTime() <
        2000
      ) {
        toast.success(user.notifications[0].message)
      }
    }
  }, [user.notifications])

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="flex justify-between border-b border-gray-700 px-6 py-2 text-sm">
        <h1 className="">
          <Link to="." className="font-medium hover:text-white hover:underline">
            Games
          </Link>
        </h1>
        <div className="flex justify-end">
          <p className="mr-4">{user.name}</p>

          <Link
            to="/games/new"
            className="mr-4 font-medium hover:text-white hover:underline"
          >
            <span>New Game</span>
          </Link>

          <Form action="/logout" method="post">
            <button
              type="submit"
              className="font-medium hover:text-white hover:underline"
            >
              Logout
            </button>
          </Form>
        </div>
      </header>

      <main className="flex grow pb-12 font-medium">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
      <footer className="px-6 py-2 text-center text-xs text-gray-400">
        <div className="italic">
          <span className="mr-1 inline-flex items-center leading-6">
            This product uses the TMDB API but is not endorsed or certified by{" "}
            <img
              src="/tmdb.svg"
              alt="TMDB"
              className="-mt-0.5 ml-1 inline-flex h-3 w-auto grayscale"
            />
          </span>
        </div>
      </footer>
    </div>
  )
}
