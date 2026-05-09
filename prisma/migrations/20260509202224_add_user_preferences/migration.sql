-- AlterTable
ALTER TABLE "vocab_cache" ALTER COLUMN "expires_at" SET DEFAULT now() + interval '90 days';

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL DEFAULT 'fr',
    "daily_goal_xp" INTEGER NOT NULL DEFAULT 20,
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_user_id_key" ON "UserPreference"("user_id");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
