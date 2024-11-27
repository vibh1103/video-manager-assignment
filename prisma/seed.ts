import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.video.createMany({
    data: [
      {
        name: 'video1',
        size: 18500000, // 5 MB
        duration: 11, // 2 minutes
        path: '/uploads/test/video1.mp4',
      },
      {
        name: 'video2',
        size: 15300000, // 2.5 MB
        duration: 26, // 1 minute
        path: '/uploads/test/video2.mp4',
      },
    ],
  });
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
