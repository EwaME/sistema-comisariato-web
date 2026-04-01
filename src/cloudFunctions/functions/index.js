const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
// 1. IMPORTANTE: Necesitamos initializeApp y getApps
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// 2. INICIALIZACIÓN: Verifica si ya existe una app para no duplicar
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

exports.descontarStockAlAprobar = onDocumentUpdated(
  "creditos/{creditoId}",
  async (event) => {
    const dataAntes = event.data.before.data();
    const dataDespues = event.data.after.data();

    // 1. Verificamos si el estado cambió a "APROBADO"
    const fueAprobado =
      dataAntes.estado !== "Aprobado" && dataDespues.estado === "Aprobado";

    if (!fueAprobado) {
      return null;
    }

    const { productoId, cantidad } = dataDespues;

    // Validación básica de datos
    if (!productoId || !cantidad) {
      console.error(
        "Crédito aprobado sin productoId o cantidad:",
        event.params.creditoId,
      );
      return null;
    }

    try {
      const productoRef = db.collection("productos").doc(productoId);

      await db.runTransaction(async (transaction) => {
        const productoDoc = await transaction.get(productoRef);

        if (!productoDoc.exists) {
          throw new Error("El producto no existe en el inventario");
        }

        const stockActual = productoDoc.data().stock || 0;

        if (stockActual < cantidad) {
          console.warn(
            `Stock insuficiente para el producto ${productoId}. Stock: ${stockActual}, Pedido: ${cantidad}`,
          );
        }

        // 3. Restamos la cantidad usando FieldValue.increment
        transaction.update(productoRef, {
          stock: FieldValue.increment(-cantidad),
        });
      });

      console.log(
        `Stock actualizado para producto ${productoId}. Se restaron ${cantidad} unidades.`,
      );
    } catch (error) {
      console.error("Error al actualizar stock:", error);
    }
  },
);
