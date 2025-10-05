-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeRequest" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT,
    "condition" TEXT NOT NULL,
    "needs" TEXT,
    "kojiType" TEXT,
    "otherIngredients" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedRecipe" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "benefit" TEXT NOT NULL,
    "nutrition" JSONB,
    "comparison" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JapaneseFood" (
    "id" TEXT NOT NULL,
    "foodCode" TEXT,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "category" TEXT,
    "energyKcal" DECIMAL(6,1),
    "protein" DECIMAL(5,2),
    "fat" DECIMAL(5,2),
    "carbs" DECIMAL(5,2),
    "sodium" DECIMAL(6,1),
    "searchText" TEXT,
    "isMuroProduct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JapaneseFood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeRequest_shop_idx" ON "public"."RecipeRequest"("shop");

-- CreateIndex
CREATE INDEX "RecipeRequest_customerId_idx" ON "public"."RecipeRequest"("customerId");

-- CreateIndex
CREATE INDEX "RecipeRequest_createdAt_idx" ON "public"."RecipeRequest"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedRecipe_requestId_idx" ON "public"."GeneratedRecipe"("requestId");

-- CreateIndex
CREATE INDEX "GeneratedRecipe_createdAt_idx" ON "public"."GeneratedRecipe"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JapaneseFood_foodCode_key" ON "public"."JapaneseFood"("foodCode");

-- CreateIndex
CREATE INDEX "JapaneseFood_name_idx" ON "public"."JapaneseFood"("name");

-- CreateIndex
CREATE INDEX "JapaneseFood_isMuroProduct_idx" ON "public"."JapaneseFood"("isMuroProduct");

-- AddForeignKey
ALTER TABLE "public"."GeneratedRecipe" ADD CONSTRAINT "GeneratedRecipe_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."RecipeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
