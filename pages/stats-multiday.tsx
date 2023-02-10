import prisma from "../lib/prisma";
import moment, { Moment } from "moment";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import Layout from "../components/layout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function downloadPDF() {
  const doc = new jsPDF("l", "pt", "letter");
  autoTable(doc, { html: "#dataTable" });
  doc.save("table.pdf");
  // const table = document.getElementById("dataTable");

  // if (table) {

  //   var res = doc.table()

  //   doc.html(table, {
  //     callback: function (doc) {
  //       doc.save("table.pdf");
  //     },
  //   });
  // }
}

export default function Stats(props: any) {
  const router = useRouter();

  const newStartDate = (newDate: string) => {
    router.push("/stats-multiday?startDate=" + newDate);
  };
  const newEndDate = (newDate: string) => {
    router.push("/stats-multiday?endDate=" + newDate);
  };

  return (
    <Layout active_navbar="4">
      <div className="container-xl">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center">
              <h1 className="text-center display-6 mx-3">
                Multi Day Statistics
              </h1>
              <div className="d-flex align-items-center mx-3">
                <button
                  type="button"
                  className="btn btn-primary mx-1"
                  onClick={downloadPDF}
                >
                  Download PDF
                </button>
              </div>
            </div>
            <div className="d-flex justify-content-center">
              <input
                className="form-control mx-1"
                type="date"
                value={props.startDate}
                onInput={(e: any) => {
                  newStartDate(e.target.value);
                }}
              />
              <input
                className="form-control mx-1"
                type="date"
                value={props.endDate}
                onInput={(e: any) => {
                  newEndDate(e.target.value);
                }}
              />
            </div>
            <div className="d-flex justify-content-center flex-column">
              <h3 className="text-center">Multi Day Stats</h3>
              <table className="table table-striped table-sm" id="dataTable">
                <thead>
                  <tr>
                    <th scope="col" className="small">
                      Date
                    </th>
                    <th scope="col" className="small">
                      Total Vehicle Count
                    </th>
                    <th scope="col" className="small">
                      Shanda T&T Estimate
                    </th>
                    {Object.keys(props.vehicleTypeCountsGlobal).map(
                      (vehicleType) => {
                        return (
                          <th scope="col" key={vehicleType} className="small">
                            {vehicleType}
                          </th>
                        );
                      }
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(props.data)
                    .reverse()
                    .map((date) => {
                      return (
                        <tr key={date}>
                          <th scope="row" className="w-1 align-middle small">
                            {date}
                          </th>
                          <td className="small">
                            {props.data[date].totalVehicles}
                          </td>
                          <td className="small">
                            {props.data[date].truckAndTrailerEstimate}
                          </td>
                          {Object.keys(props.vehicleTypeCountsGlobal).map(
                            (vehicleType) => {
                              return (
                                <td key={vehicleType} className="small">
                                  {
                                    props.data[date].vehicleTypeCounts[
                                      vehicleType
                                    ]
                                  }
                                </td>
                              );
                            }
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let startDate = moment(context.query.startDate);
  let endDate = moment(context.query.endDate);
  if (!startDate.isValid()) {
    startDate = moment();
  }
  if (!endDate.isValid()) {
    endDate = moment();
  }
  startDate = startDate.startOf("day");
  const startDateStatic = startDate.clone();
  endDate = endDate.endOf("day");

  let data: any = {};
  let vehicleTypeCountsGlobal: any;

  // Loop through each day in the range
  while (startDate.isSameOrBefore(endDate)) {
    const date = startDate;
    const events = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: date.startOf("day").utc().toDate(),
          lte: date.endOf("day").utc().toDate(),
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

    // console.log(vehicleTypeCounts);
    // console.log(plateCounts);

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

    data[date.format("YYYY-MM-DD")] = {
      vehicleTypeCounts: vehicleTypeCounts,
      plateCounts: plateCounts,
      totalVehicles: totalVehicles,
      truckAndTrailerEstimate,
    };
    vehicleTypeCountsGlobal = vehicleTypeCounts;
    startDate = startDate.add(1, "day");
  }

  // console.log(startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD"));

  return {
    props: {
      data,
      vehicleTypeCountsGlobal,
      startDate: startDateStatic.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    },
  };
}
