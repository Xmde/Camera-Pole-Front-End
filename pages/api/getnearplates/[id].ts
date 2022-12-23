import moment from "moment";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const mainEvent = await prisma.event.findUnique({
    where: {
      id: String(req.query.id),
    },
  });

  if (!mainEvent) return res.status(404).json({ error: "Event not found" });

  try {
    const eventsAfter = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: moment(mainEvent.timestamp).toDate(),
          lte: moment(mainEvent.timestamp).add(1, "hour").toDate(),
        },
        plate_id: {
          not: null,
        },
        object_type: "Vehicle",
        id: {
          not: String(req.query.id),
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      take: 10,
      include: {
        Plate: true,
        Camera: true,
      },
    });

    const eventsBefore = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: moment(mainEvent.timestamp).subtract(1, "hour").toDate(),
          lte: moment(mainEvent.timestamp).toDate(),
        },
        plate_id: {
          not: null,
        },
        object_type: "Vehicle",
        id: {
          not: String(req.query.id),
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 10,
      include: {
        Plate: true,
        Camera: true,
      },
    });

    const events = [];
    const seenPlates: string[] = [];

    for (const event of eventsBefore) {
      if (!seenPlates.includes(String(event.plate_id))) {
        seenPlates.push(String(event.plate_id));
        events.push(event);
      }
    }
    for (const event of eventsAfter) {
      if (!seenPlates.includes(String(event.plate_id))) {
        seenPlates.push(String(event.plate_id));
        events.push(event);
      }
    }

    res.status(200).json(events);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export default handler;
