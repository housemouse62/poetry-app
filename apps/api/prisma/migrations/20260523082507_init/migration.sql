-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "screenname" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Haiku" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "lineOne" TEXT NOT NULL,
    "lineTwo" TEXT NOT NULL,
    "lineThree" TEXT NOT NULL,
    "lineOneSyllables" INTEGER NOT NULL,
    "lineTwoSyllables" INTEGER NOT NULL,
    "lineThreeSyllables" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorID" INTEGER,
    "screenname" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Haiku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Limerick" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "lineOne" TEXT NOT NULL,
    "lineTwo" TEXT NOT NULL,
    "lineThree" TEXT NOT NULL,
    "lineFour" TEXT NOT NULL,
    "lineFive" TEXT NOT NULL,
    "lineOneSyllables" INTEGER NOT NULL,
    "lineTwoSyllables" INTEGER NOT NULL,
    "lineThreeSyllables" INTEGER NOT NULL,
    "lineFourSyllables" INTEGER NOT NULL,
    "lineFiveSyllables" INTEGER NOT NULL,
    "rhymeA" TEXT,
    "rhymeB" TEXT,
    "rhymeAVerified" BOOLEAN NOT NULL DEFAULT false,
    "rhymeBVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorID" INTEGER,
    "screenname" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Limerick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaikuComment" (
    "id" SERIAL NOT NULL,
    "commentbody" TEXT NOT NULL,
    "authorID" INTEGER NOT NULL,
    "poemID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaikuComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimerickComment" (
    "id" SERIAL NOT NULL,
    "commentbody" TEXT NOT NULL,
    "authorID" INTEGER NOT NULL,
    "poemID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimerickComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaikuReply" (
    "id" SERIAL NOT NULL,
    "replybody" TEXT NOT NULL,
    "authorID" INTEGER NOT NULL,
    "commentID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaikuReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimerickReply" (
    "id" SERIAL NOT NULL,
    "replybody" TEXT NOT NULL,
    "authorID" INTEGER NOT NULL,
    "commentID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimerickReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "syllableCount" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_key" ON "Word"("word");

-- AddForeignKey
ALTER TABLE "Haiku" ADD CONSTRAINT "Haiku_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Limerick" ADD CONSTRAINT "Limerick_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuComment" ADD CONSTRAINT "HaikuComment_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuComment" ADD CONSTRAINT "HaikuComment_poemID_fkey" FOREIGN KEY ("poemID") REFERENCES "Haiku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickComment" ADD CONSTRAINT "LimerickComment_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickComment" ADD CONSTRAINT "LimerickComment_poemID_fkey" FOREIGN KEY ("poemID") REFERENCES "Limerick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuReply" ADD CONSTRAINT "HaikuReply_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaikuReply" ADD CONSTRAINT "HaikuReply_commentID_fkey" FOREIGN KEY ("commentID") REFERENCES "HaikuComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickReply" ADD CONSTRAINT "LimerickReply_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimerickReply" ADD CONSTRAINT "LimerickReply_commentID_fkey" FOREIGN KEY ("commentID") REFERENCES "LimerickComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
