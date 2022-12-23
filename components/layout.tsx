import Navbar from "./navbar";
import type { ReactElement } from "react";

export default function Layout({
  children,
  active_navbar,
}: {
  children: ReactElement;
  active_navbar: string;
}) {
  return (
    <>
      <Navbar active={active_navbar} />
      <main>{children}</main>
    </>
  );
}
