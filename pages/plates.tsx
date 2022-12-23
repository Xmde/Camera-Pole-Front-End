import { Event, VehicleType } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { useState } from "react";
import Layout from "../components/layout";
import PopupImage from "../components/popup";
import { plateWithVehicleType } from "../interfaces";
import prisma from "../lib/prisma";
import cookie from "cookie";
import { useCookies } from "react-cookie";
import moment from "moment";
import { useRouter } from "next/router";

export default function Plates({
  plates: platesProps,
  vehicleTypes,
}: {
  plates: plateWithVehicleType[];
  vehicleTypes: VehicleType[];
}) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const [plates, setPlates] = useState(platesProps);
  const [image, setImage] = useState("");
  const [cookie, setCookie] = useCookies(["filter_date"]);
  const router = useRouter();

  const handleTypeChange = async (vehicleTypeId: string, plateId: string) => {
    const raw = JSON.stringify({
      plate: plateId,
      vehicle_type_id: vehicleTypeId,
    });

    const requestOptions: RequestInit = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch(`/api/plate`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        if (JSON.parse(result).vehicle_type_id === vehicleTypeId) {
          const newPlates = plates.map((plate) => {
            if (plate.id === plateId) {
              plate.vehicle_type_id = vehicleTypeId;
            }
            return plate;
          });

          setPlates(newPlates);
        }
      })
      .catch((error) => console.log("error", error));
  };

  const updateCookie = () => {
    setCookie("filter_date", moment().unix(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      sameSite: true,
    });
    router.reload();
  };

  const generateImgHtml = (events: Event[]) => {
    return (
      <div className="d-flex">
        {events.map((event) => {
          return (
            <p
              className="btn btn-outline-info mx-1 my-0"
              onClick={() => setImage(event.image)}
              key={event.id}
            >
              Image
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <Layout active_navbar="4">
      <>
        <PopupImage image={image} closePopup={() => setImage("")} />
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-center align-items-center">
                <p
                  className="btn btn-outline-info mx-3 my-0"
                  onClick={() => router.push("/allplates")}
                >
                  All Plates
                </p>
                <h1 className="text-center display-6 mx-3 my-0">
                  Plate Editor
                </h1>
                <p
                  className="btn btn-outline-info mx-3 my-0"
                  onClick={updateCookie}
                >
                  Finished Classifying
                </p>
              </div>
              {plates.length == 0 && (
                <div className="text-center">
                  <h2 className="text-danger">No plates to classify</h2>
                </div>
              )}
              {plates.length > 0 && (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">Plate</th>
                      <th scope="col">Highest</th>
                      <th scope="col">Options</th>
                      <th scope="col">Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plates.map((plate) => {
                      return (
                        <tr key={plate.id}>
                          <th scope="row" className="w-1 align-middle">
                            {plate.plate}
                          </th>
                          <td className="align-middle">
                            {plate.events.reduce((prev, current) => {
                              return Number(current.camera_id) > prev
                                ? Number(current.camera_id)
                                : prev;
                            }, 0)}
                          </td>
                          <td className="py-0 align-middle">
                            <div
                              key={"div" + plate.id}
                              className="d-flex flex-wrap"
                            >
                              {vehicleTypes.map((vehicleType) => {
                                return (
                                  <div
                                    key={"key" + vehicleType.id}
                                    className="mx-1"
                                  >
                                    <input
                                      type="radio"
                                      className="btn-check"
                                      name={"options" + plate.id}
                                      id={plate.id + vehicleType.id}
                                      key={plate.id + vehicleType.id}
                                      checked={
                                        plate.vehicle_type_id === vehicleType.id
                                      }
                                      onChange={() =>
                                        handleTypeChange(
                                          vehicleType.id,
                                          plate.id
                                        )
                                      }
                                    />
                                    <label
                                      className="btn btn-outline-secondary btn-sm py-0"
                                      style={{ fontSize: "0.8rem" }}
                                      htmlFor={plate.id + vehicleType.id}
                                    >
                                      {vehicleType.name}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td>{generateImgHtml(plate.events)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const cookies = cookie.parse(context.req.headers.cookie ?? "");
  const filter_date = Number(cookies.filter_date) || 0;
  console.log(moment.unix(filter_date).format("YYYY-MM-DD HH:mm:ss"));
  let plates = await prisma.plate.findMany({
    include: {
      vehicle_type: true,
      events: {
        take: 4,
        orderBy: {
          timestamp: "asc",
        },
      },
    },
    where: {
      vehicle_type: {
        name: "Public",
      },
      events: {
        some: {
          camera: {
            camera_number: {
              gte: 22,
            },
          },
        },
        every: {
          timestamp: {
            gte: moment.unix(filter_date).toDate(),
          },
        },
      },
    },
  });

  const unknownPlates = await prisma.plate.findMany({
    include: {
      vehicle_type: true,
      events: {
        take: 4,
        orderBy: {
          timestamp: "asc",
        },
      },
    },
    where: {
      vehicle_type: {
        name: "Unidentified",
      },
      events: {
        every: {
          timestamp: {
            gte: moment.unix(filter_date).toDate(),
          },
        },
      },
    },
  });

  // Gets rid of plates which only have events on one day.
  plates = plates.filter((plate) => {
    let days = new Set();
    plate.events.forEach((event) => {
      days.add(moment(event.timestamp).subtract(8, "h").format("YYYY-MM-DD"));
    });
    return days.size > 1;
  });

  plates = plates.concat(unknownPlates);

  //Sort plates so that the ones with the most recent event are at the top
  plates.sort((a, b) => {
    if (a.events[0].timestamp > b.events[0].timestamp) {
      return -1;
    } else if (a.events[0].timestamp < b.events[0].timestamp) {
      return 1;
    } else {
      return 0;
    }
  });

  const vehicleTypes = await prisma.vehicleType.findMany();

  return {
    props: {
      plates: JSON.parse(JSON.stringify(plates)),
      vehicleTypes,
    },
  };
}
