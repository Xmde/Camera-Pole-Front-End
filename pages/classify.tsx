import { Plate } from "@prisma/client";
import moment from "moment";
import Image from "next/image";
import { useState } from "react";
import Layout from "../components/layout";
import { eventWithCamera } from "../interfaces";

let date = "";

export default function Classify() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const [mainData, setData]: [
    { event: eventWithCamera | null; nearPlates: any },
    any
  ] = useState({
    event: null,
    nearPlates: null,
  });

  const update = async () => {
    if (date === "") return;
    const startEpoch = moment(date).startOf("day").utc().unix();
    const endEpoch = moment(date).endOf("day").utc().unix();

    console.log("/api/unknownevents?start=" + startEpoch + "&end=" + endEpoch);

    const res = await fetch(
      "/api/unknownevents?start=" + startEpoch + "&end=" + endEpoch
    );
    const data = await res.json();
    if (data.length == 0) return setData({ event: null, nearPlates: null });

    const nearPlatesRaw = await fetch("/api/getnearplates/" + data[0].id);
    const nearPlatesData = await nearPlatesRaw.json();

    setData({
      event: data[0],
      nearPlates: nearPlatesData,
    });
    console.log(data[0]);
    console.log(nearPlatesData);
  };

  const classify = async (
    plate: string | null,
    object_type: "Vehicle" | "People" | "Bicycle" | "None"
  ) => {
    const raw = JSON.stringify({
      plate_id: plate,
      object_type: object_type,
    });

    const requestOptions: RequestInit = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch(`/api/event/${mainData.event!.id}`, requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));

    update();
  };

  const newVehicle = async (motorbiker: boolean) => {
    const newPlate = prompt("Enter new plate number");
    if (newPlate == null) return;

    const raw = JSON.stringify({
      plate: newPlate,
      vehicle_type_id: motorbiker ? "motorbike" : null,
    });

    console.log(raw);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const rawPlate = await fetch(`/api/plate`, requestOptions);
      const plate: Plate = await rawPlate.json();
      classify(plate.id, "Vehicle");
    } catch (e) {
      console.log(e);
    }
  };

  const generateClassifyHTML = () => {
    if (mainData.event === null)
      return (
        <div>
          <h2 className="text-center text-danger">No events to classify</h2>
        </div>
      );
    return (
      <div className="mt-1 d-flex">
        <div className="border border-dark rounded mx-1 d-inline-flex flex-column h-100">
          <Image
            src={mainData.event!.image}
            alt="Picture of Vehicle"
            width={508}
            height={508}
            style={{ float: "left" }}
          />
          <p className="text-center my-0">
            Camera Number - {mainData.event!.Camera.camera_number}
          </p>
        </div>
        <div className="d-flex flex-wrap">
          {mainData.nearPlates.map((plate: any) => (
            <div
              key={"div" + plate.id}
              className="mx-1 mb-2 border border-dark rounded"
              style={{ cursor: "pointer", width: "250px", height: "250px" }}
              onClick={() => classify(plate.plate_id, "Vehicle")}
            >
              <Image
                src={plate.image}
                alt="Picture of Vehicle"
                width={250}
                height={220}
                key={"img" + plate.id}
              />
              <p className="text-center my-0" key={"p" + plate.id}>
                {plate.Plate.plate} - {plate.Camera.camera_number}
              </p>
            </div>
          ))}
          <div
            className="mx-1 mb-2 border border-dark rounded d-flex justify-content-center align-items-center"
            style={{ cursor: "pointer", width: "250px", height: "250px" }}
            onClick={() => classify(null, "Bicycle")}
          >
            <p className="text-center my-0 display-5">Bikers</p>
          </div>
          <div
            className="mx-1 mb-2 border border-dark rounded d-flex justify-content-center align-items-center"
            style={{ cursor: "pointer", width: "250px", height: "250px" }}
            onClick={() => newVehicle(true)}
          >
            <p className="text-center my-0 display-5">Motorbiker</p>
          </div>
          <div
            className="mx-1 mb-2 border border-dark rounded d-flex justify-content-center align-items-center"
            style={{ cursor: "pointer", width: "250px", height: "250px" }}
            onClick={() => classify(null, "People")}
          >
            <p className="text-center my-0 display-5">People</p>
          </div>
          <div
            className="mx-1 mb-2 border border-dark rounded d-flex justify-content-center align-items-center"
            style={{ cursor: "pointer", width: "250px", height: "250px" }}
            onClick={() => classify(null, "None")}
          >
            <p className="text-center my-0 display-5">Nothing in Image</p>
          </div>
          <div
            className="mx-1 mb-2 border border-dark rounded d-flex justify-content-center align-items-center"
            style={{ cursor: "pointer", width: "250px", height: "250px" }}
            onClick={() => newVehicle(false)}
          >
            <p className="text-center my-0 display-5">New Vehicle</p>
          </div>
        </div>
      </div>
    );
  };

  const findLastDay = async () => {
    const res = await fetch("/api/oldestunknownevent");
    const data = await res.json();
    if (!data) return;
    date = moment.utc(data.timestamp).local().format("YYYY-MM-DD");
    update();
  };

  return (
    <Layout active_navbar="1">
      <>
        <div className="d-flex justify-content-center my-1">
          <button
            type="button"
            className="btn btn-primary mx-1"
            onClick={findLastDay}
          >
            Goto&nbsp;Oldest&nbsp;Day
          </button>
          <input
            className="form-control mx-1"
            type="date"
            onInput={(e: any) => {
              date = e.target.value;
              update();
            }}
          />
        </div>
        {generateClassifyHTML()}
      </>
    </Layout>
  );
}
