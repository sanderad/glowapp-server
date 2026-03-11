import { AppDataSource } from "../src/config/data-source";

async function fixSequence() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source initialized.");

    const tableName = "portfolio_images";
    const seqName = "portfolio_images_id_seq";

    // Get current max ID
    const maxIdResult = await AppDataSource.query(
      `SELECT MAX(id) as max_id FROM "${tableName}"`
    );
    const maxId = maxIdResult[0].max_id || 0;
    const nextVal = parseInt(maxId) + 1;

    console.log(
      `Max ID for ${tableName} is ${maxId}. Setting sequence ${seqName} to ${nextVal}.`
    );

    // Reset sequence
    // false as second argument means the next value returned will be nextVal
    await AppDataSource.query(`SELECT setval('${seqName}', ${nextVal}, false)`);

    console.log("Sequence reset successfully.");
  } catch (err) {
    console.error("Error fixing sequence:", err);
  } finally {
    process.exit(0);
  }
}

fixSequence();
