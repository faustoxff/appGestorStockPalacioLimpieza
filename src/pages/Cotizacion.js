import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/main.css";

export default function Cotizacion({ onBack }) {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]);
  const [nuevo, setNuevo] = useState({ producto_id: null, cantidad: 1, precio: 0 });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase.from("productos").select("*");
    if (error) {
      console.error("Error al cargar productos:", error);
      alert("Error al conectar con la base de datos");
    } else {
      setProductos(data);
    }
  };

  const agregarItem = () => {
    if (!nuevo.producto_id) return alert("Seleccioná un producto");

    const producto = productos.find((p) => p.id === nuevo.producto_id);
    if (!producto) return alert("Producto no encontrado");

    const total = (nuevo.cantidad || 1) * (producto.precio || 0);
    setItems([
      ...items,
      {
        descripcion: producto.objeto,
        cantidad: nuevo.cantidad,
        precio: producto.precio,
        total,
      },
    ]);
    setNuevo({ producto_id: null, cantidad: 1, precio: 0 });
  };

  const totalCotizacion = items.reduce((sum, it) => sum + it.total, 0);

  const generarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Cotización - El Palacio de la Limpieza", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Producto", "Cantidad", "Precio", "Total"]],
      body: items.map((it) => [
        it.descripcion,
        it.cantidad,
        `$${it.precio}`,
        `$${it.total}`,
      ]),
    });

    doc.text(
      `TOTAL ESTIMADO: $${totalCotizacion.toFixed(2)}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    doc.save("cotizacion.pdf");
  };

  return (
    <main className="container">
      {onBack && (
        <Button
          label="← Volver al menú"
          icon="pi pi-arrow-left"
          className="p-button-sm p-button-secondary"
          onClick={onBack}
          style={{ marginBottom: "1rem" }}
        />
      )}

      <Card title="Cotización">
        <div className="p-fluid grid formgrid">
          <div className="field col-12 md:col-5">
            <Dropdown
              value={nuevo.producto_id}
              options={productos.map((p) => ({
                label: `${p.codigo_interno} — ${p.objeto}`,
                value: p.id,
              }))}
              onChange={(e) => {
                const producto = productos.find((p) => p.id === e.value);
                setNuevo({
                  ...nuevo,
                  producto_id: e.value,
                  precio: producto ? producto.precio : 0,
                });
              }}
              placeholder="Seleccionar producto"
            />
          </div>

          <div className="field col-12 md:col-2">
            <InputNumber
              placeholder="Cantidad"
              value={nuevo.cantidad}
              onValueChange={(e) => setNuevo({ ...nuevo, cantidad: e.value })}
            />
          </div>

          <div className="field col-12 md:col-2">
            <InputNumber
              placeholder="Precio"
              value={nuevo.precio}
              onValueChange={(e) =>
                setNuevo({ ...nuevo, precio: e.value || 0 })
              }
              mode="currency"
              currency="ARS"
              locale="es-AR"
            />
          </div>

          <div className="field col-12 md:col-2">
            <Button label="Agregar" icon="pi pi-plus" onClick={agregarItem} />
          </div>
        </div>

        <DataTable value={items} stripedRows>
          <Column field="descripcion" header="Producto" />
          <Column field="cantidad" header="Cantidad" />
          <Column field="precio" header="Precio" body={(r) => `$${r.precio}`} />
          <Column field="total" header="Total" body={(r) => `$${r.total}`} />
        </DataTable>

        <h3 style={{ textAlign: "right", marginTop: "1rem" }}>
          Total estimado: ${totalCotizacion.toFixed(2)}
        </h3>

        <Button
          label="Generar PDF"
          icon="pi pi-file-pdf"
          className="p-button-success"
          onClick={generarPDF}
        />
      </Card>
    </main>
  );
}
