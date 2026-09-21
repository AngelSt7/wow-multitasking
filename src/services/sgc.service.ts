import { ApiClient, type ApiResult } from "../http/axios.service";

export interface SgcServiceResponse {
    code: string;
    cliente: {
        nombre: string;
        departamento: string;
        provincia: string;
        distrito: string;
    }
}

export class SgcService {

    private static readonly BASE_URL = 'https://api.wowperu.pe/api/v2/csg/detalle-servicio';

    private static async getInfo(id: string | number): Promise<ApiResult<SgcServiceResponse>> {
        const token = localStorage.getItem('token');
        const url = `${this.BASE_URL}/${id}/informacion-cliente`;

        const prueba = await ApiClient.get<any>(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return prueba;
    }

    public static async buildMessage(id: string | number, typeJob: string) {
        console.log(`Obteniendo información para ID: ${id} y tipo de trabajo: ${typeJob}`);
        const info = await this.getInfo(id)
        const clear = this.clearData(info);
        return this.getMessage(typeJob, clear);
    }

    private static clearData(data: ApiResult<SgcServiceResponse>): SgcServiceResponse | null {

        if (!data.success || !data.data) {
            return null;
        }

        return {
            code: data.data.code,
            cliente: {
                nombre: data.data.cliente.nombre,
                departamento: data.data.cliente.departamento,
                provincia: data.data.cliente.provincia,
                distrito: data.data.cliente.distrito
            }
        };

    }

    private static getMessage(typeJob: string, data: SgcServiceResponse | null): string {
        const hours = new Date().getHours();
        const saludo = hours < 12 ? 'Buenos días' : hours < 18 ? 'Buenas tardes' : 'Buenas noches';

        const nombre = data?.cliente?.nombre?.trim() || '';
        const ubicacion = `${data?.cliente?.departamento || ''} - ${data?.cliente?.provincia || ''} - ${data?.cliente?.distrito || ''}`;
        const codigo = data?.code || '';

        return `👋 ${saludo}, le hablamos del área de programaciones de *WOW*, sobre su servicio de *${typeJob}* a nombre de *${nombre}*, ubicado en *${ubicacion}* con código de servicio *${codigo}*. `;
    }

}