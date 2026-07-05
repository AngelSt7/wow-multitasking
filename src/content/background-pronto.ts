// C:\Users\Ángel\Desktop\extension\wow-multitasking\src\content\background-pronto.ts
import axios from 'axios';
  
export interface InstallationTask {
  id: number;
  description: string;
  customerCode: string;
  status: {
    id: string;
    name: {
      es: string;
    };
    color: string;
  };
  address: {
    ubigeo: {
      district: string;
      province: string;
      department: string;
    };
    street: string;
    node: {
      name: string;
    } | null;
  };
  nodePrefix: string;
  nodeIndex: string;
  visitID: number;
}

async function manejarPeticionPronto(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(['geoprontoToken']);
    const token = result.geoprontoToken;
    
    if (!token) {
      sendResponse({ success: false, error: 'No se encontró un token válido de Geopronto. Inicia sesión en Pronto primero.' });
      return;
    }

    const dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 5);
    dateTo.setHours(0, 0, 0, 0);

    const graphqlRequestBody = {
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

    const response : { data: InstallationTask[] } = await axios.post('https://app.geopronto.com/api/query', graphqlRequestBody, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });


    // sendResponse({ success: true, data: response.data });
    sendResponse({ success: true, data: response.data });

  } catch (error: any) {
    console.error('[Background-Pronto] Error en Fetch:', error);
    sendResponse({ success: false, error: error.message || 'Error en la petición API del Pronto' });
  }
}

chrome.runtime.onMessage.addListener((message, __ : any, sendResponse) => {
  if (message.action === 'GET_PRONTO_TASKS') {
    manejarPeticionPronto(sendResponse);
    return true; 
  }
});