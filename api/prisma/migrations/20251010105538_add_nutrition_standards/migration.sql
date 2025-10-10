-- CreateTable
CREATE TABLE "public"."NutritionStandard" (
    "id" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "energyLow" INTEGER,
    "energyModerate" INTEGER,
    "energyHigh" INTEGER,
    "carbohydrateTarget" TEXT,
    "carbohydrateMin" DOUBLE PRECISION,
    "carbohydrateMax" DOUBLE PRECISION,
    "fiberTarget" DOUBLE PRECISION,
    "proteinRequired" DOUBLE PRECISION,
    "proteinRecommended" DOUBLE PRECISION,
    "proteinAdequate" DOUBLE PRECISION,
    "proteinTarget" TEXT,
    "proteinTargetMin" DOUBLE PRECISION,
    "proteinTargetMax" DOUBLE PRECISION,
    "fatAdequate" DOUBLE PRECISION,
    "fatTargetMin" DOUBLE PRECISION,
    "fatTargetMax" DOUBLE PRECISION,
    "saturatedFatTarget" DOUBLE PRECISION,
    "n6FattyAcidAdequate" DOUBLE PRECISION,
    "n3FattyAcidAdequate" DOUBLE PRECISION,
    "vitaminARecommended" DOUBLE PRECISION,
    "vitaminAUpperLimit" DOUBLE PRECISION,
    "vitaminDAdequate" DOUBLE PRECISION,
    "vitaminDUpperLimit" DOUBLE PRECISION,
    "vitaminEAdequate" DOUBLE PRECISION,
    "vitaminEUpperLimit" DOUBLE PRECISION,
    "vitaminKAdequate" DOUBLE PRECISION,
    "vitaminB1Recommended" DOUBLE PRECISION,
    "vitaminB2Recommended" DOUBLE PRECISION,
    "niacinRecommended" DOUBLE PRECISION,
    "niacinUpperLimit" DOUBLE PRECISION,
    "vitaminB6Recommended" DOUBLE PRECISION,
    "vitaminB6UpperLimit" DOUBLE PRECISION,
    "vitaminB12Adequate" DOUBLE PRECISION,
    "folateRecommended" DOUBLE PRECISION,
    "folateUpperLimit" DOUBLE PRECISION,
    "pantothenicAcidAdequate" DOUBLE PRECISION,
    "biotinAdequate" DOUBLE PRECISION,
    "vitaminCRecommended" DOUBLE PRECISION,
    "sodiumTarget" DOUBLE PRECISION,
    "potassiumAdequate" DOUBLE PRECISION,
    "potassiumTarget" DOUBLE PRECISION,
    "calciumRecommended" DOUBLE PRECISION,
    "calciumUpperLimit" DOUBLE PRECISION,
    "magnesiumRecommended" DOUBLE PRECISION,
    "magnesiumUpperLimit" DOUBLE PRECISION,
    "phosphorusAdequate" DOUBLE PRECISION,
    "phosphorusUpperLimit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionStandard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionStandard_sex_ageMin_ageMax_idx" ON "public"."NutritionStandard"("sex", "ageMin", "ageMax");

-- CreateIndex
CREATE INDEX "NutritionStandard_sex_idx" ON "public"."NutritionStandard"("sex");

-- CreateIndex
CREATE INDEX "NutritionStandard_ageMin_idx" ON "public"."NutritionStandard"("ageMin");
