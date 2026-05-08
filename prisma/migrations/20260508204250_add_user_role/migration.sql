-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "vocab_cache" ALTER COLUMN "expires_at" SET DEFAULT now() + interval '90 days';
