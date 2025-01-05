import { Server } from "http";
import app from "./app";
import config from "./app/config";
import seedSuperAdmin from "./db/seedSuperAdmin";
let server: Server;
const main = async () => {
  try {
    const superAdmin = await seedSuperAdmin();
    console.log("seed super admin", superAdmin);

    server = app.listen(
      Number(config.port),
      //config.ip as string,
      () => {
        console.log(`⚡️[server]: Server is running at https://${config.ip}:${config.port}`);
      },
    );
  } catch (error) {
    console.log(error);
  }
};

main();

process.on("unhandledRejection", (error) => {
  console.log(error);
  console.log("unhandledRejection detected server shutting down 😈");

  if (server) {
    server.close(() => process.exit(1));
  }
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.log(error);
  console.log("uncaughtException detected server shutting down 😈");
  process.exit(1);
});
