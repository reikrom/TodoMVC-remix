import React from "react";
import { TodoItem } from "../routes/todos";

export const TodoCount = ({
  remainingTodos,
}: {
  remainingTodos: TodoItem[];
}) => {
  return (
    <span className="todo-count">
      <strong>{remainingTodos.length}</strong>{" "}
      {remainingTodos.length === 1 ? "item" : "items"} left
    </span>
  );
};
