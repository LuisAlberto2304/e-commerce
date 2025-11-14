import fetch from "node-fetch";

async function run() {
  await fetch("http://localhost:3000/api/emails/checkAbandonedCarts");
  console.log("✅ Verificación de carritos ejecutada");
}

run();
