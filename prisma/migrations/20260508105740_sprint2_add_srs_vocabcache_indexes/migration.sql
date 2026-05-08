-- AlterTable
ALTER TABLE "vocab_cache" ALTER COLUMN "expires_at" SET DEFAULT now() + interval '90 days';

-- CreateIndex
CREATE INDEX "srs_cards_user_id_next_review_at_idx" ON "srs_cards"("user_id", "next_review_at");

-- CreateIndex
CREATE INDEX "vocab_cache_expires_at_idx" ON "vocab_cache"("expires_at");
