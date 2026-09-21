import type { ProntoInstallation } from "../interfaces/pronto-install.interface";
import { ApiClient } from "../http/axios.service";

export class ProntoService {

    private static baseUrl = 'https://app.geopronto.com/api/query';

    public static async getTasks() {
        const token = await this.getToken();
        const graphqlRequestBody = this.getQuery();

        const response = await ApiClient.post<{ data: ProntoInstallation[] }>(this.baseUrl, graphqlRequestBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response;
    }

    private static getRangeHour() {
        const dateFrom = new Date();
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date();
        dateTo.setDate(dateTo.getDate() + 5);
        dateTo.setHours(0, 0, 0, 0);

        return { dateFrom, dateTo };
    }

    private static async getToken(): Promise<string> {

        const result = await chrome.storage.local.get(['geoprontoToken']);
        if (!result.geoprontoToken) {
            throw new Error('No se encontró un token válido de Geopronto. Inicia sesión en Pronto primero.');
        }
        return result.geoprontoToken as string;
    }

public static findInstallationById(id: number) {
    return {
        operationName: "installationTask_GetAssignmentsInfo",
        variables: {
            id
        },
        query: `mutation installationTask_GetAssignmentsInfo($id: Int!) {
            installationTask_GetAssignmentsInfo(id: $id) {
                assignment {
                    accepted
                    acceptedOn
                }
                provider {
                    id
                    name
                    provider {
                        name
                    }
                    lastOnlineAt
                    lastPositionAt
                    lastPosition {
                        coordinates
                    }
                }
            }
        }`
    }
}

    private static getQuery() {
        const { dateFrom, dateTo } = this.getRangeHour();
        return {
            operationName: "findTaskInstallationTask",
            variables: {
                query: {
                    dateTimeFrom: dateFrom.toISOString(),
                    dateTimeTo: dateTo.toISOString(),
                    status: ["provider-confirmation"]
                }
            },
            query: `mutation findTaskInstallationTask($query: taskInstallationTaskQueryInput!) {
        maintenanceManager_FindTasks(query: $query) {
          id
          description
          customerCode
          status { id name { es } color }
          address {
            ubigeo { district province department }
            street
            node { name }
          }
          nodePrefix
          nodeIndex
          visitID
        }
      }`
        };
    }

}