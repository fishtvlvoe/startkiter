-- Encrypted operator site settings (PAYUNi row id=payuni)

CREATE TABLE "site_setting" (
    "id" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "site_setting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_setting_updated_at_idx" ON "site_setting"("updated_at");
