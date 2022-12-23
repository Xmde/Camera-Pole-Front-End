import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = String(req.query.id);
  const method = String(req.method);

  switch (method) {
    case "GET":
      const event = await prisma.event.findUnique({
        where: {
          id: id,
        },
      });
      res.status(200).json(event);
      break;
    case "PUT":
      try {
        const eventUpdate = await prisma.event.update({
          where: {
            id: id,
          },
          data: {
            plate_id: req.body.plate_id,
            object_type: req.body.object_type,
            direction: req.body.direction,
          },
          include: {
            plate: true,
          },
        });
        res.status(200).json(eventUpdate);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;
