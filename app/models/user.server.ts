import type { Password, User } from "@prisma/client"
import bcrypt from "bcryptjs"

import { prisma } from "~/db.server"

export type { User, Notification } from "@prisma/client"

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({
    where: {
      id: id,
    },
    include: {
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } })
}

const invitedUsers = ["neil@modiphy.net", "marianne.mattoon@gmail.com"]

export async function getInvitedUser(email: User["email"]) {
  return invitedUsers.includes(email)
}

export async function createUser(
  email: User["email"],
  name: User["name"],
  password: string,
) {
  const hashedPassword = await bcrypt.hash(password, 10)

  return prisma.user.create({
    data: {
      email,
      name,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  })
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } })
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"],
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  })

  if (!userWithPassword || !userWithPassword.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

  if (!isValid) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword

  return userWithoutPassword
}
