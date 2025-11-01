// src/scripts/syncProductsToAlgolia.js
const algoliasearch = require("algoliasearch");
const axios = require("axios");
require("dotenv").config(); // Carga las variables de .env

// Variables de entorno
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

// Verificación rápida
if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY || !MEDUSA_URL) {
  console.error(
    "❌ Por favor configura correctamente las variables de entorno en .env"
  );
  process.exit(1);
}

// Crear cliente Algolia
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex("products");

async function syncProducts() {
  try {
    console.log("🔹 Obteniendo productos desde Medusa...");

    const response = await axios.get(MEDUSA_URL + "/products");
    const products = response.data.products;

    if (!products || products.length === 0) {
      console.log("⚠️ No se encontraron productos en Medusa.");
      return;
    }

    console.log(`🔹 ${products.length} productos encontrados. Preparando para enviar a Algolia...`);

    const objectsToIndex = products.map((p) => ({
      objectID: p.id,
      title: p.title || "Sin título",
      description: p.description || "Sin descripción",
      price:
        p.variants &&
        p.variants[0] &&
        p.variants[0].prices &&
        p.variants[0].prices[0]
          ? p.variants[0].prices[0].amount
          : 0,
      thumbnail: p.thumbnail || "",
    }));

    await index.saveObjects(objectsToIndex);

    console.log("✅ Productos sincronizados con Algolia:");
    objectsToIndex.forEach((p) =>
      console.log(`   - ${p.title} (ID: ${p.objectID})`)
    );
  } catch (err) {
    console.error("❌ Error sincronizando productos:", err.message || err);
  }
}

syncProducts();
