import moment from "moment";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const event = await prisma.event.findFirst({
      where: {
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
    });
    res.status(200).json(event);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export default handler;
