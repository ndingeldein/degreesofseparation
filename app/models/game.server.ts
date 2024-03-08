import type { User, Game } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Game } from "@prisma/client";

// Utility function to fetch movie titles by ID
// async function fetchMovieTitles(
//   movieIds: string[],
// ): Promise<Record<string, string>> {
//   const titles: Record<string, string> = {};
//   const uniqueIds = [...new Set(movieIds)]; // Remove duplicates

//   await Promise.all(
//     uniqueIds.map(async (id: string) => {
//       const response = await fetch(
//         `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`,
//       );
//       const { title } = await response.json();

//       titles[id] = title;
//     }),
//   );

//   return titles;
// }

export async function getGame({
  id,
}: Pick<Game, "id"> & {
  userId: User["id"];
}) {
  const game = await prisma.game.findFirst({
    select: {
      id: true,
      player1: true,
      player2: true,
      turns: {
        include: {
          guesses: true,
        },
      },
      currentTurnUserId: true,
    },
    where: { id },
  });

  const movieId = game.turns[0].movieId;
  //const movieId = "105";
  const url = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
    },
  };

  const response = await fetch(url, options);

  const movie = await response.json();

  return { game, movie };
}

export function getPlayerGames({ userId }: { userId: User["id"] }) {
  return prisma.game.findMany({
    where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
    select: {
      id: true,
      player1: true,
      player2: true,
      status: true,
      currentTurnUserId: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

// export function createNote({
//   body,
//   title,
//   userId,
// }: Pick<Note, "body" | "title"> & {
//   userId: User["id"];
// }) {
//   return prisma.note.create({
//     data: {
//       title,
//       body,
//       user: {
//         connect: {
//           id: userId,
//         },
//       },
//     },
//   });
// }

// export function deleteNote({
//   id,
//   userId,
// }: Pick<Note, "id"> & { userId: User["id"] }) {
//   return prisma.note.deleteMany({
//     where: { id, userId },
//   });
// }
