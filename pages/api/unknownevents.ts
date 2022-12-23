import moment from "moment";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(req.query.start, req.query.end);
  let start = moment.unix(Number(req.query.start)).utc();
  let end = moment.unix(Number(req.query.end)).utc();

  if (!start.isValid()) start = moment.unix(0).utc();
  if (!end.isValid()) end = moment().utc();
  try {
    const events = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: start.toDate(),
          lte: end.toDate(),
        },
        OR: [
          {
            plate_id: null,
            object_type: "Vehicle",
          },
          { object_type: "Unknown" },
        ],
      },
      orderBy: {
        timestamp: "asc",
      },
      include: {
        camera: true,
      },
    });
    res.status(200).json(events);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export default handler;
