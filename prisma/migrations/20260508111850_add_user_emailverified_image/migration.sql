-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "vocab_cache" ALTER COLUMN "expires_at" SET DEFAULT now() + interval '90 days';
