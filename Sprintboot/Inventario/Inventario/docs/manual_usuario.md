# Manual de Usuario — TecnoCell Sistema de Inventario
**Versión:** 1.0.0 | **Para:** Administradores, Vendedores y Almaceneros

---

## 1. Acceso al Sistema

### 1.1 Iniciar Sesión
1. Abre tu navegador web (Chrome, Firefox o Edge) y navega a: **http://localhost:8080**
2. Verás la pantalla de inicio de sesión de TecnoCell.
3. Ingresa tu **Usuario** y **Contraseña** asignados por el administrador.
4. Haz clic en el botón **"Iniciar Sesión"**.

> **Nota:** Si las credenciales son incorrectas, el sistema mostrará un mensaje de error. El sistema rechazará automáticamente todos los intentos sin credenciales válidas.

### 1.2 Roles del Sistema
El sistema tiene 3 niveles de acceso:

| Rol | Módulos Disponibles |
|---|---|
| **Administrador** | Todos los módulos: Dashboard, Productos, Entradas, Salidas, Movimientos, Clientes, Proveedores, **Usuarios**, Alertas, Reportes |
| **Almacenero** | Dashboard, Productos, Entradas, Salidas, Movimientos, Alertas |
| **Vendedor** | Dashboard, Productos, Salidas, Movimientos, Clientes, Alertas |

### 1.3 Cerrar Sesión
Haz clic en el ícono de usuario en la barra superior y selecciona **"Cerrar Sesión"**. Tu sesión quedará invalidada de forma segura.

---

## 2. Dashboard (Panel Principal)

Al iniciar sesión, verás el Panel Principal con un resumen del negocio:

- **Total de Productos** activos en el inventario.
- **Productos con Stock Bajo** (en alerta).
- **Valor Total del Inventario** en soles (S/).
- **Movimientos del Día** (entradas y salidas de hoy).
- **Últimos Movimientos** (tabla con los 8 más recientes).
- **Alertas de Stock** (productos que necesitan reposición urgente).

---

## 3. Módulo de Productos

### 3.1 Ver la Lista de Productos
En el menú izquierdo, haz clic en **"Productos"**. Verás una tabla con todos los productos activos, su código, stock, precios y estado.

### 3.2 Buscar y Filtrar Productos
- Usa la barra de búsqueda para buscar por nombre, código o marca.
- Usa el filtro de **Categoría** para ver solo celulares, accesorios, etc.

### 3.3 Crear un Nuevo Producto
1. Haz clic en el botón **"+ Nuevo Producto"**.
2. Completa los campos del formulario:
   - **Código (*)** — Único para cada producto (ej: `CEL-001`).
   - **Nombre (*)** — Nombre descriptivo del producto.
   - **Categoría** — Selecciona de la lista (Celulares, Accesorios, etc.).
   - **Marca** — Fabricante del producto.
   - **Stock Inicial** — Cantidad inicial en almacén.
   - **Stock Mínimo** — Nivel que dispara una alerta (ej: 5 unidades).
   - **Precio Costo** — Precio de compra al proveedor.
   - **Precio Venta** — Precio de venta al cliente.
3. Haz clic en **"Guardar Producto"**.

### 3.4 Editar un Producto
Haz clic en el botón **"✎ Editar"** en la fila del producto. Modifica los campos necesarios y guarda.

> **Importante:** El código del producto no se puede cambiar una vez creado.

### 3.5 Eliminar un Producto
Haz clic en el ícono de eliminar (🗑). El producto se desactivará del inventario (borrado lógico; los movimientos históricos se conservan).

---

## 4. Módulo de Entradas de Stock

Las entradas registran el ingreso de mercadería al almacén (compras a proveedores).

### 4.1 Registrar una Entrada
1. Ve al menú **"Entradas"** y haz clic en **"+ Registrar Entrada"**.
2. Completa el formulario:
   - **Producto (*)** — Selecciona el producto que ingresa.
   - **Proveedor (*)** — Selecciona el proveedor que lo suministró.
   - **Cantidad (*)** — Número de unidades que ingresan.
   - **Precio Costo** — Precio unitario de compra.
   - **Fecha** — Se rellena automáticamente con la fecha de hoy.
   - **Observación** — Número de factura u otro dato relevante.
3. Haz clic en **"Registrar Entrada"**.

> El stock del producto se actualizará automáticamente al guardar.

---

## 5. Módulo de Salidas de Stock

Las salidas registran la venta o retiro de productos del almacén.

