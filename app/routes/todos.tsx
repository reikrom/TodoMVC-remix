import type { ActionArgs, LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useFetcher, useLoaderData } from "@remix-run/react";
import todosStylesheet from "./todos.css";

import { prisma } from "~/db.server";
import React from "react";
import cuid from "cuid";
import { requireUserId } from "../session.server";
import type { Todo } from "@prisma/client";
import invariant from "tiny-invariant";
import { CompleteIcon, IncompleteIcon } from "~/components/icons";
import { clsx as cn } from "clsx";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: todosStylesheet }];
};
type TodoItem = Pick<Todo, "id" | "title" | "completed" | "createdAt">;
type LoaderData = {
  todos: Array<TodoItem>;
};

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  return json<LoaderData>({
    todos: await prisma.todo.findMany({ where: { userId } }),
  });
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");
  const title = formData.get("title");

  switch (intent) {
    case "create":
      invariant(typeof id === "string", "id must be a string");
      invariant(typeof title === "string", "title must be a string");
      await prisma.todo.create({
        data: {
          id,
          title,
          completed: false,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
      return new Response(null);

    case "destroy":
      invariant(typeof id === "string", "id must be a string");
      await prisma.todo.delete({
        where: { id },
      });
      return new Response(null);
    case "update":
      console.log(formData.get("title"));
      // invariant(typeof id === "string", "id must be a string");
      // await prisma.todo.update({
      //   where: { id },
      //   data: { title: formData.get('')}
      // });
      return new Response(null);
    case "destroyAll":
      await prisma.todo.deleteMany({
        where: { userId },
      });
      return new Response(null);
    case "destroyCompleted":
      await prisma.todo.deleteMany({
        where: { userId, completed: true },
      });
      return new Response(null);

    case "toggleTodo":
      invariant(typeof id === "string", "id must be a string");
      await prisma.todo.update({
        where: { id },
        data: { completed: formData.get("completed") !== "true" },
      });
      return new Response(null);
    case "toggleAll":
      await prisma.todo.updateMany({
        where: { userId },
        data: { completed: formData.get("completed") === "true" },
      });
      return new Response(null);
    default:
      throw new Error("unknown intent");
  }
}

export default function Todos() {
  // const [newTodoIds, setNewTodoIds] = React.useState<string[]>(() => [cuid()]);
  // const isSubmitting = (createNewFetcher.state = "submitting");
  const createNewFormRef = React.useRef<HTMLFormElement>(null);
  const createNewFetcher = useFetcher();
  const updateFetcher = useFetcher();
  const toggleAllFetcher = useFetcher();
  const destroyTodoFetcher = useFetcher();
  const destroyAllFentcher = useFetcher();
  const destroyCompletedFentcher = useFetcher();
  const toggleTodoFetcher = useFetcher();

  const todos = useLoaderData().todos.map((t: any) => ({
    ...t,
  })) as LoaderData["todos"];
  const remainingTodos = todos.filter((t) => !t.completed);
  const allCompleted = remainingTodos.length === 0;

  const hasTodos = todos.length;
  // TODO: get the createForm to reset through useEffect
  // React.useEffect(() => {
  //   if (!createNewFormRef.current) return;

  //   if (isSubmitting) {
  //     console.log(
  //       "%ccreateNewFormRef%o",
  //       "background: red; color: white;",
  //       createNewFormRef.current.reset
  //     );
  //     // createNewFormRef.current.rest();
  //   }
  // }, [createNewFetcher.state, isSubmitting]);

  return (
    <>
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <createNewFetcher.Form
            ref={createNewFormRef}
            method="post"
            className="create-form"
            onSubmit={(event) => {
              const form = event.currentTarget;
              requestAnimationFrame(() => {
                form.reset();
              });
            }}
          >
            <input type="hidden" name="id" value={cuid()} />
            <input type="hidden" name="intent" value="create" />
            <input
              type="text"
              className="new-todo"
              name="title"
              autoFocus
              placeholder="What needs to be done?"
            />
          </createNewFetcher.Form>
        </header>
        <section className={cn("main", !hasTodos && "no-todos")}>
          <toggleAllFetcher.Form method="post">
            <input type="hidden" name="completed" value={`${!allCompleted}`} />
            <button
              className={`toggle-all ${allCompleted ? "checked" : ""}`}
              name="intent"
              value="toggleAll"
              type="submit"
            >
              ❯
            </button>
          </toggleAllFetcher.Form>
          <ul className="todo-list">
            {todos.map((todo) => (
              <li className={todo.completed ? "completed" : ""} key={todo.id}>
                <div className="view">
                  <toggleTodoFetcher.Form method="post">
                    <input type="hidden" name="id" value={todo.id} />
                    <input
                      type="hidden"
                      name="completed"
                      value={`${todo.completed}`}
                    />
                    <button
                      className="toggle"
                      type="submit"
                      name="intent"
                      value="toggleTodo"
                    >
                      {todo.completed ? <CompleteIcon /> : <IncompleteIcon />}
                    </button>
                  </toggleTodoFetcher.Form>

                  <updateFetcher.Form method="post">
                    <input type="hidden" name="intent" value="update" />
                    <input type="hidden" name="id" value={todo.id} />
                    <input
                      type="text"
                      className="edit-input"
                      defaultValue={todo.title}
                      onBlur={({ currentTarget }) => {
                        if (todo.title !== currentTarget.value) {
                          updateFetcher.submit(currentTarget.form);
                        }
                      }}
                    />
                  </updateFetcher.Form>

                  <destroyTodoFetcher.Form method="post">
                    <input type="hidden" name="id" value={todo.id} />

                    <button
                      type="submit"
                      className="destroy"
                      value="destroy"
                      name="intent"
                    />
                  </destroyTodoFetcher.Form>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer hidden={!hasTodos} className="footer">
          <span className="todo-count">
            <strong>{remainingTodos.length}</strong>{" "}
            {remainingTodos.length === 1 ? "item" : "items"} left
          </span>
          <destroyCompletedFentcher.Form method="post">
            <input type="hidden" name="id" id="required" />
            <input type="hidden" name="title" title="required" />
            <button
              className="clear-completed"
              type="submit"
              name="intent"
              value="destroyCompleted"
            >
              DESTROY COMPLETED
            </button>
          </destroyCompletedFentcher.Form>

          <destroyAllFentcher.Form method="post">
            <input type="hidden" name="id" id="required" />
            <input type="hidden" name="title" title="required" />
            <button
              className="clear-completed"
              type="submit"
              name="intent"
              value="destroyAll"
            >
              DESTROY ALL
            </button>
          </destroyAllFentcher.Form>
        </footer>
      </section>
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  if (caught.status === 404) {
    return <div>Not found</div>;
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary() {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex justify-center bg-red-100 pt-4 text-red-500">
        <div className="text-red-brand text-center">
          <div className="text-lg font-bold">Oh snap!</div>
          <div className="px-2 text-base">Something whent wrong</div>
        </div>
      </div>
    </div>
  );
}
