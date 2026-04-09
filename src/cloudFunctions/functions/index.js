const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

exports.descontarStockAlAprobar = onDocumentUpdated(
  "creditos/{creditoId}",
  async (event) => {
    const dataAntes = event.data.before.data();
    const dataDespues = event.data.after.data();

    const fueAprobado =
      dataAntes.estado !== "Aprobado" && dataDespues.estado === "Aprobado";

    if (!fueAprobado) return null;

    const { productoId, cantidad } = dataDespues;

    if (!productoId || !cantidad) {
      console.error(
        "Crédito aprobado sin productoId o cantidad:",
        event.params.creditoId,
      );
      return null;
    }

    try {
      const productoRef = db.collection("productos").doc(productoId);
      const configRef = db.collection("configuraciones").doc("config_global");

      await db.runTransaction(async (transaction) => {
        const productoDoc = await transaction.get(productoRef);
        const configDoc = await transaction.get(configRef);

        if (!productoDoc.exists) {
          throw new Error("El producto no existe en el inventario");
        }

        const stockActual = productoDoc.data().stock || 0;
        const stockMinimo = configDoc.exists
          ? configDoc.data().StockMinimoCierre || 0
          : 0;

        const stockResultante = stockActual - cantidad;

        const updates = {
          stock: FieldValue.increment(-cantidad),
          cantidadVendida: FieldValue.increment(cantidad),
        };

        if (stockResultante <= stockMinimo) {
          updates.activo = false;
          console.log(
            `Producto ${productoId} desactivado por alcanzar stock mínimo (${stockResultante} <= ${stockMinimo})`,
          );
        }

        if (stockActual < cantidad) {
          console.warn(
            `Stock insuficiente para ${productoId}. Stock: ${stockActual}, Restando: ${cantidad}. Quedará en negativo.`,
          );
        }

        transaction.update(productoRef, updates);
      });

      console.log(`Stock actualizado para producto ${productoId}.`);
    } catch (error) {
      console.error("Error al actualizar stock y estado:", error);
    }
  },
);
