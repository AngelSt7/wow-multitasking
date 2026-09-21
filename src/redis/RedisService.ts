export class RedisService {
  private static URL = "https://sterling-starfish-172691.upstash.io";
  private static TOKEN = "gQAAAAAAAqKTAAIgcDFiY2NmNjkwNzg2OTA0ZmE3YjkzNjk2YTM5YTI1NmRiNg";
  /**
   * Envía comandos generales mediante POST a Upstash (Pipeline / Batching ready)
   */
  private static async command(body: any[]) {
    try {
      const response = await fetch(this.URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.result;
    } catch (error) {
      console.error("❌ [RedisService Error]:", error);
      return null;
    }
  }

  /**
   * Guarda una orden con un TTL (Tiempo de Vida) específico en segundos (43200s = 12 horas)
   */
  public static async setOrder(idOrden: string, datos: any, ttlSeconds: number = 43200) {
    const key = `wow:orden:${idOrden}`;
    // Usamos SET key value EX seconds
    return await this.command(["SET", key, JSON.stringify(datos), "EX", ttlSeconds]);
  }

  public static async shareSession(sessionId: string, data: any){
    const key = `wow:session:${sessionId}`;
    return await this.command(["SET", key, JSON.stringify(data), "EX", 300]);
  }

  public static async getSession(sessionId: string){
    const key = `wow:session:${sessionId}`;
    const result = await this.command(["GET", key]);
    return result ? JSON.parse(result) : null;
  }

    public static async deleteSession(sessionId: string) {
    return await this.command(["DEL", `wow:session:${sessionId}`]);
  }

  /**
   * Consulta un lote (array) de códigos de orden en una sola petición (MGET)
   */
  public static async getOrdersBatch(listaIds: string[]): Promise<any[]> {
    if (!listaIds || listaIds.length === 0) return [];
    const keys = listaIds.map(id => `wow:orden:${id}`);
    const result = await this.command(["MGET", ...keys]);
    
    // El resultado viene como un array de strings JSON o nulls. Los parseamos.
    return (result || []).map((item: string | null) => item ? JSON.parse(item) : null);
  }

  /**
   * Elimina una orden de Redis inmediatamente si fue completada
   */
  public static async deleteOrder(idOrden: string) {
    return await this.command(["DEL", `wow:orden:${idOrden}`]);
  }
}