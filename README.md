# 📸 Portal de Reservas - Rocío Giavarini Fotografía

Bienvenido al sistema de gestión de reservas y finanzas de **Rocío Giavarini Fotografía**. Este portal centraliza todo el flujo de trabajo, desde la selección del pack por parte del cliente hasta el seguimiento detallado de ganancias para la administración.

## ✨ Características Principales

### 🛋️ Para el Cliente
*   **Reserva Multi-paso**: Un flujo intuitivo para seleccionar categoría, pack, fondos y fecha.
*   **Pagos en 2 Cuotas**: Los precios se muestran automáticamente divididos en seña (para reservar) y saldo (día de la sesión).
*   **Selección de Fondos**: Interfaz visual para elegir los fondos de la sesión según temáticas ("Bosque", "Personajes", "Classic", etc.).
*   **Confirmación via WhatsApp**: Generación automática de mensaje detallado con los datos de la reserva y el monto de la seña.
*   **Datos de Pago**: Información clara de Alias bancario (CBU) integrada al final de la reserva.

### 📊 Para el Administrador
*   **Panel de Control Protegido**: Acceso seguro mediante contraseña.
*   **Gestión de Packs Dinámica**: Permite editar precios y desglosar costos (impresiones, fotolibros, imanes, etc.) en tiempo real.
*   **Cálculo de Ganancia Neta**: Herramienta de rentabilidad que resta los costos operativos del precio de venta para mostrar la ganancia real por sesión.
*   **Analíticas Visuales**: Gráficos de barras que muestran ingresos por tipo de sesión, packs más populares y volumen mensual.
*   **Catálogo de Fondos**: Subida y gestión de ambientaciones con optimización automática de calidad para carga rápida.

## 🛠️ Tecnologías Utilizadas
*   **Frontend**: React + TypeScript + Vite.
*   **Estilos**: Vanilla CSS con variables de diseño personalizadas.
*   **Base de Datos**: Supabase (PostgreSQL) con Row Level Security.
*   **Iconografía**: Lucide React.

## ⚙️ Configuración y Despliegue

### Requisitos Previos
*   Nodo.js instalado.
*   Cuenta en Supabase.

### Variables de Entorno (.env)
Crea un archivo `.env` en la raíz con las siguientes variables:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_ADMIN_PASSWORD=contraseña_para_entrar_al_admin
```

### Ejecución Local
1. `npm install`
2. `npm run dev`

---
*Desarrollado con ❤️ para Rocío Giavarini Fotografía.*
