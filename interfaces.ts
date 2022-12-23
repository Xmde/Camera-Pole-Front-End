import { Prisma } from "@prisma/client";

export interface EventQuery {
  plate_events: eventWithPlateAndCamera[];
  time_events: eventWithPlateAndCamera[];
  plate_page: number;
  time_page: number;
}

const eventWithPlateAndCamera = Prisma.validator<Prisma.EventArgs>()({
  include: {
    Plate: true,
    Camera: true,
  },
});

export type eventWithPlateAndCamera = Prisma.EventGetPayload<
  typeof eventWithPlateAndCamera
>;

const plateWithVehicleType = Prisma.validator<Prisma.PlateArgs>()({
  include: {
    VehicleType: true,
    Event: true,
  },
});

export type plateWithVehicleType = Prisma.PlateGetPayload<
  typeof plateWithVehicleType
>;

const eventWithCamera = Prisma.validator<Prisma.EventArgs>()({
  include: {
    Plate: true,
    Camera: true,
  },
});

export type eventWithCamera = Prisma.EventGetPayload<typeof eventWithCamera>;
