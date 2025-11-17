import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";

export default function Ventas({ onBack }) {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [venta, setVenta] = useState({
    producto_id: "",
    cantidad: 0,
    fecha: new Date().toISOString().slice(0, 10),
  });

  const toast = useRef(null);

  useEffect(() => {
    cargarProductos();
    cargarVentas();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase.from("productos").select("*");
    if (error) {
      console.error("Error al cargar productos:", error);
    } else {
      setProductos(data || []);
    }
  };

  const cargarVentas = async () => {
    const { data, error } = await supabase
      .from("ventas")
      .select("*, productos(codigo_interno, objeto, precio)")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error al cargar ventas:", error);
    } else {
      const formateadas = (data || []).map((v) => ({
        ...v,
        codigo_interno: v.productos?.codigo_interno,
        objeto: v.productos?.objeto,
        total: (v.cantidad || 0) * (v.productos?.precio || 0),
      }));
      setVentas(formateadas);
    }
  };

  const registrarVenta = async () => {
    if (!venta.producto_id || !venta.cantidad) {
      return toast.current.show({
        severity: "warn",
        summary: "Atención",
        detail: "Completá todos los campos",
      });
    }

    const { error } = await supabase.from("ventas").insert([venta]);

    if (!error) {
      await supabase.rpc("descontar_stock", {
        pid: venta.producto_id,
        cantidad_vendida: venta.cantidad,
      });

      toast.current.show({
        severity: "success",
        summary: "Venta registrada",
        detail: "Stock actualizado",
      });

      cargarProductos();
      cargarVentas();

      setVenta({
        producto_id: "",
        cantidad: 0,
        fecha: new Date().toISOString().slice(0, 10),
      });
    } else {
      console.error(error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo registrar la venta",
      });
    }
  };

  return (
    <main className="container">
      <Toast ref={toast} />

      {onBack && (
        <Button
          label="← Volver al menú"
          icon="pi pi-arrow-left"
          className="p-button-sm p-button-secondary"
          onClick={onBack}
          style={{ marginBottom: "1rem" }}
        />
      )}

      <h1>Registrar venta</h1>

      <Card>
        <div className="p-fluid grid formgrid">
          <div className="field col-12 md:col-4">
            <Dropdown
              value={venta.producto_id}
              options={(productos || []).map((p) => ({
                label: `${p.codigo_interno} — ${p.objeto} (stock: ${p.cantidad})`,
                value: p.id,
              }))}
              onChange={(e) => setVenta({ ...venta, producto_id: e.value })}
              placeholder="Seleccionar producto"
            />
          </div>

          <div className="field col-12 md:col-3">
            <InputNumber
              placeholder="Cantidad"
              value={venta.cantidad}
              onValueChange={(e) =>
                setVenta({ ...venta, cantidad: e.value || 0 })
              }
            />
          </div>

          <div className="field col-12 md:col-3">
            <InputText
              type="date"
              value={venta.fecha}
              onChange={(e) =>
                setVenta({ ...venta, fecha: e.target.value })
              }
            />
          </div>

          <div className="field col-12 md:col-2">
            <Button
              label="Vender"
              icon="pi pi-shopping-cart"
              onClick={registrarVenta}
            />
          </div>
        </div>

        <DataTable value={ventas} paginator rows={5} stripedRows>
          <Column field="fecha" header="Fecha" />
          <Column field="codigo_interno" header="Código" />
          <Column field="objeto" header="Objeto" />
          <Column field="cantidad" header="Cant." />
          <Column
            field="total"
            header="Total"
            body={(v) => `$${v.total}`}
          />
        </DataTable>
      </Card>
    </main>
  );
}
