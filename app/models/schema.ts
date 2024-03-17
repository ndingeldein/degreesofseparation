import { z } from "zod"

const CastMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
})
type CastMember = z.infer<typeof CastMemberSchema>

const CastMembersSchema = z.array(CastMemberSchema)
type CastMembers = z.infer<typeof CastMembersSchema>

const ApiMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  release_date: z.string(),
})
type ApiMovie = z.infer<typeof ApiMovieSchema>

const ApiMoviesSchema = z.array(ApiMovieSchema)
type ApiMovies = z.infer<typeof ApiMoviesSchema>

const GameStatusSchema = z.enum(["Pending", "Ongoing", "Completed"])
type GameStatus = z.infer<typeof GameStatusSchema>

const GameResultSchema = z.enum([
  "Player1Wins",
  "Player2Wins",
  "Draw",
  "Canceled",
])
type GameResult = z.infer<typeof GameResultSchema>

const TurnStatusSchema = z.enum(["InProgress", "Success", "Fail"])
type TurnStatus = z.infer<typeof TurnStatusSchema>

const GuessSchema = z.object({
  id: z.string(),
  movieId: z.number(),
  movieTitle: z.string(),
  movieYear: z.number(),
  result: z.boolean(),
})

type Guess = z.infer<typeof GuessSchema>

const TurnSchema = z.object({
  id: z.string(),
  movieId: z.number(),
  status: TurnStatusSchema,
  movieTitle: z.string(),
  movieYear: z.number(),
  guesses: z.array(GuessSchema),
  castIds: z.array(z.number()).optional(),
  commonCast: z.array(CastMemberSchema).nullable(),
})
type Turn = z.infer<typeof TurnSchema>

const GameSchema = z.object({
  id: z.string(),
  player1: z.object({
    id: z.string(),
    name: z.string(),
  }),
  player2: z.object({
    id: z.string(),
    name: z.string(),
  }),
  turns: z.array(TurnSchema),
  status: GameStatusSchema,
  result: GameResultSchema.optional(),
  forfeit: z.boolean().optional(),
  currentTurnUserId: z.string(),
})
type Game = z.infer<typeof GameSchema>

const UserWithNotificationsSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["Basic", "Admin", "SuperAdmin"]),
  notifications: z.array(z.string()),
})
type UserWithNotifications = z.infer<typeof GameSchema>

export {
  CastMemberSchema,
  CastMembersSchema,
  ApiMovieSchema,
  ApiMoviesSchema,
  GameStatusSchema,
  GameResultSchema,
  GameSchema,
  GuessSchema,
  TurnSchema,
  TurnStatusSchema,
  UserWithNotificationsSchema,
}

export type {
  CastMember,
  CastMembers,
  ApiMovie,
  ApiMovies,
  GameStatus,
  GameResult,
  Game,
  Guess,
  Turn,
  TurnStatus,
  UserWithNotifications,
}
