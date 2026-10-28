const dinero = new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" });

export const formatearDinero = (n) => dinero.format(n || 0);
