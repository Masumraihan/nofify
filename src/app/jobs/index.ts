import Agenda from "agenda";
import config from "../config";

const agenda = new Agenda({
  db: {
    address: config.db.url as string,
    collection: "agendaJobs",
    //options: { useUnifiedTopology: true },
  },
  processEvery: "1 minute",
  maxConcurrency: 20,
});

agenda.on("ready", () => console.log("Agenda started!"));
agenda.on("error", () => console.log("Agenda connection error!"));
export default agenda;
