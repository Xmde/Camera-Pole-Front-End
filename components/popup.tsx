import Image from "next/image";

export default function PopupImage(props: {
  image: string;
  closePopup: () => void;
}) {
  if (props.image === "") {
    return <></>;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        backgroundColor: "rgba(0,0,0,0.2)",
        top: 0,
        left: 0,
      }}
      className="d-flex justify-content-center align-items-center"
    >
      <div style={{ position: "relative" }}>
        <Image src={props.image} alt="Image" width={760} height={500} />
        <div
          style={{
            position: "absolute",
            top: "0px",
            right: "0px",
          }}
        >
          <p className="btn btn-danger" onClick={props.closePopup}>
            Close
          </p>
        </div>
      </div>
    </div>
  );
}
