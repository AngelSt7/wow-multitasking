export interface TechnicalVisit {
  id: number;
  codigo: string;
  lista: VisitSGC[];
}
export interface VisitSGC {
  visita_tecnica_id: number;
  visita_tecnica_type_id: number;
  estado_id: number;
  tipo: string;
  fecha_solicitud: string;
  asignado_a: string;
  cuadrilla: string;
  fecha_visita: string;
  horario: string;
  observacion_visita_tecnica: string;
  motivo_de_cierre: string | null;
  estado: string;
  fecha_completado: string | null;
  fecha_validado: string | null;
}
export type CaseGuarantee = 'NO_GARANTIA' | 'GARANTIA_NO_CAMBIAR' | 'GARANTIA_CAMBIAR' | 'GARANTIA_EXTERNA';

export interface ServiceAnalysis {
  id: number;
  codigo: string;
  esGarantia: boolean;
  caso: CaseGuarantee;
  diasEntreVisitas: number | null;
  dilacion: {
    aplica: boolean;
    horasDesdeSolicitud: number;
    horasFormateadas: string;
  } | null;
  metadata: {
    tecnicoGarantia: string;
    cuadrillaGarantia: string;
  } | null;
}

export interface Service {
  id: number;
  codigo: string;
  distrito: string;
  location: string;
  assignationDate: string;
  type: string;
  idTypeService: number;
  idState: number;
  estado: 'Pendiente' | 'En proceso' | 'Completado' | 'Validado' | 'Rechazado';
}
export interface Technician {
  nombre: string;
  cuadrilla: string;
  zonasBase: string[];
  servicios: Service[];
}
