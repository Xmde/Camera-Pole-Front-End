import Link from "next/link";

export default function Navbar(props: any) {
  return (
    <div className="container mw-100 px-0">
      <header className="d-flex justify-content-center py-3 bg-dark">
        <ul className="nav nav-pills">
          <li className="nav-item mx-2 py-0">
            <Link href="/" className="text-decoration-none">
              <p
                className={`nav-link ${
                  props.active === "0" ? "active" : ""
                } text-white my-0`}
                aria-current="page"
              >
                Home
              </p>
            </Link>
          </li>
          <li className="nav-item mx-2 py-0">
            <Link href="/classify" className="text-decoration-none">
              <p
                className={`nav-link ${
                  props.active === "1" ? "active" : ""
                } text-white my-0`}
                aria-current="page"
              >
                Classify
              </p>
            </Link>
          </li>
          <li className="nav-item mx-2 py-0">
            <Link href="/search" className="text-decoration-none">
              <p
                className={`nav-link ${
                  props.active === "2" ? "active" : ""
                } text-white my-0`}
                aria-current="page"
              >
                Search
              </p>
            </Link>
          </li>
          <li className="nav-item mx-2 py-0">
            <Link href="/stats" className="text-decoration-none">
              <p
                className={`nav-link ${
                  props.active === "3" ? "active" : ""
                } text-white my-0`}
                aria-current="page"
              >
                Stats
              </p>
            </Link>
          </li>
          <li className="nav-item mx-2 py-0">
            <Link href="/plates" className="text-decoration-none">
              <p
                className={`nav-link ${
                  props.active === "4" ? "active" : ""
                } text-white my-0`}
                aria-current="page"
              >
                Plates
              </p>
            </Link>
          </li>
          <li className="nav-item mx-2 py-0">
            <Link href="/pplbikes" className="text-decoration-none">
              <p
                className={`nav-link ${
                  props.active === "5" ? "active" : ""
                } text-white my-0`}
                aria-current="page"
              >
                People & Bikes
              </p>
            </Link>
          </li>
        </ul>
      </header>
    </div>
  );
}
