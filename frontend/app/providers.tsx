'use client';
import React, {createContext, useEffect, useState} from 'react';
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  	url: process.env.NEXT_PUBLIC_KEYCLOAK_URL!,
  	realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM!,
  	clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
};

export const KeycloakContext = createContext<any>(null);

export default function Providers({ children }: { children: React.ReactNode }) {
  	const [keycloak, setKeycloak] = useState<any | null>(null);
  	const [initialized, setInitialized] = useState(false);

  	useEffect(() => {
    	const kc = new Keycloak(keycloakConfig);
    	kc.init({ onLoad: 'check-sso', pkceMethod: 'S256' }).then((auth: boolean) => {
      		setKeycloak(kc);
      		setInitialized(true);
    	}).catch((err: any) => {
      		console.error('Keycloak init failed', err);
      		setInitialized(true);
    	});
  	}, []);

  	return (
    	<KeycloakContext.Provider value={{ keycloak, initialized }}>
      		{children}
    	</KeycloakContext.Provider>
  	);
}
