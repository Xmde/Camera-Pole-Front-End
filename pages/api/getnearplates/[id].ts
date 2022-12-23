import moment from "moment";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { Event } from "@prisma/client";
import { eventWithPlateAndCamera } from "../../../interfaces";

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
          lte: moment(mainEvent.timestamp).add(30, "minutes").toDate(),
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
        plate: {
          include: {
            vehicle_type: true,
          },
        },
        camera: true,
      },
    });

    const eventsBefore = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: moment(mainEvent.timestamp).subtract(30, "minutes").toDate(),
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
        plate: {
          include: {
            vehicle_type: true,
          },
        },
        camera: true,
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

    const data: {
      event: eventWithPlateAndCamera;
      otherEvents: eventWithPlateAndCamera[];
    }[] = [];
    for (const event of events) {
      // Take the 4 newest events with the same plate id
      const otherEvents = await prisma.event.findMany({
        where: {
          plate_id: event.plate_id,
          id: {
            not: event.id,
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 4,
        include: {
          plate: {
            include: {
              vehicle_type: true,
            },
          },
          camera: true,
        },
      });
      data.push({ event, otherEvents });
    }

    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export default handler;
