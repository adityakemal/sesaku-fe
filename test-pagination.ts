import { getPlans } from "./src/api/planApi";
import { apiClient } from "./src/api/client";

// Set a dummy user in apiClient for bun run? No, let's just make the sql query directly
import sql from "../budget-tracker-api/src/db";
const uid = 'b7acc259-c3b8-4989-87d3-850859352e13';

async function test() {
  const limit = 5;
  // Page 1
  let plans = await sql`SELECT start_date FROM plans WHERE user_id = ${uid} ORDER BY start_date DESC LIMIT ${limit}`;
  console.log("Page 1 length:", plans.length);
  let hasMore = plans.length === limit;
  let cursor = hasMore ? plans[plans.length - 1].start_date : null;
  console.log("Page 1 cursor:", cursor);

  // Page 2
  plans = await sql`SELECT start_date FROM plans WHERE user_id = ${uid} AND start_date < ${cursor} ORDER BY start_date DESC LIMIT ${limit}`;
  console.log("Page 2 length:", plans.length);
  hasMore = plans.length === limit;
  cursor = hasMore ? plans[plans.length - 1].start_date : null;
  console.log("Page 2 cursor:", cursor);

  // Page 3
  plans = await sql`SELECT start_date FROM plans WHERE user_id = ${uid} AND start_date < ${cursor} ORDER BY start_date DESC LIMIT ${limit}`;
  console.log("Page 3 length:", plans.length);
  hasMore = plans.length === limit;
  cursor = hasMore ? plans[plans.length - 1].start_date : null;
  console.log("Page 3 cursor:", cursor);

  process.exit(0);
}
test();
