import {
  type AxiosAdapter,
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

export interface StubAnswer {
  readonly status: number
  readonly data?: unknown
}

/**
 * An axios adapter that answers from a function instead of the network.
 *
 * The built-in adapters reject a non-2xx answer through `validateStatus`; a
 * custom adapter has to do that itself, or every interceptor and status
 * mapping under test would see a resolved promise that production never does.
 */
export const stubAdapter = (respond: (config: InternalAxiosRequestConfig) => StubAnswer) => {
  const calls: InternalAxiosRequestConfig[] = []

  const adapter: AxiosAdapter = async (config) => {
    calls.push(config)
    const { status, data = null } = respond(config)
    const response: AxiosResponse = {
      status,
      statusText: String(status),
      data,
      headers: {},
      config,
    }

    if (config.validateStatus?.(status) ?? true) {
      return response
    }
    throw new AxiosError(
      `Request failed with status code ${status}`,
      undefined,
      config,
      undefined,
      response,
    )
  }

  return { adapter, calls }
}
