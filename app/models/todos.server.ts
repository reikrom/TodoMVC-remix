import { prisma } from "~/db.server";
import invariant from "tiny-invariant";

export async function toggleTodo(
  id: FormDataEntryValue | null,
  formData: FormData
) {
  invariant(typeof id === "string", "id must be a string");
  await prisma.todo.update({
    where: { id },
    data: { completed: formData.get("completed") !== "true" },
  });
  return new Response("ok");
}

export async function destroyCompletedTodos(userId: string) {
  await prisma.todo.deleteMany({
    where: { userId, completed: true },
  });
  return new Response("ok");
}

export async function updateTodo(
  id: FormDataEntryValue | null,
  title: FormDataEntryValue | null
) {
  invariant(typeof id === "string", "id must be a string");
  invariant(typeof title === "string", "title must be a string");
  await prisma.todo.update({
    where: { id },
    data: { title },
  });
  return new Response("ok");
}

export async function destroyTodo(id: FormDataEntryValue | null) {
  invariant(typeof id === "string", "id must be a string");
  await prisma.todo.delete({
    where: { id },
  });
  return new Response("ok");
}

export async function createTodo(
  id: FormDataEntryValue | null,
  title: FormDataEntryValue | null,
  userId: string
) {
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
  return new Response("ok");
}

export async function toggleAllTodos(userId: string, formData: FormData) {
  await prisma.todo.updateMany({
    where: { userId },
    data: { completed: formData.get("completed") === "true" },
  });
  return new Response("ok");
}
