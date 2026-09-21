import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Search,
  Plus,
  Trash2,
  Package,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";
import {
  generarIdCompra,
  obtenerCompraPorId,
  crearCompra,
  actualizarCompra,
} from "../../../services/comprasService";
import { obtenerProductos } from "../../../services/productosService";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../firebase/firebase";

export default function CrearCompra() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [compraId, setCompraId] = useState("Generando...");
  const [estadoAnterior, setEstadoAnterior] = useState("");

  const [idProveedor, setIdProveedor] = useState("");
  const [nombreProveedor, setNombreProveedor] = useState("");

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  const [listaProveedores, setListaProveedores] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);

  const [busqProveedor, setBusqProveedor] = useState("");
  const [showDropProv, setShowDropProv] = useState(false);

  const [busqProducto, setBusqProducto] = useState("");
  const [showDropProd, setShowDropProd] = useState(false);
  const [cantidadTemp, setCantidadTemp] = useState(1);
  const [prodTemp, setProdTemp] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    const inicializar = async () => {
      try {
        const [usuariosSnap, productosData] = await Promise.all([
          getDocs(collection(db, "usuarios")),
          obtenerProductos(),
        ]);

        const proveedores = usuariosSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => Array.isArray(u.rol) && u.rol.includes("PROVEEDOR"));

        setListaProveedores(proveedores);
        setListaProductos(productosData.filter((p) => p.activo !== false));

        if (isEdit) {
          const compra = await obtenerCompraPorId(id);
          setCompraId(compra.compraId);
          setIdProveedor(compra.idProveedor || "");
          setNombreProveedor(compra.nombreProveedor || "");
          setBusqProveedor(compra.nombreProveedor || "");
          setProductosSeleccionados(compra.productos || []);
          setEstadoAnterior(compra.estado || "");
        } else {
          const nuevoId = await generarIdCompra();
          setCompraId(nuevoId);
        }
      } catch (error) {
        console.error(error);
        alert("Error al cargar los datos.");
      } finally {
        setCargandoDatos(false);
      }
    };
    inicializar();
  }, [id, isEdit]);

  const proveedoresFiltrados = listaProveedores.filter((p) =>
    (p.nombre || p.id).toLowerCase().includes(busqProveedor.toLowerCase())
  );

  const productosFiltrados = listaProductos.filter(
    (p) =>
      (p.nombre || p.id).toLowerCase().includes(busqProducto.toLowerCase()) &&
      !productosSeleccionados.find((s) => s.id === p.id)
  );

  const seleccionarProveedor = (prov) => {
    setIdProveedor(prov.id);
    setNombreProveedor(prov.nombre || prov.id);
    setBusqProveedor(prov.nombre || prov.id);
    setShowDropProv(false);
  };

  const seleccionarProductoTemp = (prod) => {
    setProdTemp(prod);
    setBusqProducto(prod.nombre || prod.id);
    setShowDropProd(false);
    setCantidadTemp(1);
  };

  const agregarProducto = () => {
    if (!prodTemp) {
      alert("Selecciona un producto de la lista.");
      return;
    }
    if (!cantidadTemp || Number(cantidadTemp) < 1) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }
    setProductosSeleccionados((prev) => [
      ...prev,
      {
        id: prodTemp.id,
        nombreProducto: prodTemp.nombre || prodTemp.id,
        cantidad: Number(cantidadTemp),
      },
    ]);
    setProdTemp(null);
    setBusqProducto("");
    setCantidadTemp(1);
  };

  const quitarProducto = (prodId) => {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== prodId));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!idProveedor) return alert("Selecciona un proveedor.");
    if (productosSeleccionados.length === 0)
      return alert("Agrega al menos un producto al pedido.");

    setCargando(true);
    try {
      if (isEdit) {
        await actualizarCompra(
          id,
          { idProveedor, nombreProveedor },
          productosSeleccionados,
          estadoAnterior
        );
      } else {
        await crearCompra(
          { compraId, idProveedor, nombreProveedor },
          productosSeleccionados,
          user?.email || ""
        );
      }
      navigate("/compras");
    } catch (error) {
      alert("Error al guardar el pedido: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFF]">
        <Loader2 className="animate-spin text-[#7C3AED] w-10 h-10 mb-4" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">
          Cargando...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto bg-[#FDFDFF] min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => navigate("/compras")}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#020817] tracking-tight">
          {isEdit ? "Editar Pedido" : "Nuevo Pedido de Compra"}
        </h1>
        {isEdit && estadoAnterior === "Rechazado" && (
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
              Al guardar, el pedido regresará a estado Pendiente
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* INFO BÁSICA */}
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Información del Pedido
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ID */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                ID del Pedido
              </label>
              <input
                value={compraId}
                disabled
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* PROVEEDOR */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Proveedor
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proveedor..."
                  value={busqProveedor}
                  onChange={(e) => {
                    setBusqProveedor(e.target.value);
                    setShowDropProv(true);
                    if (!e.target.value) { setIdProveedor(""); setNombreProveedor(""); }
                  }}
                  onFocus={() => setShowDropProv(true)}
                  onBlur={() => setTimeout(() => setShowDropProv(false), 150)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
              {showDropProv && proveedoresFiltrados.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {proveedoresFiltrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => seleccionarProveedor(p)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-[12px] font-black text-gray-800">
                        {p.nombre || p.id}
                      </p>
                      <p className="text-[10px] text-gray-400">{p.id}</p>
                    </button>
                  ))}
                </div>
              )}
              {showDropProv && proveedoresFiltrados.length === 0 && busqProveedor && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl p-4">
                  <p className="text-[11px] text-gray-400 font-bold text-center">
                    No se encontraron proveedores
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCTOS */}
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Productos del Pedido
          </h2>

          {/* Buscador de producto + cantidad */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Agregar producto
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={busqProducto}
                  onChange={(e) => {
                    setBusqProducto(e.target.value);
                    setShowDropProd(true);
                    if (!e.target.value) setProdTemp(null);
                  }}
                  onFocus={() => setShowDropProd(true)}
                  onBlur={() => setTimeout(() => setShowDropProd(false), 150)}
                  className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 outline-none"
                />
                {showDropProd && productosFiltrados.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {productosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => seleccionarProductoTemp(p)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        {p.imagenFrontalUrl && (
                          <img
                            src={p.imagenFrontalUrl}
                            className="w-8 h-8 rounded-lg object-cover border border-gray-100"
                            alt=""
                          />
                        )}
                        <div>
                          <p className="text-[12px] font-black text-gray-800">
                            {p.nombre}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {p.id} · Stock: {p.stock}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                min={1}
                value={cantidadTemp}
                onChange={(e) => setCantidadTemp(e.target.value)}
                placeholder="Cant."
                className="w-24 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-purple-100 outline-none"
              />

              <button
                type="button"
                onClick={agregarProducto}
                className="flex items-center gap-2 bg-[#020817] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          </div>

          {/* Lista de productos seleccionados */}
          {productosSeleccionados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
              <Package className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Sin productos agregados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {productosSeleccionados.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#020817] rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-gray-800">
                        {prod.nombreProducto}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">
                        {prod.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase">
                        Cantidad
                      </p>
                      <p className="text-sm font-black text-gray-800">
                        {prod.cantidad}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarProducto(prod.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 px-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Total de líneas: {productosSeleccionados.length}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase">
                  Unidades totales:{" "}
                  {productosSeleccionados.reduce((a, b) => a + b.cantidad, 0)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div className="flex justify-end gap-4 pb-8">
          <button
            type="button"
            onClick={() => navigate("/compras")}
            className="px-8 py-3 border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-2 px-8 py-3 bg-[#020817] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Guardar Cambios" : "Crear Pedido"}
          </button>
        </div>
      </form>
    </div>
  );
}
