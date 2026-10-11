import { createStorageArea } from './storageArea'

// Punto único de acceso a las Web Storage APIs de la aplicación. Las
// propiedades de `window` se leen en cada operación porque el navegador puede
// lanzar al acceder a ellas.
export const localArea = createStorageArea(() => window.localStorage)
export const sessionArea = createStorageArea(() => window.sessionStorage)
