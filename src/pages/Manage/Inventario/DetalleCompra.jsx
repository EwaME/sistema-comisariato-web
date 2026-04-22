import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Check, X, Trash2, Download } from 'lucide-react';
import { obtenerCompraPorId, aceptarCompra, rechazarCompra, ingresarCompra } from '../../../services/comprasService';
import { useAuth } from '../../../auth/AuthProvider';

export default function DetalleCompra() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role } = useAuth();
    const [compra, setCompra] = useState(null);
    
    const esProveedor = role.includes("PROVEEDOR");
    const esGestor = role.includes("GESTOR DE INVENTARIO");

    useEffect(() => {
        obtenerCompraPorId(id).then(setCompra);
    }, [id]);

    const handleEliminarItem = (indexParaBorrar) => {        
        const nuevosItems = compra.items.filter((_, index) => index !== indexParaBorrar);
        setCompra({ ...compra, items: nuevosItems });
    };

    const handleAceptar = async () => {
        await aceptarCompra(compra.id, compra.items); 
        navigate('/compras');
    };

    const handleRechazar = async () => {
        await rechazarCompra(compra.id); 
        navigate('/compras');
    };

    const handleIngreso = async () => {
        await ingresarCompra(compra.id, compra.items); 
        navigate('/compras');
    };

    if (!compra) return <p className="p-8 text-center text-gray-500 font-bold">Cargando detalle...</p>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <button onClick={() => navigate('/compras')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold text-sm mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4"/> Regresar
            </button>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-purple-50 p-3 rounded-2xl">
                        <Package className="text-[#7C3AED] w-6 h-6"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#020817]">Detalle de Orden #{compra.id.slice(-6).toUpperCase()}</h2>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                            compra.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' :
                            compra.estado === 'ACEPTADO' ? 'bg-blue-50 text-blue-600' :
                            compra.estado === 'INGRESADO' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-600'
                        }`}>
                            {compra.estado}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b pb-2">Artículos Solicitados</h3>
                    
                    {compra.items && compra.items.length > 0 ? (
                        compra.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50">
                                <div>
                                    <p className="font-bold text-[#020817]">{item.nombre}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.categoria}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-[#7C3AED]">{item.cantidad} unds.</span>
                                    
                                    {esProveedor && compra.estado === "PENDIENTE" && (
                                        <button 
                                            onClick={() => handleEliminarItem(i)} 
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="No tengo este producto"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm font-bold text-gray-400 text-center py-4">No hay artículos en la lista.</p>
                    )}
                </div>

                {esProveedor && compra.estado === "PENDIENTE" && (
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button onClick={handleRechazar} className="w-full bg-white border-2 border-red-100 text-red-500 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                            <X className="w-5 h-5"/> Rechazar Todo
                        </button>
                        <button 
                            onClick={handleAceptar} 
                            disabled={compra.items.length === 0}
                            className={`w-full text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-md ${compra.items.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            <Check className="w-5 h-5"/> Enviar Pedido
                        </button>
                    </div>
                )}

                {esGestor && compra.estado === "ACEPTADO" && (
                    <div className="mt-8">
                        <button onClick={handleIngreso} className="w-full bg-[#020817] text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg">
                            Ingresar al Inventario
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}