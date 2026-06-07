# SpeedDeal Component - Estructura Refactorizada

Este componente ha sido reorganizado y dividido en múltiples archivos para mejor mantenibilidad y separación de responsabilidades.

## 📁 Estructura de Archivos

```
SpeedDeal/
├── SpeedDial.tsx           # Componente principal y layouts
├── VariantSelector.tsx     # Subcomponente: selector de variantes
├── types.ts               # Definiciones de tipos e interfaces
├── storage.ts             # Lógica de almacenamiento y persistencia
├── constants.ts           # Constantes del componente
├── useSpeedDial.ts        # Hook personalizado
├── logic.ts               # (Existente) Lógica adicional
└── index.ts               # Exportaciones públicas
```

## 📝 Descripción de Archivos

### `types.ts`
Centraliza todas las definiciones de tipos e interfaces:
- `SpeedDialPosition` - Tipo para posición (corner | vertical)
- `SpeedDialMode` - Tipo para modo (onPress | alwaysOpen)
- `MultitaskingPrefs` - Interfaz de preferencias
- `SpeedDialProps` - Props del componente principal
- `VariantSelectorProps` - Props del selector de variantes

### `storage.ts`
Maneja toda la persistencia y sincronización de datos:
- `STORAGE_KEY` - Llave de almacenamiento
- `DEFAULT_PREFS` - Preferencias por defecto
- `parsePrefs()` - Valida y normaliza preferencias
- `loadPrefs()` - Carga preferencias desde localStorage
- `savePrefs()` - Guarda en localStorage y chrome.storage.local

### `VariantSelector.tsx`
Componente modal para seleccionar variantes:
- Muestra 4 combinaciones disponibles
- Indica la variante actualmente seleccionada
- Permite cambiar entre variantes

### `SpeedDial.tsx`
Componente principal refactorizado con:
- **Hooks personalizados**:
  - `useSyncStorage()` - Sincroniza cambios desde otros contextos
  - `useClickOutside()` - Cierra selector al hacer click fuera
- **Componentes de layout** (renderizado condicional):
  - `VerticalAlwaysOpenLayout()` - Vertical con acciones visibles
  - `CornerAlwaysOpenLayout()` - Esquina con acciones visibles
  - `OnPressLayout()` - Modo presionar (corner o vertical)
- **Helpers**:
  - `getContainerPosition()` - Calcula posiciones de acciones

### `constants.ts` (Existente)
Contiene las acciones disponibles e iconos idle.

### `index.ts`
Archivo de exportación central para facilitar imports desde otros componentes:
```typescript
import { SpeedDial, VariantSelector } from '@/components/SpeedDeal';
```

## 🔄 Flujo de Datos

```
localStorage (cache)
        ↓
   SpeedDial.tsx (useState)
        ↓
    [3 Layouts condicionales]
        ↓
   VariantSelector + AccionesUI
        ↓
chrome.storage.local (sincronización)
```

## 🎯 Ventajas de la Refactorización

✅ **Separación de responsabilidades**: Cada archivo tiene un propósito claro
✅ **Reutilizable**: Componentes y hooks pueden usarse en otros lugares
✅ **Mantenible**: Código más legible y fácil de debuggear
✅ **Type-safe**: Tipos centralizados y reutilizados
✅ **Escalable**: Fácil agregar nuevas variantes o funcionalidades

## 📦 Imports

```typescript
// Desde cualquier parte del proyecto
import { SpeedDial, VariantSelector } from '@/components/SpeedDeal';
import type { MultitaskingPrefs, SpeedDialPosition } from '@/components/SpeedDeal';
```

## 🔧 Uso

```tsx
export default function App() {
  const handleAction = (actionId: string) => {
    console.log('Acción ejecutada:', actionId);
  };

  return <SpeedDial onAction={handleAction} />;
}
```

## 📋 Preferencias Disponibles

La estructura soporta estas combinaciones:

| Position | Mode        | Comportamiento |
|----------|-------------|---|
| corner   | onPress     | Botón en esquina, se abre al click |
| corner   | alwaysOpen  | Botón en esquina, acciones siempre visibles |
| vertical | onPress     | Barra lateral, se abre al click |
| vertical | alwaysOpen  | Barra lateral siempre visible |

Las preferencias se sincronizan automáticamente entre pestañas y contextos mediante `chrome.storage.local`.
