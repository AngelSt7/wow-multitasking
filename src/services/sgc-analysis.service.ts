import { MESES } from "../components/SpeedDeal/constants";
import type { CaseGuarantee, ServiceAnalysis, VisitSGC } from "../interfaces/sgc.inteface";

export class SgcAnalysisService {

    private static parseDate(str: string | null): Date | null {
        if (!str) return null;
        const matchTexto = str.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i);
        if (matchTexto) {
            const mes = MESES[matchTexto[2].toLowerCase()] ?? 0;
            const fecha = new Date(Number(matchTexto[3]), mes, Number(matchTexto[1]));
            const matchHora = str.match(/(\d{2}):(\d{2})/);
            if (matchHora) fecha.setHours(Number(matchHora[1]), Number(matchHora[2]), 0, 0);
            return fecha;
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            return new Date(str.substring(0, 10) + 'T00:00:00');
        }
        return null;
    }

    public static analyzeServiceHistory(
        historial: VisitSGC[],
        idServicio: number,
        codigoServicio: string
    ): ServiceAnalysis {
        const visitasValidas = historial.filter(v => {
            const estado = (v.estado || '').toLowerCase();
            const Technician = (v.asignado_a || '').toLowerCase();
            if (estado === 'anulado') return false;
            if (!v.asignado_a || Technician.includes('sin asignacion')) return false;
            return true;
        });

        if (visitasValidas.length === 0) {
            return { id: idServicio, codigo: codigoServicio, esGarantia: false, caso: 'NO_GARANTIA', diasEntreVisitas: null, dilacion: null, metadata: null };
        }

        const tieneInstalacion = visitasValidas.some(v =>
            v.tipo.toLowerCase().includes('instalación de Service') ||
            v.tipo.toLowerCase().includes('instalacion de Service')
        );
        const tieneOtraVisita = visitasValidas.some(v =>
            !v.tipo.toLowerCase().includes('instalación de Service') &&
            !v.tipo.toLowerCase().includes('instalacion de Service')
        );

        const visitasOrdenadas = [...visitasValidas].sort((a, b) => {
            const fechaA = this.parseDate(a.fecha_solicitud)?.getTime() ?? 0;
            const fechaB = this.parseDate(b.fecha_solicitud)?.getTime() ?? 0;
            return fechaB - fechaA;
        });

        const v1 = visitasOrdenadas[0];
        const v2 = visitasOrdenadas[1] ?? null;

        let dilacionInfo = null;
        const fechaSolicitudV1 = this.parseDate(v1.fecha_solicitud);
        if (fechaSolicitudV1) {
            const diferenciaMilisegundos = Date.now() - fechaSolicitudV1.getTime();
            const horasDesde = diferenciaMilisegundos / 36e5;
            if (horasDesde > 2) {
                const dias = Math.floor(horasDesde / 24);
                const horasRestantes = Math.floor(horasDesde % 24);
                let horasStr = '';
                if (dias >= 1) {
                    horasStr = `${dias}d ${horasRestantes}h`;
                } else {
                    const minutosRestantes = Math.floor((diferenciaMilisegundos % 36e5) / 60000);
                    horasStr = `${Math.floor(horasDesde)}h ${minutosRestantes}m`;
                }
                dilacionInfo = { aplica: true, horasDesdeSolicitud: horasDesde, horasFormateadas: horasStr };
            }
        }

        if (!tieneInstalacion || !tieneOtraVisita) {
            return { id: idServicio, codigo: codigoServicio, esGarantia: false, caso: 'NO_GARANTIA', diasEntreVisitas: null, dilacion: dilacionInfo, metadata: null };
        }

        let dias: number | null = null;
        if (v2 && fechaSolicitudV1) {
            const fechaVisitaAnterior = this.parseDate(v2.fecha_visita || v2.fecha_completado);
            if (fechaVisitaAnterior) {
                const d1 = new Date(fechaSolicitudV1.getTime());
                const d2 = new Date(fechaVisitaAnterior.getTime());
                d1.setHours(0, 0, 0, 0);
                d2.setHours(0, 0, 0, 0);
                dias = Math.round((d1.getTime() - d2.getTime()) / 86400000);
            }
        }

        let caso = this.resolveTittle(dias ?? 0, v1, v2);

        const metadataGarantia = caso !== 'NO_GARANTIA' && v2
            ? {
                tecnicoGarantia: v2.asignado_a.replace(/\s+/g, ' ').trim().toUpperCase(),
                cuadrillaGarantia: (v2.cuadrilla || 'SIN CUADRILLA').trim().toUpperCase()
            }
            : null;

        return { id: idServicio, codigo: codigoServicio, esGarantia: caso !== 'NO_GARANTIA', caso, diasEntreVisitas: dias, dilacion: dilacionInfo, metadata: metadataGarantia };
    }


    private static resolveTittle(dias: number, v1: VisitSGC, v2: VisitSGC | null): CaseGuarantee {
        let test: CaseGuarantee = 'NO_GARANTIA';
        if (dias === null || dias > 30) {
            test = 'NO_GARANTIA';
        } else if (v1.asignado_a.trim().toLowerCase() === v2!.asignado_a.trim().toLowerCase()) {
            test = 'GARANTIA_NO_CAMBIAR';
        } else if ((v1.cuadrilla ?? '').trim().toLowerCase() === (v2!.cuadrilla ?? '').trim().toLowerCase()) {
            test = 'GARANTIA_CAMBIAR';
        } else {
            test = 'GARANTIA_EXTERNA';
        }
        return test;
    }

}