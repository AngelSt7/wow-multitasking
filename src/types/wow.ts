interface ServicioResumen {
  id: number;        
  codigo: string;
  distrito: string;
  estado: string;
}

export interface TecnicoResumen {
  nombre: string;
  cuadrilla: string;
  zonasBase: string[];
  servicios: ServicioResumen[];
}