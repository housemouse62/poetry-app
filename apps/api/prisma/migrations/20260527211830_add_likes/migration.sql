-- CreateTable
CREATE TABLE "HaikuLike" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "haikuID" INTEGER NOT NULL,

    CONSTRAINT "HaikuLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimerickLike" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "limerickID" INTEGER NOT NULL,

    CONSTRAINT "LimerickLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaikuCommentLike" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "commentID" INTEGER NOT NULL,

    CONSTRAINT "HaikuCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimerickCommentLike" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "commentID" INTEGER NOT NULL,

    CONSTRAINT "LimerickCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaikuReplyLike" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "replyID" INTEGER NOT NULL,

    CONSTRAINT "HaikuReplyLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimerickReplyLike" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "replyID" INTEGER NOT NULL,

    CONSTRAINT "LimerickReplyLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HaikuLike_userID_haikuID_key" ON "HaikuLike"("userID", "haikuID");

-- CreateIndex
CREATE UNIQUE INDEX "LimerickLike_userID_limerickID_key" ON "LimerickLike"("userID", "limerickID");

-- CreateIndex
CREATE UNIQUE INDEX "HaikuCommentLike_userID_commentID_key" ON "HaikuCommentLike"("userID", "commentID");

-- CreateIndex
CREATE UNIQUE INDEX "LimerickCommentLike_userID_commentID_key" ON "LimerickCommentLike"("userID", "commentID");

-- CreateIndex
CREATE UNIQUE INDEX "HaikuReplyLike_userID_replyID_key" ON "HaikuReplyLike"("userID", "replyID");

-- CreateIndex
CREATE UNIQUE INDEX "LimerickReplyLike_userID_replyID_key" ON "LimerickReplyLike"("userID", "replyID");

-- AddForeignKey
ALTER TABLE "HaikuLike" ADD CONSTRAINT "HaikuLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuLike" ADD CONSTRAINT "HaikuLike_haikuID_fkey" FOREIGN KEY ("haikuID") REFERENCES "Haiku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickLike" ADD CONSTRAINT "LimerickLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickLike" ADD CONSTRAINT "LimerickLike_limerickID_fkey" FOREIGN KEY ("limerickID") REFERENCES "Limerick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuCommentLike" ADD CONSTRAINT "HaikuCommentLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuCommentLike" ADD CONSTRAINT "HaikuCommentLike_commentID_fkey" FOREIGN KEY ("commentID") REFERENCES "HaikuComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickCommentLike" ADD CONSTRAINT "LimerickCommentLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickCommentLike" ADD CONSTRAINT "LimerickCommentLike_commentID_fkey" FOREIGN KEY ("commentID") REFERENCES "LimerickComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuReplyLike" ADD CONSTRAINT "HaikuReplyLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuReplyLike" ADD CONSTRAINT "HaikuReplyLike_replyID_fkey" FOREIGN KEY ("replyID") REFERENCES "HaikuReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickReplyLike" ADD CONSTRAINT "LimerickReplyLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickReplyLike" ADD CONSTRAINT "LimerickReplyLike_replyID_fkey" FOREIGN KEY ("replyID") REFERENCES "LimerickReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
