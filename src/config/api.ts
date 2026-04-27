export type BackendMode = 'mock' | 'live';

export const API_MODE_STORAGE_KEY = '@cipherchat/backend-mode-v1';
export const API_BASE_URL_STORAGE_KEY = '@cipherchat/api-base-url-v1';
export const API_SESSION_ACCOUNT_ID_KEY = '@cipherchat/session-account-id-v1';
export const API_SESSION_DEVICE_ID_KEY = '@cipherchat/session-device-id-v1';

export const API_SESSION_TOKEN_KEY = 'cipherchat.api.session-token';

export const DEFAULT_BACKEND_MODE: BackendMode = 'mock';
export const DEFAULT_API_BASE_URL = 'http://10.0.2.2:4000';

export const PROTOTYPE_ACCOUNT_DISPLAY_NAME = 'CipherChat Prototype';
