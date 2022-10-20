import type { ActionArgs } from "@remix-run/server-runtime";

import {
  createTodo,
  destroyCompletedTodos,
  destroyTodo,
  toggleAllTodos,
  toggleTodo,
  updateTodo,
} from "../../models/todos.server";
import { requireUserId } from "../../session.server";

export enum I {
  Create = "create",
  Update = "update",
  Destroy = "destroy",
  DestroyCompleted = "destroyCompleted",
  Toggle = "toggleTodo",
  ToggleAll = "toggleAll",
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");
  const title = formData.get("title");

  switch (intent) {
    case I.Create:
      return await createTodo(id, title, userId);
    case I.Destroy:
      return await destroyTodo(id);
    case I.Update:
      return await updateTodo(id, title);
    case I.DestroyCompleted:
      return await destroyCompletedTodos(userId);
    case I.Toggle:
      return await toggleTodo(id, formData);
    case I.ToggleAll:
      return await toggleAllTodos(userId, formData);
    default:
      throw new Error("unknown intent");
  }
}

export default () => {
  return null;
};
