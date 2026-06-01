import { prisma } from "../db/prismaClient.js";

export const TEST_USER = {
  email: "test.author@poetry.com",
  confirmEmail: "test.author@poetry.com",
  password: "Testing4fun!",
  confirmPassword: "Testing4fun!",
  name: "Test Author",
  screenname: "testauthor",
};

export const TEST_OTHER_USER = {
  email: "test.other@poetry.com",
  confirmEmail: "test.other@poetry.com",
  password: "Testing4fun!",
  confirmPassword: "Testing4fun!",
  name: "Test Other",
  screenname: "testother",
};

export const TEST_ADMIN_USER = {
  email: "test.admin@poetry.com",
  confirmEmail: "test.admin@poetry.com",
  password: "Testing4fun!",
  confirmPassword: "Testing4fun!",
  name: "Test Admin",
  screenname: "testadmin",
};

export const TEST_EMAILS = [
  TEST_USER.email,
  TEST_OTHER_USER.email,
  TEST_ADMIN_USER.email,
];

export async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: TEST_EMAILS } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (!ids.length) return;

  await prisma.haikuReplyLike.deleteMany({ where: { userID: { in: ids } } });
  await prisma.limerickReplyLike.deleteMany({ where: { userID: { in: ids } } });
  await prisma.haikuCommentLike.deleteMany({ where: { userID: { in: ids } } });
  await prisma.limerickCommentLike.deleteMany({ where: { userID: { in: ids } } });
  await prisma.haikuLike.deleteMany({ where: { userID: { in: ids } } });
  await prisma.limerickLike.deleteMany({ where: { userID: { in: ids } } });
  await prisma.haikuReply.deleteMany({ where: { authorID: { in: ids } } });
  await prisma.limerickReply.deleteMany({ where: { authorID: { in: ids } } });
  await prisma.haikuComment.deleteMany({ where: { authorID: { in: ids } } });
  await prisma.limerickComment.deleteMany({ where: { authorID: { in: ids } } });
  await prisma.favorite.deleteMany({ where: { userID: { in: ids } } });
  await prisma.haiku.deleteMany({ where: { authorID: { in: ids } } });
  await prisma.limerick.deleteMany({ where: { authorID: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