### 5.1 Registrar una Salida/Venta
1. Ve al menú **"Salidas"** y haz clic en **"+ Registrar Salida"**.
2. Completa el formulario:
   - **Producto (*)** — Selecciona el producto vendido. Verás el stock disponible automáticamente.
   - **Cantidad (*)** — Unidades vendidas (el sistema valida que no supere el stock disponible).
   - **Cliente** — Opcional. Si es público general, déjalo en blanco.
   - **Motivo (*)** — Venta, Reparación, Garantía, etc.
   - **Precio Venta** — Precio unitario de venta. Se rellena automáticamente con el precio del producto.
   - **Observación** — Nota adicional.
3. Haz clic en **"Registrar Salida"**.

> Si la cantidad supera el stock, el sistema mostrará un error y no permitirá la operación.

---

## 6. Módulo de Movimientos

Muestra el historial completo de todas las entradas y salidas del sistema.

- Puedes filtrar por **tipo** (Entrada / Salida).
- Puedes buscar por nombre de producto, código o usuario.
- Los registros están ordenados del más reciente al más antiguo.

---

## 7. Módulo de Clientes

### 7.1 Ver y Buscar Clientes
Muestra todos los clientes registrados. Puedes buscar por nombre, DNI/RUC o email.

### 7.2 Crear un Nuevo Cliente
1. Haz clic en **"+ Nuevo Cliente"**.
2. Ingresa el **DNI** (8 dígitos) o **RUC** (11 dígitos) y haz clic en **"Buscar"**.
   - Si hay conexión con la API de RENIEC/SUNAT, el nombre y dirección se llenarán automáticamente.
3. Completa el teléfono y correo si lo deseas.
4. Haz clic en **"Guardar Cliente"**.

---

## 8. Módulo de Proveedores

### 8.1 Crear un Proveedor
1. Haz clic en **"+ Nuevo Proveedor"**.
2. Completa el **RUC** (11 dígitos obligatorio) y la **Razón Social**.
3. Agrega contacto, teléfono, email y dirección.
4. Guarda.

---

## 9. Módulo de Usuarios *(Solo Administradores)*

### 9.1 Crear un Usuario
1. Haz clic en **"+ Nuevo Usuario"**.
2. Asigna un **nombre de usuario** único (sin espacios).
3. Escribe el **nombre completo**, **correo**, **rol** y **contraseña** (mínimo 4 caracteres).
4. Guarda.

### 9.2 Editar / Deshabilitar un Usuario
- **Editar:** Haz clic en "✎ Editar" y modifica los datos. Para cambiar la contraseña, completa los campos de contraseña (si los dejas vacíos, se mantiene la actual).
- **Deshabilitar:** Haz clic en "Deshab." El usuario no podrá iniciar sesión pero sus registros se conservan.

> No es posible eliminar ni deshabilitar al usuario **admin**.

---

## 10. Módulo de Alertas

Muestra automáticamente todos los productos cuyo stock es igual o menor al **Stock Mínimo** configurado. Desde aquí puedes hacer clic en **"Reponer"** para abrir directamente el formulario de Entrada de Stock con ese producto preseleccionado.

---

## 11. Módulo de Reportes

Genera un resumen del estado del negocio:

- **Valor Total del Inventario** — Suma del valor de todos los productos.
- **Ventas del Mes** — Total facturado en el mes actual.
- **Entradas y Salidas del Mes** — Cantidad de unidades movidas.
- **Por Categoría** — Desglose del inventario por tipo de producto.
- **Por Marca (Ventas)** — Ranking de marcas más vendidas.
- **Inventario Completo** — Tabla detallada de todos los productos.

### 11.1 Exportar e Imprimir
- **Exportar CSV:** Descarga el inventario completo en formato Excel/CSV.
- **Imprimir Reporte:** Abre el diálogo de impresión del navegador.

---

## 12. Mi Perfil

Haz clic en tu nombre en la barra superior (esquina derecha) para acceder a tu perfil. Puedes:
- **Actualizar tus datos:** Nombre, correo, DNI y teléfono.
- **Cambiar tu contraseña:** Ingresa la contraseña actual y la nueva (mínimo 4 caracteres). El indicador de seguridad te muestra qué tan fuerte es tu nueva contraseña.

---

## 13. Preguntas Frecuentes

**¿Qué pasa si registro una salida con más unidades de las disponibles?**
El sistema lo detecta automáticamente y muestra un error: "Stock insuficiente". No se guarda ningún movimiento.

**¿Se pueden recuperar productos eliminados?**
El sistema usa borrado lógico: el producto se desactiva pero sus datos permanecen en la base de datos. Contacta al administrador del sistema para reactivarlo.

**¿Qué pasa si se va la conexión durante una operación?**
El sistema mostrará un mensaje de error. Verifica tu conexión y vuelve a intentarlo. No se guardarán datos parciales.

**¿Con qué frecuencia se hacen copias de seguridad?**
La base de datos está alojada en Supabase (nube), que realiza copias de seguridad automáticas diarias.
