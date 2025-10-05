-- AlterTable
ALTER TABLE "public"."JapaneseFood" ADD COLUMN     "calcium" DECIMAL(6,1),
ADD COLUMN     "cholesterol" DECIMAL(5,1),
ADD COLUMN     "fiber" DECIMAL(5,2),
ADD COLUMN     "iron" DECIMAL(5,2),
ADD COLUMN     "potassium" DECIMAL(6,1),
ADD COLUMN     "saltEquiv" DECIMAL(5,2),
ADD COLUMN     "vitaminA" DECIMAL(6,1),
ADD COLUMN     "vitaminB1" DECIMAL(5,2),
ADD COLUMN     "vitaminB2" DECIMAL(5,2),
ADD COLUMN     "vitaminC" DECIMAL(5,1),
ADD COLUMN     "vitaminD" DECIMAL(5,2);
