// Copia este objeto completo dentro de tu sgc-injector o tu index para interceptar y forzar pruebas locales
export const mockResponseFromPronto = {
  data: { // Axios wrapper
    data: { // GraphQL wrapper
      maintenanceManager_FindTasks: [
        // ─── MOQUEGUA ────────────────────────────────────────────────────────
        {
          id: 859001,
          description: "Inst. INTERNET FIBRA OPTICA WOW 202611001",
          customerCode: "20261100199",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "MOQUEGUA", province: "ILO", district: "ILO" },
            street: "Av. Mariano Lino Urquieta Nro. 420",
            node: { name: "ILO-CENTRO" }
          },
          nodePrefix: "ILO1",
          nodeIndex: "01",
          visitID: 2340001
        },
        {
          id: 859002,
          description: "Inst. SOPORTE TRIPLE PLAY 202611002",
          customerCode: "20261100288",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "MOQUEGUA", province: "ILO", district: "PACOCHA" },
            street: "Urb. Ciudad Nueva Mz. G Lote 12",
            node: { name: "ILO-PACOCHA" }
          },
          nodePrefix: "ILOP",
          nodeIndex: "02",
          visitID: 2340002
        },
        {
          id: 859003,
          description: "Inst. ALTA NUEVA HOGAR 202611003",
          customerCode: "20261100377",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "MOQUEGUA", province: "MARISCAL NIETO", district: "MOQUEGUA" },
            street: "Calle Ayacucho Nro. 150",
            node: { name: "MOQ-CENTRO" }
          },
          nodePrefix: "MOQ1",
          nodeIndex: "05",
          visitID: 2340003
        },

        // ─── TACNA ───────────────────────────────────────────────────────────
        {
          id: 859004,
          description: "Inst. DANIEL ARCE WOW 202612004",
          customerCode: "20261200466",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "TACNA", province: "TACNA", district: "CORONEL GREGORIO ALBARRACIN" },
            street: "Av. Municipal Asoc. Vista Alegre Mz. 4 Lote 9",
            node: { name: "TAC-ALBARRACIN" }
          },
          nodePrefix: "TACG",
          nodeIndex: "12",
          visitID: 2340004
        },
        {
          id: 859005,
          description: "Inst. REINSTALACION DE SERVICIO 202612005",
          customerCode: "20261200555",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "TACNA", province: "TACNA", district: "TACNA" },
            street: "Calle San Camilo Nro. 215",
            node: { name: "TAC-CENTRO" }
          },
          nodePrefix: "TAC1",
          nodeIndex: "01",
          visitID: 2340005
        },
        {
          id: 859006,
          description: "Inst. EMPRESARIAL DEDICADO 202612006",
          customerCode: "20261200644",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "TACNA", province: "TACNA", district: "POCOLLAY" },
            street: "Jr. Hermanos Reynoso Nro. 310",
            node: { name: "TAC-POCOLLAY" }
          },
          nodePrefix: "TACP",
          nodeIndex: "03",
          visitID: 2340006
        },

        // ─── PUNO ────────────────────────────────────────────────────────────
        {
          id: 859007,
          description: "Inst. WOW INTEGRAL HOGAR 202613007",
          customerCode: "20261300733",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "PUNO", province: "SAN ROMAN", district: "JULIACA" },
            street: "Jr. Mariano Nuñez Nro. 745",
            node: { name: "JUL-CENTRO" }
          },
          nodePrefix: "JUL1",
          nodeIndex: "22",
          visitID: 2340007
        },
        {
          id: 859008,
          description: "Inst. TRASLADO INTERNO 202613008",
          customerCode: "20261300822",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "PUNO", province: "PUNO", district: "PUNO" },
            street: "Av. La Torre Nro. 1105",
            node: { name: "PUN-CENTRO" }
          },
          nodePrefix: "PUN1",
          nodeIndex: "04",
          visitID: 2340008
        },
        {
          id: 859009,
          description: "Inst. ALTA NUEVA MONO PLAY 202613009",
          customerCode: "20261300911",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "PUNO", province: "SAN ROMAN", district: "JULIACA" },
            street: "Av. Circunvalación Nro. 1420",
            node: { name: "JUL-NORTE" }
          },
          nodePrefix: "JULN",
          nodeIndex: "15",
          visitID: 2340009
        },

        // ─── CUSCO ───────────────────────────────────────────────────────────
        {
          id: 859010,
          description: "Inst. EDGAR CONDO 202614010",
          customerCode: "20261401000",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "CUSCO", province: "CUSCO", district: "WANCHAQ" },
            street: "Av. De la Cultura Nro. 804",
            node: { name: "CUS-WANCHAQ" }
          },
          nodePrefix: "CUSW",
          nodeIndex: "08",
          visitID: 2340010
        },
        {
          id: 859011,
          description: "Inst. MUDANZA EXTERNA 202614011",
          customerCode: "20261401111",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "CUSCO", province: "CUSCO", district: "SANTIAGO" },
            street: "Jr. Antonio Lorena Nro. 512",
            node: { name: "CUS-SANTIAGO" }
          },
          nodePrefix: "CUSS",
          nodeIndex: "02",
          visitID: 2340011
        },
        {
          id: 859012,
          description: "Inst. WOW DUO HOGAR 202614012",
          customerCode: "20261401222",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "CUSCO", province: "CUSCO", district: "SAN SEBASTIAN" },
            street: "Urb. Santa Rosa Mz. B Lote 4",
            node: { name: "CUS-SEBASTIAN" }
          },
          nodePrefix: "CUSB",
          nodeIndex: "11",
          visitID: 2340012
        },

        // ─── AREQUIPA ────────────────────────────────────────────────────────
        {
          id: 859013,
          description: "Inst. LUCIA PORTUGAL 202615013",
          customerCode: "20261501333",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "AREQUIPA", province: "AREQUIPA", district: "CERRO COLORADO" },
            street: "Av. Aviación Km 6.5 Urb. Las Mercedes",
            node: { name: "AQP-CERRO" }
          },
          nodePrefix: "AQPC",
          nodeIndex: "41",
          visitID: 2340013
        },
        {
          id: 859014,
          description: "Inst. TRASLADO DISTRITAL WOW 202615014",
          customerCode: "20261501444",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "AREQUIPA", province: "AREQUIPA", district: "YANAHUARA" },
            street: "Calle Lima Nro. 302",
            node: { name: "AQP-YANAHUARA" }
          },
          nodePrefix: "AQPY",
          nodeIndex: "02",
          visitID: 2340014
        },
        {
          id: 859015,
          description: "Inst. FIBRA PURA DEDICADA 202615015",
          customerCode: "20261501555",
          status: { id: "provider-confirmation", name: { es: "Esperar Confirmación" }, color: "#52d887" },
          address: {
            ubigeo: { department: "AREQUIPA", province: "AREQUIPA", district: "JOSE LUIS BUSTAMANTE Y R." },
            street: "Av. Dolores Nro. 104",
            node: { name: "AQP-BUSTAMANTE" }
          },
          nodePrefix: "AQPB",
          nodeIndex: "09",
          visitID: 2340015
        }
      ]
    }
  }
};