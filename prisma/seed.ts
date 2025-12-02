import prisma from '@/lib/prisma/client'

async function main() {
  // Seed a couple of sample rent roll units – this matches your current Prisma schema/client
  // await prisma.asset.createMany({
  //   data: [{

  //   }],
  //   skipDuplicates: true,
  // })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })