import { AxiosError } from "axios";

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | { message?: string }
      | undefined;

    return responseData?.message ?? "请求失败，请稍后重试";
  }

  return "请求失败，请稍后重试";
}
