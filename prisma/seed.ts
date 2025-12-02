import prisma from '@/lib/prisma/client'

async function main() {
  // Seed a couple of sample rent roll units – this matches your current Prisma schema/client
  await prisma.rentRollUnit.createMany({
    data: [
      {
        unitId: 'UNIT-001',
        propertyYear: 2024,
        propertyName: 'Sample Property 1',
        address: '123 Main St',
        zipcode: '10001',
        size: '75',
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        floor: '1',
        monthlyRent: 15000,
        contractedRent: 15000,
        occupancyStatus: 'occupied',
        leaseStart: new Date('2024-01-01'),
        leaseEnd: new Date('2024-12-31'),
        tenantName: 'John Doe',
      },
      {
        unitId: 'UNIT-002',
        propertyYear: 2024,
        propertyName: 'Sample Property 2',
        address: '456 Market St',
        zipcode: '10002',
        size: '60',
        rooms: 2,
        bedrooms: 1,
        bathrooms: 1,
        floor: '3',
        monthlyRent: 12000,
        contractedRent: 12000,
        occupancyStatus: 'vacant',
        leaseStart: new Date('2024-02-01'),
        leaseEnd: new Date('2025-01-31'),
        tenantName: 'Jane Smith',
      },
    ],
    skipDuplicates: true,
  })
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