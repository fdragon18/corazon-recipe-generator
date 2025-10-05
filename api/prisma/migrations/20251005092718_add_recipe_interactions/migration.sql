-- AlterTable
ALTER TABLE "public"."GeneratedRecipe" ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."RecipeLike" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeFavorite" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeLike_customerId_idx" ON "public"."RecipeLike"("customerId");

-- CreateIndex
CREATE INDEX "RecipeLike_recipeId_idx" ON "public"."RecipeLike"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeLike_createdAt_idx" ON "public"."RecipeLike"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeLike_recipeId_customerId_key" ON "public"."RecipeLike"("recipeId", "customerId");

-- CreateIndex
CREATE INDEX "RecipeFavorite_customerId_idx" ON "public"."RecipeFavorite"("customerId");

-- CreateIndex
CREATE INDEX "RecipeFavorite_recipeId_idx" ON "public"."RecipeFavorite"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeFavorite_createdAt_idx" ON "public"."RecipeFavorite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeFavorite_recipeId_customerId_key" ON "public"."RecipeFavorite"("recipeId", "customerId");

-- CreateIndex
CREATE INDEX "GeneratedRecipe_likeCount_idx" ON "public"."GeneratedRecipe"("likeCount");

-- CreateIndex
CREATE INDEX "GeneratedRecipe_favoriteCount_idx" ON "public"."GeneratedRecipe"("favoriteCount");

-- AddForeignKey
ALTER TABLE "public"."RecipeLike" ADD CONSTRAINT "RecipeLike_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."GeneratedRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeFavorite" ADD CONSTRAINT "RecipeFavorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."GeneratedRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
