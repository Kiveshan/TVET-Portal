-- Rename "Institution" to "institutions" (keeps any existing rows)
ALTER TABLE "Institution" RENAME TO "institutions";
ALTER TABLE "institutions" RENAME CONSTRAINT "Institution_pkey" TO "institutions_pkey";
ALTER INDEX "Institution_name_key" RENAME TO "institutions_name_key";

-- CreateTable
CREATE TABLE "job_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_name_role_key" ON "job_roles"("name", "role");

-- AlterTable (fails if users already has rows: there is no job role to give them)
ALTER TABLE "users" ADD COLUMN     "job_role_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
