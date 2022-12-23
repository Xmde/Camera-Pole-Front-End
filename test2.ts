import prisma from "./lib/prisma";

async function main() {
  const plates = await prisma.plate.findMany({
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  for (const plate of plates) {
    if (plate._count.events === 0) {
      await prisma.plate.delete({
        where: {
          id: plate.id,
        },
      });
    }
  }
}
main();
