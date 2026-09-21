// Publica la documentación de la API en dist/api-docs (Swagger UI + docs/openapi.yaml).
// Se ejecuta automáticamente después de `vite build` (ver script "build" en package.json).
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "dist", "api-docs");
const swagger = join(raiz, "node_modules", "swagger-ui-dist");
const especificacion = join(raiz, "docs", "openapi.yaml");

for (const ruta of [especificacion, swagger]) {
  if (!existsSync(ruta)) {
    console.error(`[api-docs] No se encontró ${ruta}`);
    process.exit(1);
  }
}

mkdirSync(destino, { recursive: true });

for (const archivo of ["swagger-ui.css", "swagger-ui-bundle.js", "favicon-32x32.png"]) {
  copyFileSync(join(swagger, archivo), join(destino, archivo));
}
copyFileSync(especificacion, join(destino, "openapi.yaml"));

writeFileSync(
  join(destino, "index.html"),
  `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CrediFlow — API Docs</title>
    <link rel="icon" href="./favicon-32x32.png" />
    <link rel="stylesheet" href="./swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./swagger-ui-bundle.js"></script>
    <script src="./init.js"></script>
  </body>
</html>
`,
);

writeFileSync(
  join(destino, "init.js"),
  `window.ui = SwaggerUIBundle({
  url: "./openapi.yaml",
  dom_id: "#swagger-ui",
  deepLinking: true,
  docExpansion: "list",
  defaultModelsExpandDepth: 0,
  persistAuthorization: true,
});
`,
);

console.log("[api-docs] Swagger UI publicado en dist/api-docs");
