import Layout from "../components/layout";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import prisma from "../lib/prisma";
import moment from "moment";
import { EventQuery, eventWithPlateAndCamera } from "../interfaces";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { convertPlate } from "../utils";
import PopupImage from "../components/popup";
export default function Search(data: EventQuery) {
  const router = useRouter();
  const [popupImage, setPopupImage] = useState("");
  let nextTimePage = false;
  let prevTimePage = false;
  let nextPlatePage = false;
  let prevPlatePage = false;

  const closePopup = () => {
    setPopupImage("");
  };

  const openPopup = (image: string) => {
    setPopupImage(image);
  };

  const search = async () => {
    const plateInput: HTMLInputElement | null = document.getElementById(
      "plateInput"
    ) as HTMLInputElement;
    const startInput: HTMLInputElement | null = document.getElementById(
      "startInput"
    ) as HTMLInputElement;
    const endInput: HTMLInputElement | null = document.getElementById(
      "endInput"
    ) as HTMLInputElement;

    let query = "";

    if (plateInput?.value) {
      query += "&plate=" + plateInput.value;
    }

    if (startInput?.value) {
      query += "&start=" + moment(startInput.value).utc().unix();
    }

    if (endInput?.value) {
      query += "&end=" + moment(endInput.value).utc().unix();
    }

    if (nextTimePage) {
      query += "&timepage=" + (data.time_page + 1);
    }

    if (prevTimePage) {
      query += "&timepage=" + (data.time_page - 1);
    }

    if (nextPlatePage) {
      query += "&platepage=" + (data.plate_page + 1);
    }

    if (prevPlatePage) {
      query += "&platepage=" + (data.plate_page - 1);
    }

    router.push("/search?" + query);
  };

  const gotoNextTimePage = () => {
    if (data.time_events.length !== 25) return;
    nextTimePage = true;
    search();
  };

  const gotoPrevTimePage = () => {
    if (data.time_page === 1) return;
    prevTimePage = true;
    search();
  };

  const gotoNextPlatePage = () => {
    if (data.plate_events.length !== 25) return;
    nextPlatePage = true;
    search();
  };

  const gotoPrevPlatePage = () => {
    if (data.plate_page === 1) return;
    prevPlatePage = true;
    search();
  };

  const generateDirection = (event: eventWithPlateAndCamera) => {
    if (event.direction === "Backward") {
      return event.camera.facing;
    }
    if (event.direction === "Forward") {
      if (event.camera.facing === "North") {
        return "South";
      }
      return "North";
    }
    return "Unknown";
  };

  return (
    <Layout active_navbar="2">
      <>
        <PopupImage image={popupImage} closePopup={closePopup} />
        <div className="container-fluid">
          <div className="row">
            <div className=" col">
              <h1 className="text-center display-6">Plate Lookup</h1>
              <div className="d-flex justify-content-center">
                <input
                  type="text"
                  className="form-control mx-1"
                  placeholder="Plate"
                  id="plateInput"
                />
                <button
                  type="button"
                  className="btn btn-primary mx-1"
                  onClick={search}
                >
                  Search
                </button>
              </div>
              {(data.plate_events.length == 25 || data.plate_page > 1) && (
                <div className="d-flex justify-content-center m-2">
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoPrevPlatePage}
                    disabled={data.plate_page === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoNextPlatePage}
                    disabled={data.plate_events.length !== 25}
                  >
                    Next
                  </button>
                </div>
              )}
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Date</th>
                    <th scope="col">Time</th>
                    <th scope="col">Camera #</th>
                    <th scope="col">Direction</th>
                    <th scope="col">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plate_events.map((value, index) => {
                    return (
                      <tr key={index}>
                        <th scope="row" className="align-middle">
                          {index + 1 + (data.plate_page - 1) * 25}
                        </th>
                        <td className="align-middle">
                          {moment(value.timestamp).format("YYYY-MM-DD")}
                        </td>
                        <td className="align-middle">
                          {moment(value.timestamp).format("HH:mm:ss")}{" "}
                        </td>
                        <td className="align-middle">
                          {value.camera.camera_number}
                        </td>
                        <td className="align-middle">
                          {generateDirection(value)}
                        </td>
                        <td>
                          <p
                            className="btn btn-outline-info m-0"
                            onClick={() => openPopup(value.image)}
                          >
                            Image
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(data.plate_events.length == 25 || data.plate_page > 1) && (
                <div className="d-flex justify-content-center m-2">
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoPrevPlatePage}
                    disabled={data.plate_page === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoNextPlatePage}
                    disabled={data.plate_events.length !== 25}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className=" col">
              <h1 className="text-center display-6">Time Lookup</h1>
              <div className="d-flex justify-content-center">
                <input
                  type="datetime-local"
                  className="form-control mx-1"
                  id="startInput"
                />
                <div className="d-flex flex-column justify-content-center">
                  <p className="m-0 p-0">to</p>
                </div>
                <input
                  type="datetime-local"
                  className="form-control mx-1"
                  id="endInput"
                />
                <button
                  type="button"
                  className="btn btn-primary mx-1"
                  onClick={search}
                >
                  Search
                </button>
              </div>
              {(data.time_events.length == 25 || data.time_page > 1) && (
                <div className="d-flex justify-content-center m-2">
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoPrevTimePage}
                    disabled={data.time_page === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoNextTimePage}
                    disabled={data.time_events.length !== 25}
                  >
                    Next
                  </button>
                </div>
              )}
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Date</th>
                    <th scope="col">Time</th>
                    <th scope="col">Type</th>
                    <th scope="col">Plate</th>
                    <th scope="col">P-Type</th>
                    <th scope="col">Camera #</th>
                    <th scope="col">Direction</th>
                    <th scope="col">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {data.time_events.map((value, index) => {
                    return (
                      <tr key={index}>
                        <th scope="row" className="align-middle">
                          {index + 1 + (data.time_page - 1) * 25}
                        </th>
                        <td className="align-middle">
                          {moment(value.timestamp).format("YYYY-MM-DD")}
                        </td>
                        <td className="align-middle">
                          {moment(value.timestamp).format("HH:mm:ss")}{" "}
                        </td>
                        <td className="align-middle">{value.object_type} </td>
                        <td className="align-middle">{value.plate?.plate} </td>
                        <td className="align-middle">
                          {value.plate?.vehicle_type.name}{" "}
                        </td>
                        <td className="align-middle">
                          {value.camera.camera_number}
                        </td>
                        <td className="align-middle">
                          {generateDirection(value)}
                        </td>
                        <td>
                          <p
                            className="btn btn-outline-info m-0"
                            onClick={() => openPopup(value.image)}
                          >
                            Image
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(data.time_events.length == 25 || data.time_page > 1) && (
                <div className="d-flex justify-content-center m-2">
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoPrevTimePage}
                    disabled={data.time_page === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary mx-1"
                    onClick={gotoNextTimePage}
                    disabled={data.time_events.length !== 25}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const plate: string = String(context.query.plate).toUpperCase();
  const plate_id = convertPlate(plate);
  const start = moment.unix(Number(context.query.start)).utc();
  const end = moment.unix(Number(context.query.end)).utc();
  const platePage = Number(context.query.platepage) || 1;
  const timePage = Number(context.query.timepage) || 1;
  const props: EventQuery = {
    plate_events: [],
    time_events: [],
    plate_page: platePage,
    time_page: timePage,
  };

  if (plate) {
    props.plate_events = await prisma.event.findMany({
      where: {
        plate_id: plate_id,
      },
      include: {
        plate: {
          include: {
            vehicle_type: true,
          },
        },
        camera: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 25,
      skip: (props.plate_page - 1) * 25,
    });
  }

  if (start.isValid() && end.isValid()) {
    props.time_events = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: start.toDate(),
          lte: end.toDate(),
        },
      },
      include: {
        plate: {
          include: {
            vehicle_type: true,
          },
        },
        camera: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 25,
      skip: (props.time_page - 1) * 25,
    });
  }

  return {
    props: JSON.parse(JSON.stringify(props)),
  };
}
