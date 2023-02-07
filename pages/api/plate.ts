import { create } from "domain";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";
import { convertPlate } from "../../utils";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const method = String(req.method);
  const plateText = String(req.body.plate);

  switch (method) {
    case "GET":
      const plate = await prisma.plate.findUnique({
        where: {
          id: convertPlate(plateText),
        },
      });
      res.status(200).json(plate);
      break;
    case "PUT":
      try {
        const plateUpdate = await prisma.plate.update({
          where: {
            id: convertPlate(plateText),
          },
          data: {
            vehicle_type_id: req.body.vehicle_type_id,
          },
        });
        res.status(200).json(plateUpdate);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      break;
    case "POST":
      let vehicle_type_id = req.body.vehicle_type_id;
      try {
        if (!vehicle_type_id) {
          if (req.body.plate.startsWith("UV")) {
            const vehicle_type = await prisma.vehicleType.findUniqueOrThrow({
              where: {
                name: "Unidentified",
              },
            });
            vehicle_type_id = vehicle_type.id;
          } else {
            const vehicle_type = await prisma.vehicleType.findUniqueOrThrow({
              where: {
                name: "Public",
              },
            });
            vehicle_type_id = vehicle_type.id;
          }
        }

        if (vehicle_type_id === "motorbike") {
          const vehicle_type = await prisma.vehicleType.findUniqueOrThrow({
            where: {
              name: "Motorbike",
            },
          });
          vehicle_type_id = vehicle_type.id;
        }

        // console.log(vehicle_type_id);
        const plateCreate = await prisma.plate.upsert({
          where: {
            id: convertPlate(req.body.plate),
          },
          create: {
            id: convertPlate(req.body.plate),
            plate: req.body.plate,
            vehicle_type_id: vehicle_type_id,
          },
          update: {},
        });
        res.status(200).json(plateCreate);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "PUT", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;
