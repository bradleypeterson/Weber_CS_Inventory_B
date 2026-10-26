import { pool } from "./index";
import { seedAnalyticsAssets } from "./analyticsSeed";
import { getAssetAnalytics } from "./procedures/analytics";

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const added = await seedAnalyticsAssets(connection);
    await connection.commit();
    console.log(JSON.stringify({ added, analytics: await getAssetAnalytics() }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch(error => { console.error(error instanceof Error ? error.message : "Analytics seed failed"); process.exitCode = 1; });
