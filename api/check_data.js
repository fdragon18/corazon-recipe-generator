import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.generatedRecipe.count();
  console.log(`既存レシピ数: ${count}`);
  
  if (count > 0) {
    const sample = await prisma.generatedRecipe.findFirst();
    console.log('サンプルデータ:', JSON.stringify(sample, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
