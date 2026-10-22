import { isConnectionError } from '../api/isConnectionError';

export function errorMessage(error: unknown): string {
    if (error instanceof Error && !isConnectionError(error)) {
        return error.message;
    }

    return 'Нет связи с сервером. Проверьте подключение и повторите попытку.';
}
