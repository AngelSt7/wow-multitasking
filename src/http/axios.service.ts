import axios, { type AxiosRequestConfig } from 'axios';

export type ApiResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export class ApiClient {
  private static instance = axios.create();

  static configure(config: AxiosRequestConfig) {
    ApiClient.instance = axios.create(config);
  }

  private static async request<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
    try {
      const response = await ApiClient.instance.request<T>(config);
      return { success: true, data: response.data, error: null };
    } catch (err) {
      let message = 'Error desconocido';

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      return { success: false, data: null, error: message };
    }
  }

  static get<T>(url: string, config?: AxiosRequestConfig) {
    return ApiClient.request<T>({ ...config, method: 'GET', url });
  }

  static post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return ApiClient.request<T>({ ...config, method: 'POST', url, data });
  }

  static put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return ApiClient.request<T>({ ...config, method: 'PUT', url, data });
  }

  static patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return ApiClient.request<T>({ ...config, method: 'PATCH', url, data });
  }

  static delete<T>(url: string, config?: AxiosRequestConfig) {
    return ApiClient.request<T>({ ...config, method: 'DELETE', url });
  }
}