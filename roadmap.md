# Roadmap

## Fase 4 — Refinamiento Arquitectónico, Clean Code y Verificación de Calidad

- [x] Auditoría exhaustiva de código: cero variables o funciones de una sola letra, tipado estricto sin `any` y verbos semánticos en inglés.
- [x] Operaciones asíncronas y lecturas de archivos protegidas con bloques `try/catch`.
- [x] Sistema de diseño Planpoint Blueprint confirmado: paleta clara (`#ffffff`, `#f0f2f4`, `#0f68ea`, `#1d1d1f`), `rounded-[28px]` en tarjetas, píldoras `rounded-full` y cero emojis (100% `lucide-react`).
- [x] Protocolo de verificación estricto superado: `typecheck` limpio, ESLint sin advertencias ni errores, suite completa de Vitest en verde (42/42 tests) y compilación de producción exitosa.
- [x] **Plan Maestro de Seguridad, Control de Acceso por Roles (RBAC) y Portal de Proveedores**:
  - [x] Matriz centralizada de permisos (`src/auth/permissions.ts`) para los 8 roles del sistema.
  - [x] Superusuario Administrador (`systemAdmin` - Diego Paredes) con supervisión y auditoría global sobre los 20 módulos internos del ERP.
  - [x] Roles acotados estrictos: `marketing`, `management`, `logistics`, `finance`, `projects`, `postSales`.
  - [x] Redirección canónica inteligente según rol (`navigateToRoleHome` / `getHomeRouteForRole`) desde Login y cambio en tiempo real en Topbar.
  - [x] Aislamiento estricto de Proveedor Externo fuera del layout interno `/_erp/*` hacia su portal público seguro `/portal-proveedor/:token`.
  - [x] Portal interactivo del Proveedor Externo: cotización económica completa (precio, plazo de ejecución, vigencia de oferta, condiciones comerciales y propuesta PDF), con reflejo instantáneo en el Cuadro Comparativo de Logística (`P-08`).
  - [x] Guardia de rutas `ProtectedRoute.tsx` y filtrado dinámico del menú lateral `ModernSidebar.tsx`.
  - [x] Suite de pruebas unitarias y de aceptación RBAC (`src/test/rbac.test.ts`, 13 tests específicos).

## Fase 3 — Oracle, posventa y gestión

- [x] Modelo simulado de ventas, expedientes únicos y campañas por proyecto, con pruebas.
- [x] Oracle y ficha de comprador con cuenta, fecha de entrega y acta adjunta.
- [x] Campañas WhatsApp/correo, programación y seguimiento con corrección de contactos y reintentos.
- [x] Informes con filtros, matriz ilustrativa de 8 roles y asistente gerencial ilustrativo.
- [x] Verificación integral y diseño Planpoint en escritorio y móvil.

## Diseño Planpoint de Fase 2

- [x] Unificar colores, acciones principales, formularios y estados según DESIGN-2.md, sin cambiar reglas de negocio.
- [x] Verificar módulos en escritorio y móvil.

## Fase 2 — Ciclo transaccional y documental

- [x] Modelo de datos y reglas Fase 2 (requerimientos, invitaciones, OC, facturas, contratos) + pruebas.
- [x] P-04 Requerimientos: formulario con alerta de sobregiro y listado con historial.
- [x] P-05 Aprobaciones: aprobar/devolver con observación y línea de tiempo auditable (RF-15).
- [x] P-06/08/09 Logística: bandeja, enlace de invitación, cuadro comparativo y emisión de OC (sube Comprometido).
- [x] P-07 Portal público del proveedor en /portal-proveedor/:token (sin sidebar).
- [x] P-10/11 Comprobantes: simulador OCR con revisión humana, Comprometido→Ejecutado y exportación Contasis CSV (RF-31).
- [x] P-12 Contratos de obra tercerizada: hitos y valorizaciones con afectación presupuestaria.
- [x] Verificación extremo a extremo en navegador y pruebas en verde.
