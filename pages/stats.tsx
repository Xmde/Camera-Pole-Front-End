import prisma from "../lib/prisma";
import moment, { Moment } from "moment";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import Layout from "../components/layout";

export default function Stats(props: any) {
  const router = useRouter();

  const newDate = (newDate: string) => {
    router.push("/stats?date=" + newDate);
  };

  return (
    <Layout active_navbar="3">
      <div className="container-xl">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center display-6">Statistics</h1>
            <input
              className="form-control mx-1"
              type="date"
              value={props.date}
              onInput={(e: any) => {
                newDate(e.target.value);
              }}
            />
            {Object.keys(props.plateCounts).length === 0 && (
              <div className="text-center">
                <h1 className="display-6 text-danger">No data for this date</h1>
              </div>
            )}
            {Object.keys(props.plateCounts).length !== 0 && (
              <div className="d-flex justify-content-center">
                <div className="w-25">
                  <h3 className="text-center">Plate Counts</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th scope="col">Plate</th>
                        <th scope="col">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(props.plateCounts).map((plate) => {
                        return (
                          <tr key={plate}>
                            <th scope="row" className="w-1 align-middle">
                              {plate}
                            </th>
                            <td>{props.plateCounts[plate]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="w-25 mx-5">
                  <h3 className="text-center">Type Counts</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(props.vehicleTypeCounts).map(
                        (vehicleType) => {
                          return (
                            <tr key={vehicleType}>
                              <th scope="row" className="w-1 align-middle">
                                {vehicleType}
                              </th>
                              <td>{props.vehicleTypeCounts[vehicleType]}</td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>{" "}
                </div>
                <div className="w-25">
                  <h3 className="text-center">Other Counts</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row" className="w-1 align-middle">
                          Total Vehicles
                        </th>
                        <td>{props.totalVehicles}</td>
                      </tr>
                      <tr>
                        <th scope="row" className="w-1 align-middle">
                          Shanda T&T Estimate
                        </th>
                        <td>{props.truckAndTrailerEstimate}</td>
                      </tr>
                      <tr>
                        <th scope="row" className="w-1 align-middle">
                          Total People
                        </th>
                        <td>WIP</td>
                      </tr>
                      <tr>
                        <th scope="row" className="w-1 align-middle">
                          Total Bikes
                        </th>
                        <td>WIP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let date = moment(context.query.date);
  if (!date.isValid()) {
    date = moment();
  }
  const events = await prisma.event.findMany({
    where: {
      timestamp: {
        gte: date.startOf("day").toDate(),
        lte: date.endOf("day").toDate(),
      },
    },
    orderBy: {
      timestamp: "asc",
    },
    include: {
      plate: {
        include: {
          vehicle_type: true,
        },
      },
    },
  });

  const dbPlates = await prisma.plate.findMany({
    include: {
      vehicle_type: true,
    },
  });

  const vehicleTypes = await prisma.vehicleType.findMany();

  // Count how many events each plate has.
  // Only count events that are more than 3 minutes apart
  // from its last plate event.

  const plateTimes: { [plate: string]: Moment } = {};
  const plateCounts: { [plate: string]: number } = {};

  for (const event of events) {
    if (event.plate_id === null) continue;
    if (plateTimes[event.plate!.plate] === undefined) {
      plateTimes[event.plate!.plate] = moment(event.timestamp);
      plateCounts[event.plate!.plate] = 1;
    } else {
      const timeSinceLastPlate = moment(event.timestamp).diff(
        plateTimes[event.plate!.plate],
        "minutes"
      );
      if (timeSinceLastPlate > 5) {
        plateCounts[event.plate!.plate] += 1;
      }
      plateTimes[event.plate!.plate] = moment(event.timestamp);
    }
  }

  const vehicleTypeCounts: { [vehicleType: string]: number } = {};

  for (const vehicleType of vehicleTypes) {
    vehicleTypeCounts[vehicleType.name] = 0;
  }

  for (const plate of dbPlates) {
    if (plateCounts[plate.plate] === undefined) continue;
    vehicleTypeCounts[plate.vehicle_type.name] += plateCounts[plate.plate];
  }

  const totalVehicles = Object.values(plateCounts).reduce((a, b) => a + b, 0);

  console.log(vehicleTypeCounts);
  console.log(plateCounts);

  let numCabs = 0;
  let numTrailers = 0;
  let truckAndTrailerEstimate = 0;
  if (events.length > 0) {
    let previousEvent = moment(events[0].timestamp);
    let seenPlates: string[] = [];
    for (const event of events) {
      if (event.plate === null) continue;
      if (
        event.plate.vehicle_type.name !== "Shanda Cab" &&
        event.plate.vehicle_type.name !== "Shanda Trailer"
      )
        continue;
      if (seenPlates.includes(event.plate.plate)) continue;
      seenPlates.push(event.plate.plate);

      const timeSinceLastEvent = moment(event.timestamp).diff(
        previousEvent,
        "minutes"
      );

      if (event.plate.vehicle_type.name === "Shanda Cab") {
        numCabs += 1;
      } else if (event.plate.vehicle_type.name === "Shanda Trailer") {
        numTrailers += 1;
      }

      if (timeSinceLastEvent > 5) {
        if (numCabs > numTrailers) truckAndTrailerEstimate += numCabs;
        else truckAndTrailerEstimate += numTrailers;
        numCabs = 0;
        numTrailers = 0;
        seenPlates = [];
        previousEvent = moment(event.timestamp);
      }
    }
  }

  return {
    props: {
      date: date.format("YYYY-MM-DD"),
      vehicleTypeCounts: vehicleTypeCounts,
      plateCounts: plateCounts,
      totalVehicles: totalVehicles,
      truckAndTrailerEstimate,
    },
  };
}
