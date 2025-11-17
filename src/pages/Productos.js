import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";

export default function Productos({ onBack }) {
  const [productos, setProductos] = useState([]);

  const [nuevo, setNuevo] = useState(initProducto());
  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(initProductoConId());

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const toast = useRef(null);


  function initProducto() {
    return {
      codigo_interno: "",
      objeto: "",
      descripcion: "",
      cantidad: 0,
      precio: 0,
    };
  }

  function initProductoConId() {
    return {
      id: null,
      ...initProducto(),
    };
  }

  function normalizarProducto(p) {
    return {
      codigo_interno: p.codigo_interno.trim(),
      objeto: p.objeto.trim(),
      descripcion: p.descripcion.trim(),
      cantidad: Number(p.cantidad),
      precio: Number(p.precio),
    };
  }

  const validarProducto = (data) => {
    if (!data.codigo_interno?.trim() || !data.objeto?.trim() || !data.descripcion?.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Atención",
        detail: "No podés dejar campos vacíos",
      });
      return false;
    }

    if (
      data.cantidad === null ||
      data.precio === null ||
      data.cantidad === "" ||
      data.precio === "" ||
      Number(data.cantidad) < 0 ||
      Number(data.precio) < 0
    ) {
      toast.current.show({
        severity: "warn",
        summary: "Atención",
        detail: "Cantidad y precio tienen que ser >= 0",
      });
      return false;
    }

    return true;
  };

  const manejarNumero = (valor) => (valor !== undefined && valor !== null ? valor : "");

  const actualizarListaLocal = (filtro, nuevosDatos) => {
    setProductos((prev) =>
      prev.map((p) =>
        filtro(p)
          ? {
              ...p,
              ...nuevosDatos,
            }
          : p
      )
    );
  };

  const filtrarPorId = (item) => (p) => p.id === item.id;
  const filtrarPorCodigo = (item) => (p) => p.codigo_interno === item.codigo_interno;

  const tieneId = (item) => Boolean(item?.id);


  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase.from("productos").select("*").eq("activo", true);

    if (error) {
      console.error("Error al cargar productos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los productos",
      });
      return;
    }

    setProductos(data || []);
  };


  const agregarProducto = async () => {
    if (!validarProducto(nuevo)) return;

    const dataNormalizada = normalizarProducto(nuevo);

    const { error } = await supabase.from("productos").insert([{ ...dataNormalizada, activo: true }]);

    if (error) {
      console.error(error);
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo agregar el producto" });
      return;
    }

    toast.current.show({ severity: "success", summary: "Éxito", detail: "Producto agregado" });

    setNuevo(initProducto());
    cargarProductos();
  };


  const abrirEditar = (producto) => {
    setEditData({ ...producto });
    setEditVisible(true);
  };

  const guardarEdicion = async () => {
    if (!validarProducto(editData)) return;

    const dataNormalizada = normalizarProducto(editData);

    const filtro = tieneId(editData)
      ? { id: editData.id }
      : { codigo_interno: editData.codigo_interno };

    const { error } = await supabase.from("productos").update(dataNormalizada).match(filtro);

    if (error) {
      console.error(error);
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudieron guardar los cambios" });
      return;
    }

    toast.current.show({ severity: "success", summary: "Guardado", detail: "Producto actualizado" });

    actualizarListaLocal(
      tieneId(editData) ? filtrarPorId(editData) : filtrarPorCodigo(editData),
      dataNormalizada
    );

    setEditVisible(false);
  };


  const abrirEliminar = (producto) => {
    setProductoAEliminar(producto);
    setDeleteVisible(true);
  };

  const confirmarEliminar = async () => {
    if (!productoAEliminar) return;

    setEliminando(true);

    const filtro = tieneId(productoAEliminar)
      ? { id: productoAEliminar.id }
      : { codigo_interno: productoAEliminar.codigo_interno };

    const { error } = await supabase.from("productos").update({ activo: false }).match(filtro);

    if (error) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No se pudo dar de baja el producto" });
      setEliminando(false);
      return;
    }

    toast.current.show({
      severity: "success",
      summary: "Dado de baja",
      detail: `"${productoAEliminar.objeto}" ya no está activo`,
    });

    setProductos((prev) =>
      prev.filter(
        tieneId(productoAEliminar)
          ? (p) => p.id !== productoAEliminar.id
          : (p) => p.codigo_interno !== productoAEliminar.codigo_interno
      )
    );

    setEliminando(false);
    setDeleteVisible(false);
  };


  const accionesTemplate = (rowData) => (
    <div style={{ display: "flex", gap: ".5rem" }}>
      <Button label="Editar" icon="pi pi-pencil" className="p-button-sm p-button-warning" onClick={() => abrirEditar(rowData)} />
      <Button label="Dar de baja" icon="pi pi-trash" className="p-button-sm p-button-danger" onClick={() => abrirEliminar(rowData)} />
    </div>
  );

  return (
    <main className="container" style={{ position: "relative" }}>
      <Toast ref={toast} />

      {onBack && (
        <Button label="← Volver al menú" icon="pi pi-arrow-left" className="p-button-sm p-button-secondary" onClick={onBack} style={{ marginBottom: "1rem" }} />
      )}

      <h1>Gestor de Productos</h1>

      {/* Formulario agregar */}
      <Card title="Agregar producto" style={{ marginBottom: "1rem" }}>
        <div className="p-fluid grid formgrid">
          <div className="field col-12 md:col-3">
            <InputText placeholder="Código" value={nuevo.codigo_interno} onChange={(e) => setNuevo({ ...nuevo, codigo_interno: e.target.value })} />
          </div>

          <div className="field col-12 md:col-3">
            <InputText placeholder="Objeto" value={nuevo.objeto} onChange={(e) => setNuevo({ ...nuevo, objeto: e.target.value })} />
          </div>

          <div className="field col-12 md:col-3">
            <InputText placeholder="Descripción" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} />
          </div>

          <div className="field col-12 md:col-1">
            <InputNumber placeholder="Cantidad" value={nuevo.cantidad} min={0} onValueChange={(e) => setNuevo({ ...nuevo, cantidad: manejarNumero(e.value) })} />
          </div>

          <div className="field col-12 md:col-2">
            <InputNumber placeholder="Precio" value={nuevo.precio} min={0} onValueChange={(e) => setNuevo({ ...nuevo, precio: manejarNumero(e.value) })} />
          </div>

          <div className="field col-12 md:col-2">
            <Button label="Agregar" icon="pi pi-plus" onClick={agregarProducto} />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card title="Listado de productos">
        <DataTable value={productos} paginator rows={5} stripedRows>
          {"id" in (productos[0] || {}) && <Column field="id" header="ID" />}
          <Column field="codigo_interno" header="Código" />
          <Column field="objeto" header="Objeto" />
          <Column field="descripcion" header="Descripción" />
          <Column field="cantidad" header="Stock" />
          <Column field="precio" header="Precio" body={(p) => `$${p.precio}`} />
          <Column header="Acciones" body={accionesTemplate} />
        </DataTable>
      </Card>

      {/* MODAL EDITAR */}
      {editVisible && (
        <ModalFondo onClick={() => setEditVisible(false)}>
          <ModalCaja>
            <h2>Editar producto</h2>

            <div className="p-fluid grid formgrid" style={{ rowGap: ".5rem" }}>
              <Campo label="Código interno">
                <InputText value={editData.codigo_interno} onChange={(e) => setEditData({ ...editData, codigo_interno: e.target.value })} />
              </Campo>

              <Campo label="Objeto">
                <InputText value={editData.objeto} onChange={(e) => setEditData({ ...editData, objeto: e.target.value })} />
              </Campo>

              <Campo label="Descripción">
                <InputText value={editData.descripcion} onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })} />
              </Campo>

              <Campo label="Cantidad" small col="6">
                <InputNumber value={editData.cantidad} min={0} onValueChange={(e) => setEditData({ ...editData, cantidad: manejarNumero(e.value) })} />
              </Campo>

              <Campo label="Precio" small col="6">
                <InputNumber value={editData.precio} min={0} onValueChange={(e) => setEditData({ ...editData, precio: manejarNumero(e.value) })} />
              </Campo>
            </div>

            <div className="flex-end">
              <Button label="Cancelar" className="p-button-sm p-button-secondary" onClick={() => setEditVisible(false)} />
              <Button label="Guardar" icon="pi pi-check" className="p-button-sm p-button-success" onClick={guardarEdicion} />
            </div>
          </ModalCaja>
        </ModalFondo>
      )}

      {/* MODAL ELIMINAR */}
      {deleteVisible && (
        <ModalFondo onClick={() => setDeleteVisible(false)}>
          <ModalCaja rojo>
            <h2>Dar de baja producto</h2>
            <p>¿Seguro que querés dar de baja <strong>{productoAEliminar?.objeto}</strong>?</p>

            <div className="flex-end">
              <Button label="Cancelar" className="p-button-sm p-button-secondary" onClick={() => setDeleteVisible(false)} disabled={eliminando} />
              <Button label={eliminando ? "Procesando..." : "Sí, dar de baja"} icon="pi pi-trash" className="p-button-sm p-button-danger" onClick={confirmarEliminar} disabled={eliminando} />
            </div>
          </ModalCaja>
        </ModalFondo>
      )}
    </main>
  );
}


function ModalFondo({ children, onClick }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 999,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function ModalCaja({ children, rojo }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: rojo ? "#2a0000" : "#1e1e1e",
        color: "#fff",
        borderRadius: "12px",
        padding: "1rem 1.5rem",
        width: "320px",
        maxWidth: "90vw",
        boxShadow: "0 20px 50px rgba(0,0,0,.9)",
        border: rojo ? "1px solid #622" : "1px solid #444",
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function Campo({ children, label, col = "12", small }) {
  return (
    <div className={`field col-${col}`} style={{ marginBottom: small ? ".3rem" : ".8rem" }}>
      <small>{label}</small>
      {children}
    </div>
  );
}
