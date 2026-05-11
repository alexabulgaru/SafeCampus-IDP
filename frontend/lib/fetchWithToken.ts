import { KeycloakInstance } from 'keycloak-js';

export async function fetchWithToken(keycloak: KeycloakInstance | null, input: RequestInfo, init?: RequestInit) {
    if (!keycloak) {
        throw new Error('No Keycloak instance');
    }

    try {
        await keycloak.updateToken(30);
    } catch (e) {
        console.warn('Keycloak token refresh failed', e);
    }

    const token = keycloak.token;
    const headers = new Headers(init?.headers || {});
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const res = await fetch(input, { ...init, headers });
    return res;
}