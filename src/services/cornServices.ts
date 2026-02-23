import cron from "node-cron";
import { deleteOldGames } from "../db/functions.js";

// Schedule the DB Cleanup for Midnight (00:00) server time
cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily database cleanup...");
    try {
        await deleteOldGames();
        console.log("[CRON] Successfully deleted games older than 24 hours.");
    } catch (err) {
        console.error("[CRON] Database cleanup failed:", err);
    }
});