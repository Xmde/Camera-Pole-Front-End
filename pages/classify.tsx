import { Plate, Event } from "@prisma/client";
import moment from "moment";
import Image from "next/image";
import { useState } from "react";
import Layout from "../components/layout";
import { eventWithCamera, eventWithPlateAndCamera } from "../interfaces";
import uuid4 from "uuid4";
import PopupImage from "../components/popup";

let date = "";

export default function Classify() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const [mainData, setData]: [
    {
      event: eventWithCamera | null;
      nearPlates: {
        event: eventWithPlateAndCamera;
        otherEvents: eventWithPlateAndCamera[];
      }[];
    },
    any
  ] = useState({
    event: null,
    nearPlates: [],
  });

  const [popupImage, setPopupImage] = useState("");

  const update = async () => {
    if (date === "") return;
    const startEpoch = moment(date).startOf("day").utc().unix();
    const endEpoch = moment(date).endOf("day").utc().unix();

    // console.log("/api/unknownevents?start=" + startEpoch + "&end=" + endEpoch);

    const res = await fetch(
      "/api/unknownevents?start=" + startEpoch + "&end=" + endEpoch
    );
    const data = await res.json();
    if (data.length == 0) return setData({ event: null, nearPlates: null });

    const nearPlatesRaw = await fetch("/api/getnearplates/" + data[0].id);
    const nearPlatesData: {
      event: eventWithPlateAndCamera;
      otherEvents: eventWithPlateAndCamera[];
    }[] = await nearPlatesRaw.json();

    setData({
      event: data[0],
      nearPlates: nearPlatesData,
    });
    // console.log(data[0]);
    // console.log(nearPlatesData);
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

  const newVehicle = async (motorbike: boolean) => {
    // let newPlate = prompt("Enter new plate number");
    // if (newPlate == null) return;
    // if (newPlate == "" && !motorbike)
    //   newPlate = "UV - " + uuid4().substring(0, 8).toUpperCase();
    // if (newPlate == "" && motorbike)
    //   newPlate = "MB - " + uuid4().substring(0, 8).toUpperCase();
    let newPlate: string;
    if (!motorbike) {
      newPlate = "UV - " + uuid4().substring(0, 8).toUpperCase();
    } else {
      newPlate = "MB - " + uuid4().substring(0, 8).toUpperCase();
    }

    const raw = JSON.stringify({
      plate: newPlate,
      vehicle_type_id: motorbike ? "motorbike" : null,
    });

    // console.log(raw);

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
      <div className="mt-1">
        <div
          className="d-flex flex-column"
          style={{ width: "518px", float: "left" }}
        >
          <div className="border border-dark rounded mx-1 d-inline-flex flex-column h-100">
            <Image
              src={mainData.event!.image}
              alt="Picture of Vehicle"
              width={508}
              height={508}
              style={{ float: "left" }}
            />
            <p className="text-center my-0">
              {mainData.event!.camera.camera_number +
                " - " +
                moment(mainData.event!.timestamp).format("mm")}
            </p>
          </div>
          <div className="d-flex flex-wrap">
            <div
              className="m-1 p-3 border border-dark rounded d-flex justify-content-center align-items-center text-center"
              style={{ cursor: "pointer", height: "50px" }}
              onClick={() => classify(null, "Bicycle")}
            >
              <p className="text-center my-0 display-6">Bikers</p>
            </div>
            <div
              className="m-1 p-3 border border-dark rounded d-flex justify-content-center align-items-center text-center"
              style={{ cursor: "pointer", height: "50px" }}
              onClick={() => newVehicle(true)}
            >
              <p className="text-center my-0 display-6">Motorbike</p>
            </div>
            <div
              className="m-1 p-3 border border-dark rounded d-flex justify-content-center align-items-center text-center"
              style={{ cursor: "pointer", height: "50px" }}
              onClick={() => classify(null, "People")}
            >
              <p className="text-center my-0 display-6">People</p>
            </div>
            <div
              className="m-1 p-3 border border-dark rounded d-flex justify-content-center align-items-center text-center"
              style={{ cursor: "pointer", height: "50px" }}
              onClick={() => classify(null, "None")}
            >
              <p className="text-center my-0 display-6">Nothing</p>
            </div>
            <div
              className="m-1 p-3 border border-dark rounded d-flex justify-content-center align-items-center text-center"
              style={{ cursor: "pointer", height: "50px" }}
              onClick={() => newVehicle(false)}
            >
              <p className="text-center my-0 display-6">New Vehicle</p>
            </div>
          </div>
        </div>
        <div className="d-flex flex-wrap">
          {mainData.nearPlates.map((plate) => (
            <div
              key={"div" + plate.event.id}
              className="mx-1 mb-2 border border-dark rounded d-flex flex-column"
              style={{ width: "250px", height: "250px" }}
            >
              <Image
                src={plate.event.image}
                alt="Picture of Vehicle"
                width={250}
                height={220}
                key={"img" + plate.event.id}
                style={{ cursor: "pointer" }}
                onClick={() => classify(plate.event.plate_id, "Vehicle")}
              />
              <div className="d-flex justify-content-around">
                {plate.otherEvents.map((event, index) => {
                  return (
                    <p
                      className="btn btn-outline-info btn-sm py-0 my-1"
                      style={{ fontSize: "0.8rem" }}
                      key={"p" + event.id}
                      onClick={() => setPopupImage(event.image)}
                    >
                      IMG {index + 1}
                    </p>
                  );
                })}
              </div>
              <p className="text-center my-0" key={"p" + plate.event.id}>
                {plate.event.plate?.plate} - {plate.event.camera.camera_number}{" "}
                - {moment(plate.event.timestamp).format("mm")}
              </p>
            </div>
          ))}
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
        <PopupImage image={popupImage} closePopup={() => setPopupImage("")} />
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
