# React + Vite

## Visualizador publico

La app incluye una vista de solo lectura para compartir el dashboard sin acceso a registro, consolidado, configuracion, edicion de metricas ni exportacion.

Configura estas variables de entorno:

```env
VITE_VISTA_TOKEN=un-token-largo-y-dificil
VITE_VISTA_PROYECTO_ID=id-del-proyecto-opcional
```

Luego comparte:

```text
/visualizador/un-token-largo-y-dificil
```

Tambien sigue funcionando la ruta compatible:

```text
/vista/un-token-largo-y-dificil
```

Si `VITE_VISTA_PROYECTO_ID` queda vacio, el visualizador intenta leer todos los datos visibles para la llave anonima de Supabase. Para actualizacion automatica, activa Realtime en Supabase para las tablas `acciones`, `pauta`, `catalogos` y `conclusiones`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
