-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "submission_reviews" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "ingest_date" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "approved_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "approved_key" TEXT,
    "reviewer_id" TEXT NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "row_rejections" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "values" JSONB NOT NULL,

    CONSTRAINT "row_rejections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_reviews_college_idx" ON "submission_reviews"("college");

-- CreateIndex
CREATE UNIQUE INDEX "submission_reviews_submission_id_table_name_key" ON "submission_reviews"("submission_id", "table_name");

-- AddForeignKey
ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "row_rejections" ADD CONSTRAINT "row_rejections_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "submission_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
