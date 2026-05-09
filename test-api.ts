async function run() {
  console.log("Testing FRED FEDFUNDS...");
  try {
    const res1 = await fetch("http://localhost:3000/api/fred?seriesId=FEDFUNDS");
    console.log("Status:", res1.status);
    console.log("Response:", await res1.json());
  } catch(e) { console.error(e) }

  console.log("\nTesting Alpha Quote MSFT...");
  try {
    const res2 = await fetch("http://localhost:3000/api/alpha/quote?symbol=MSFT");
    console.log("Status:", res2.status);
    console.log("Response:", await res2.json());
  } catch(e) { console.error(e) }

  console.log("\nTesting Alpha Historical MSFT...");
  try {
    const res3 = await fetch("http://localhost:3000/api/alpha/historical?symbol=MSFT");
    console.log("Status:", res3.status);
    console.log("Response:", await res3.json());
  } catch(e) { console.error(e) }
}
run();

