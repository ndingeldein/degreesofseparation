import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { useOptionalUser } from "~/utils";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  const user = useOptionalUser();
  return (
    <main className="">
      <header>
        <div className="px-4 flex justify-between md:px-6 py-3">
          <div></div>
          <div className="">
            {user ? (
              <Link
                to="/notes"
                className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50 sm:px-8"
              >
                View Notes for {user.email}
              </Link>
            ) : (
              <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                <Link
                  to="/join"
                  className="text-sm hover:underline font-medium text-gray-900"
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  className="text-sm hover:underline font-medium text-gray-900"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </main>
  );
}
