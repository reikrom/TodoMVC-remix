import { Link } from "@remix-run/react";
import React from "react";
import { clsx as cn } from "clsx";

export const Filters = ({ filter }: { filter: string }) => {
  return (
    <ul className="filters">
      <li>
        <Link
          to="."
          className={cn(filter === "all" && "selected")}
          prefetch="render"
        >
          All
        </Link>
      </li>{" "}
      <li>
        <Link
          to="active"
          className={cn(filter === "active" && "selected")}
          prefetch="render"
        >
          Active
        </Link>
      </li>{" "}
      <li>
        <Link
          to="complete"
          className={cn(filter === "complete" && "selected")}
          prefetch="render"
        >
          Completed
        </Link>
      </li>
    </ul>
  );
};
