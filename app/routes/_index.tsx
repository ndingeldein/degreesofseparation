import type { MetaFunction } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";

import { useOptionalUser } from "~/utils";

export const meta: MetaFunction = () => [{ title: "° of Separation" }];

export default function Index() {
  const user = useOptionalUser();
  return (
    <div className="min-h-dvh flex w-full flex-col">
      <header className="py-2 px-6 flex justify-between border-b border-gray-700 text-sm">
        <h1 className="">
          <Link
            to="/games"
            className="hover:underline hover:text-white font-medium"
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
                  className="hover:text-white hover:underline font-medium"
                >
                  Logout
                </button>
              </Form>
            </>
          ) : (
            <Link
              to="/login"
              className="hover:underline hover:text-white font-medium"
            >
              Login
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
