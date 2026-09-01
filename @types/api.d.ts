export type APIError = {
  message: string;
  code?: string | number;
  details?: unknown;
};

export type APISuccessResponse<T> = {
  status: "success";
  data: T;
};

export type APIErrorResponse = {
  status: "error";
  error: APIError;
};

export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse;
