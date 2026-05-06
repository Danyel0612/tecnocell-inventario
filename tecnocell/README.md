# TecnoCell S.A.C. — Sistema de Gestión de Inventario

## Cómo usar

1. Abre el archivo `index.html` en tu navegador (doble clic)
2. Ingresa con las credenciales:
   - **Usuario:** admin
   - **Contraseña:** 1234

## Módulos incluidos

| Módulo        | Descripción                                      |
|---------------|--------------------------------------------------|
| Dashboard     | Estadísticas generales y movimientos recientes   |
| Productos     | CRUD completo con búsqueda y filtros             |
| Entradas      | Registro de ingresos con proveedor y precio      |
| Salidas       | Registro de ventas/reparaciones con validación   |
| Movimientos   | Historial completo con filtros                   |
| Proveedores   | CRUD con RUC, teléfono y correo                  |
| Usuarios      | Gestión de roles: Admin, Almacenero, Vendedor    |
| Alertas       | Notificaciones de stock bajo o agotado           |
| Reportes      | Valor inventario, ventas por marca, exportar CSV |

## Usuarios de demostración

| Usuario   | Contraseña | Rol           |
|-----------|------------|---------------|
| admin     | 1234       | Administrador |
| almacen   | 1234       | Almacenero    |
| vendedor  | 1234       | Vendedor      |

## Notas técnicas

- Sistema 100% en HTML + CSS + JavaScript puro (sin instalación)
- Los datos se guardan automáticamente en el navegador (localStorage)
- Para reiniciar datos: abrir consola del navegador (F12) → escribir `localStorage.clear()` → recargar
- Compatible con Chrome, Firefox, Edge, Safari

## Archivos

```
tecnocell/
├── index.html   ← Página principal (abrir este archivo)
├── styles.css   ← Estilos del sistema
├── app.js       ← Lógica de la aplicación
└── README.md    ← Este archivo
```
