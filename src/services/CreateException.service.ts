import axios from "axios";

export class CreateException {

    static async create(dates: string[], id: number) {
        const token = localStorage.getItem("token");

        const url = `https://api.wowperu.pe/api/v2/instalaciones/configuracion-instalador/${id}/exception`;

        const chunkSize = 15;

        for (let i = 0; i < dates.length; i += chunkSize) {

            const chunk = dates.slice(i, i + chunkSize);

            const promises = chunk.map((date) =>
                axios.post(
                    url,
                    {
                        date_start: `${date}T05:00:00.000Z`,
                        state: 13004,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
            );

            const results = await Promise.allSettled(promises);

            const success = results.filter(
                (r) => r.status === "fulfilled"
            ).length;

            const failed = results.filter(
                (r) => r.status === "rejected"
            ).length;

            console.log(
                `Lote ${i / chunkSize + 1}: ${success} exitosas, ${failed} fallidas`
            );
        }
    }

}