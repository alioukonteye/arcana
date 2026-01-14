/*
  Warnings:

  - You are about to drop the column `addedBy` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `lentByUserId` on the `Loan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_lentByUserId_fkey";

-- DropIndex
DROP INDEX "Book_isbn_key";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "addedBy",
ADD COLUMN     "addedById" TEXT,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION,
ADD COLUMN     "copyNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "googleBooksId" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "publishedDate" TEXT,
ADD COLUMN     "publisher" TEXT;

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "lentByUserId",
ADD COLUMN     "lentById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Book_title_author_idx" ON "Book"("title", "author");

-- CreateIndex
CREATE INDEX "Loan_bookId_idx" ON "Loan"("bookId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_lentById_fkey" FOREIGN KEY ("lentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
