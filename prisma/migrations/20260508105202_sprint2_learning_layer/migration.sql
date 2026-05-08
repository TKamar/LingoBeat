-- AlterTable
ALTER TABLE "User" ADD COLUMN     "analysis_provider" TEXT NOT NULL DEFAULT 'haiku';

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_language_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "vocabulary_level" TEXT NOT NULL DEFAULT 'A1',
    "script_familiarity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_language_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "srs_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "romanization" TEXT,
    "meaning" TEXT,
    "context_song" TEXT,
    "fsrs_state" JSONB NOT NULL DEFAULT '{}',
    "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "srs_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" BIGSERIAL NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_cache" (
    "id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT 'haiku',
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "analysis" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT now() + interval '90 days',

    CONSTRAINT "vocab_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_language_profiles_user_id_language_code_key" ON "user_language_profiles"("user_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "srs_cards_user_id_language_code_word_key" ON "srs_cards"("user_id", "language_code", "word");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_cache_language_code_word_context_provider_key" ON "vocab_cache"("language_code", "word", "context", "provider");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_language_profiles" ADD CONSTRAINT "user_language_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "srs_cards" ADD CONSTRAINT "srs_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "srs_cards" ADD CONSTRAINT "srs_cards_context_song_fkey" FOREIGN KEY ("context_song") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "srs_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
