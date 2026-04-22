import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, ShoppingCart, Package } from 'lucide-react';
import { crearCompra } from '../../../services/comprasService';
import { obtenerProductos } from '../../../services/productosService';
import { obtenerCategorias } from '../../../services/categoriasService';

export default function CrearCompra() {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);
    
    const [categoriasDb, setCategoriasDb] = useState([]);
    const [productosDb, setProductosDb] = useState([]);
    
    const [categoriaSelec, setCategoriaSelec] = useState('');
    const [productoSelec, setProductoSelec] = useState('');
    const [cantidad, setCantidad] = useState('');
    
    const [itemsCompra, setItemsCompra] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        const cats = await obtenerCategorias();
        const prods = await obtenerProductos();
        setCategoriasDb(cats);
        setProductosDb(prods.filter(p => p.activo));
    };

    const productosFiltrados = productosDb.filter(p => p.categoria === categoriaSelec);

    const agregarAlCarrito = () => {
        if (!productoSelec || !cantidad || cantidad <= 0) {
            
        }
        else {
            const producto = productosDb.find(p => p.id === productoSelec);
            
            const existe = itemsCompra.find(item => item.productoId === producto.id);
            
            if (existe) {
                setItemsCompra(itemsCompra.map(item => 
                    item.productoId === producto.id 
                    ? { ...item, cantidad: Number(item.cantidad) + Number(cantidad) }
                    : item
                ));
            } else {
                setItemsCompra([...itemsCompra, {
                    productoId: producto.id,
                    nombre: producto.nombre,
                    categoria: producto.categoria,
                    cantidad: Number(cantidad)
                }]);
            }

            setProductoSelec('');
            setCantidad('');
        }
    };

    const quitarDelCarrito = (idProducto) => {
        setItemsCompra(itemsCompra.filter(item => item.productoId !== idProducto));
    };

    const handleGuardarOrden = async () => {
        if (itemsCompra.length === 0) return alert("Agrega al menos un producto a la orden.");
        
        setCargando(true);
        try {
            await crearCompra({ items: itemsCompra });
            navigate('/compras');
        } catch (error) {
            console.error("Error:", error);
            alert("Error al guardar la orden");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/compras')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-[#020817]">Nueva Orden de Compra</h2>
                    <p className="text-sm text-gray-500">Solicita reabastecimiento al proveedor</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Agregar Producto</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Categoría</label>
                            <select 
                                value={categoriaSelec} 
                                onChange={(e) => { setCategoriaSelec(e.target.value); setProductoSelec(''); }}
                                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                            >
                                <option value="">Selecciona categoría...</option>
                                {categoriasDb.map(cat => (
                                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Producto</label>
                            <select 
                                value={productoSelec} 
                                onChange={(e) => setProductoSelec(e.target.value)}
                                disabled={!categoriaSelec}
                                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 disabled:opacity-50"
                            >
                                <option value="">Selecciona producto...</option>
                                {productosFiltrados.map(prod => (
                                    <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Cantidad</label>
                            <input 
                                type="number" min="1" 
                                value={cantidad} 
                                onChange={(e) => setCantidad(e.target.value)}
                                placeholder="0"
                                className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" 
                            />
                        </div>

                        <button 
                            onClick={agregarAlCarrito}
                            className="w-full mt-2 bg-gray-900 text-white text-[11px] font-bold py-3.5 rounded-xl uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            Agregar a la lista
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-[#7C3AED]" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#020817]">Resumen de la Orden</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[250px]">
                        {itemsCompra.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                                <Package className="w-12 h-12" />
                                <p className="text-xs font-bold uppercase tracking-widest">La lista está vacía</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {itemsCompra.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-[#F8F9FF] p-4 rounded-2xl border border-gray-50">
                                        <div>
                                            <p className="font-bold text-[#020817] text-sm">{item.nombre}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.categoria}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-black text-[#7C3AED]">{item.cantidad} unds.</span>
                                            <button onClick={() => quitarDelCarrito(item.productoId)} className="text-red-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-50">
                        <button 
                            onClick={handleGuardarOrden}
                            disabled={cargando || itemsCompra.length === 0}
                            className={`w-full text-white text-[11px] font-bold py-4 rounded-xl shadow-md uppercase tracking-widest transition-colors ${cargando || itemsCompra.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#7C3AED] hover:bg-purple-700'}`}
                        >
                            {cargando ? 'Generando Orden...' : 'Confirmar y Enviar Orden'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}