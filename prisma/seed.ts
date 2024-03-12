import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface CastMember {
  id: string;
  name: string;
}

async function seed() {
  // cleanup the existing database
  await prisma.user
    .deleteMany({ where: { email: { startsWith: "player" } } })
    .catch(() => {
      // no worries if it doesn't exist yet
    });

  const hashedPassword = await bcrypt.hash("password", 10);

  const player1 = await prisma.user.create({
    data: {
      email: "player1@modiphy.net",
      name: "Neil",
      role: "SuperAdmin",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const player2 = await prisma.user.create({
    data: {
      email: "player2@modiphy.net",
      name: "Marianne",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const initialMovieId = "105"; // BTTF;

  const game = await prisma.game.create({
    data: {
      player1Id: player1.id,
      player2Id: player2.id,
      currentTurnUserId: player2.id,
    },
  });

  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${initialMovieId}/credits?api_key=${process.env.TMDB_API_KEY}`,
  );
  const { cast } = await response.json();

  await prisma.turn.create({
    data: {
      gameId: game.id,
      userId: player2.id,
      movieId: initialMovieId,
      movieTitle: "Back to the Future",
      movieYear: 1985,
      castIds: cast.map((c: CastMember) => c.id),
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
