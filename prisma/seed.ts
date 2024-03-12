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

  const castIds = [
    521, 1062, 1064, 1063, 1066, 1065, 1067, 1068, 1069, 1070, 1954, 11673,
    1953, 1072, 1074, 84494, 97708, 1116544, 172280, 97718, 129319, 184030,
    1200788, 94500, 139044, 18708, 238572, 1020340, 21065, 158713, 7139, 99725,
    77874, 160343, 3038, 175060, 54564, 1200791, 1200792, 1200793, 1200794,
    964124, 1200796, 180468, 1212833, 9971, 168702, 2749693, 2749694, 1261,
    100600, 1208039, 2749695, 1200797, 2333453, 553735, 1884036,
  ];

  await prisma.turn.create({
    data: {
      gameId: game.id,
      userId: player2.id,
      movieId: initialMovieId,
      movieTitle: "Back to the Future",
      movieYear: 1985,
      castIds: castIds,
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
