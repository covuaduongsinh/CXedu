// In ra DDL mà Better Auth mong đợi, để đối chiếu với migration của CX Platform.
import { getMigrations } from "better-auth/db/migration";

import { auth } from "../auth";

const { compileMigrations, toBeCreated, toBeAdded } = await getMigrations(
  auth.options,
);
console.log("-- tables to create:", toBeCreated.map((t) => t.table).join(", "));
console.log("-- tables to alter:", toBeAdded.map((t) => t.table).join(", "));
console.log(await compileMigrations());
process.exit(0);
