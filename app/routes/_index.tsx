import type { MetaFunction } from "@remix-run/node"
import { Form, Link } from "@remix-run/react"

import { useOptionalUser } from "~/utils"

export const meta: MetaFunction = () => [{ title: "° of Separation" }]

export default function Index() {
  const user = useOptionalUser()
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="flex justify-between border-b border-gray-700 px-6 py-2 text-sm">
        <h1 className="">
          <Link
            to="/games"
            className="font-medium hover:text-white hover:underline"
          >
            Games
          </Link>
        </h1>
        <div className="flex justify-end">
          {user ? (
            <>
              <p className="mr-4">{user.name}</p>
              <Form action="/logout" method="post">
                <button
                  type="submit"
                  className="font-medium hover:text-white hover:underline"
                >
                  Logout
                </button>
              </Form>
            </>
          ) : (
            <Link
              to="/login"
              className="font-medium hover:text-white hover:underline"
            >
              Login
            </Link>
          )}
        </div>
      </header>
    </div>
  )
}
