import prisma from "./lib/prisma";

const dict = {
  A: "A",
  B: "B",
  C: "C",
  D: "B",
  E: "E",
  F: "E",
  G: "B",
  H: "H",
  I: "I",
  J: "I",
  K: "B",
  L: "I",
  M: "M",
  N: "M",
  O: "B",
  P: "B",
  Q: "B",
  R: "B",
  S: "E",
  T: "I",
  U: "E",
  V: "E",
  W: "M",
  X: "E",
  Y: "E",
  Z: "I",
  "0": "B",
  "1": "I",
  "2": "I",
  "3": "B",
  "4": "B",
  "5": "E",
  "6": "B",
  "7": "I",
  "8": "B",
  "9": "9",
};

async function main() {
  const plates = await prisma.plate.findMany({
    include: {
      vehicle_type: true,
    },
  });

  for (const plate of plates) {
    let output = "";
    for (let i = 0; i < plate.plate.length; i++) {
      if (String(dict[plate.plate[i] as keyof typeof dict]) !== "undefined") {
        output += String(dict[plate.plate[i] as keyof typeof dict]);
      }
    }

    const plateSearchDuplicate = await prisma.plate.findUnique({
      where: {
        id: output,
      },
    });

    if (plateSearchDuplicate) {
      await prisma.event.updateMany({
        where: {
          plate_id: plate.id,
        },
        data: {
          plate_id: output,
        },
      });
      await prisma.plate.delete({
        where: {
          id: plate.id,
        },
      });
    } else {
      await prisma.plate.update({
        where: {
          id: plate.id,
        },
        data: {
          id: output,
        },
      });
    }
  }
}
main();
