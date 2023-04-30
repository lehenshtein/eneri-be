import { closeCompletedGames } from './CloseCompletedGames';
import {CronJob} from "cron";

export function startCronJobs() {
    const closeGames = new CronJob(
    ' */5 * * * * ',
    function () {
      closeCompletedGames().then().catch(err => console.log(err));
    },
    null,
    true,
    'Europe/Kiev'
  );
}
