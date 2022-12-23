import { Prisma } from "@prisma/client";

export interface EventQuery {
  plate_events: eventWithPlateAndCamera[];
  time_events: eventWithPlateAndCamera[];
  plate_page: number;
  time_page: number;
}

const eventWithPlateAndCamera = Prisma.validator<Prisma.EventArgs>()({
  include: {
    plate: {
      include: {
        vehicle_type: true,
      },
    },
    camera: true,
  },
});

export type eventWithPlateAndCamera = Prisma.EventGetPayload<
  typeof eventWithPlateAndCamera
>;

const plateWithVehicleType = Prisma.validator<Prisma.PlateArgs>()({
  include: {
    vehicle_type: true,
    events: true,
  },
});

export type plateWithVehicleType = Prisma.PlateGetPayload<
  typeof plateWithVehicleType
>;

const eventWithCamera = Prisma.validator<Prisma.EventArgs>()({
  include: {
    plate: true,
    camera: true,
  },
});

export type eventWithCamera = Prisma.EventGetPayload<typeof eventWithCamera>;
