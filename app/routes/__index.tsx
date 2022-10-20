import React from "react";
import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import {
  useCatch,
  useFetcher,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import type { Todo } from "@prisma/client";
import cuid from "cuid";
import { clsx as cn } from "clsx";
import { json } from "@remix-run/node";

import { requireUserId } from "~/session.server";
import { CompleteIcon, IncompleteIcon } from "~/components/icons";
import { Filters } from "~/components/Filters";
import { TodoCount } from "~/components/TodoCount";
import { I } from "~/routes/__index/$filter";
import { prisma } from "~/db.server";
import todosStylesheet from "~/styles/todos.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: todosStylesheet }];
};
export type TodoItem = Pick<Todo, "id" | "title" | "completed" | "createdAt">;
type LoaderData = {
  todos: Array<TodoItem>;
};
type Filter = "all" | "active" | "complete";

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  return json<LoaderData>({
    todos: await prisma.todo.findMany({ where: { userId } }),
  });
}

/**
  cleaner saner version is at: 
    localhost:3000/todos
    localhost:3000/todos/active
    localhost:3000/todos/completed

  Experimenting with spaRender...
  Cannot have actions in layout __index.tsx file so moved them to routes/__index/$filter.tsx and calling them from here.
  I tried avoiding shoving everything in root.tsx as an exercise but probably could have worked a lot simpler.
  
  things to revisit:
  * calling actions from parents/root
  * Find a better convention as to where to define spa type remix actions
 */
const spaRouteHack = "/__index?index";

export default function Todos() {
  const createNewFetcher = useFetcher();
  const toggleAllFetcher = useFetcher();
  const destroyCompletedFentcher = useFetcher();

  const todos = useLoaderData().todos.map((t: any) => ({
    ...t,
  })) as LoaderData["todos"];
  const remainingTodos = todos.filter((t) => !t.completed);
  const allCompleted = remainingTodos.length === 0;
  const haveTodosToClear = todos.length !== remainingTodos.length;

  const hasTodos = todos.length;
  const location = useLocation();
  let filter: Filter = "all";
  if (location.pathname.endsWith("/complete")) {
    filter = "complete";
  }
  if (location.pathname.endsWith("/active")) {
    filter = "active";
  }

  return (
    <>
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <createNewFetcher.Form
            action={spaRouteHack}
            method="post"
            className="create-form"
            onSubmit={(event) => {
              const form = event.currentTarget;
              const emptyInput =
                new FormData(form)?.get("title")?.length === 0 || 0;

              if (emptyInput) {
                event.preventDefault();
                return;
              }
              requestAnimationFrame(() => {
                form.reset();
              });
            }}
          >
            <input type="hidden" name="id" value={cuid()} />
            <input type="hidden" name="intent" value={I.Create} />
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
          <toggleAllFetcher.Form action={spaRouteHack} method="post">
            <input type="hidden" name="completed" value={`${!allCompleted}`} />
            <button
              className={`toggle-all ${allCompleted ? "checked" : ""}`}
              name="intent"
              value={I.ToggleAll}
              type="submit"
            >
              ❯
            </button>
          </toggleAllFetcher.Form>
          <ul className="todo-list">
            {todos.map((todo) => (
              <ListItem key={todo.id} todo={todo} filter={filter} />
            ))}
          </ul>
        </section>

        <footer hidden={!hasTodos} className="footer">
          <TodoCount remainingTodos={remainingTodos} />
          <Filters filter={filter} />
          <destroyCompletedFentcher.Form action={spaRouteHack} method="post">
            <input type="hidden" name="id" id="required" />
            <input type="hidden" name="title" title="required" />
            <button
              className="clear-completed"
              type="submit"
              name="intent"
              hidden={!haveTodosToClear}
              value={I.DestroyCompleted}
            >
              Clear completed
            </button>
          </destroyCompletedFentcher.Form>
        </footer>
      </section>
      {/* <Outlet /> */}
    </>
  );
}

const ListItem = ({ todo, filter }: { todo: TodoItem; filter: Filter }) => {
  const updateFetcher = useFetcher();
  const destroyTodoFetcher = useFetcher();
  const toggleTodoFetcher = useFetcher();

  const completed = todo.completed;
  const shouldRender =
    filter === "all" ||
    (filter === "complete" && completed) ||
    (filter === "active" && !completed);

  if (!shouldRender) return null;
  return (
    <li className={todo.completed ? "completed" : ""} key={todo.id}>
      <div className="view">
        <toggleTodoFetcher.Form action={spaRouteHack} method="post">
          <input type="hidden" name="id" value={todo.id} />
          <input type="hidden" name="completed" value={`${todo.completed}`} />
          <button
            className="toggle"
            type="submit"
            name="intent"
            value={I.Toggle}
          >
            {todo.completed ? <CompleteIcon /> : <IncompleteIcon />}
          </button>
        </toggleTodoFetcher.Form>

        <updateFetcher.Form action={spaRouteHack} method="post">
          <input type="hidden" name="intent" value={I.Update} />
          <input type="hidden" name="id" value={todo.id} />
          <input
            type="text"
            className="edit-input"
            name="title"
            defaultValue={todo.title}
            onBlur={({ currentTarget }) => {
              if (todo.title !== currentTarget.value) {
                updateFetcher.submit(currentTarget.form);
              }
            }}
          />
        </updateFetcher.Form>

        <destroyTodoFetcher.Form action={spaRouteHack} method="post">
          <input type="hidden" name="id" value={todo.id} />

          <button
            type="submit"
            className="destroy"
            value={I.Destroy}
            name="intent"
          />
        </destroyTodoFetcher.Form>
      </div>
    </li>
  );
};

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
