import React from "react";
import { Link } from "react-router-dom";

const Orders: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-4">
        <Link to="/" className="text-slate-900 underline">
          ← Voltar
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-2">Pedidos</h1>
      <p className="text-gray-600">A lista de pedidos será carregada em breve.</p>
    </div>
  );
};

export default Orders;