export class ApiResponseDto<T> {
  statusCode: number;
  timestamp: string;
  message?: string;
  data: T | null;
  path?: string;

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null,
    path?: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
