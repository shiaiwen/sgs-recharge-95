import {
  create,
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults
} from 'axios'
import Taro from '@tarojs/taro'

class Request {
  private http: AxiosInstance

  constructor(config?: CreateAxiosDefaults) {
    this.http = create({
      timeout: 15000,
      ...config
    })

    if (process.env.TARO_ENV !== 'h5') {
      this.http.defaults.adapter = async (adapterConfig) => {
        const method = (adapterConfig.method || 'get').toUpperCase()
        const { data, statusCode, header } = await Taro.request({
          url: this.http.getUri(adapterConfig),
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
          data: method === 'GET' ? adapterConfig.params : adapterConfig.data,
          header: adapterConfig.headers as Record<string, string>,
          timeout: adapterConfig.timeout
        })

        return {
          data,
          status: statusCode,
          statusText: String(statusCode),
          headers: header,
          config: adapterConfig
        }
      }
    }
  }

  get<T>(url: string, params?: unknown, config?: AxiosRequestConfig) {
    return this.http.get<T>(url, { ...config, params }).then((res) => res.data)
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.http.post<T>(url, data, config).then((res) => res.data)
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.http.put<T>(url, data, config).then((res) => res.data)
  }

  delete<T>(url: string, params?: unknown, config?: AxiosRequestConfig) {
    return this.http.delete<T>(url, { ...config, params }).then((res) => res.data)
  }
}

const request = new Request()

export default request
