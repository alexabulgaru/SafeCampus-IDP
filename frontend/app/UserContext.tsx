"use client";
import React, {
	createContext,
	useState,
	useEffect,
	ReactNode,
	useContext,
} from "react";
import { User } from "./utils/interfaces";
import axios from "axios";
import { KeycloakContext } from "./providers";
import { useRouter } from "next/navigation";

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    lat: string | null;
    setLat: (lat: string | null) => void;
    lng: string | null;
    setLng: (lng: string | null) => void;
}

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
    lat: null,
    setLat: () => {},
    lng: null,
    setLng: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { keycloak } = useContext(KeycloakContext);
    const [user, setUser] = useState<User | null>(null);
    const [lat, setLat] = useState<string | null>(null);
    const [lng, setLng] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!keycloak?.authenticated) {
            setUser(null);
            return;
        }

        const fetchUserData = async () => {
            try {
                await keycloak.updateToken(30);
                const token = keycloak.token;

                if (!token) {
                    setUser(null);
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
                const response = await axios.get<User>(`${apiUrl}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data);
                return response.data;
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUser(null);
                router.push('/');
            }
        };

        const getGeolocation = async (userData: User | undefined) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const latitude = position.coords.latitude.toString();
                        const longitude = position.coords.longitude.toString();
                        
                        setLat(latitude);
                        setLng(longitude);

                        if (userData?.id) {
                            try {
                                await keycloak.updateToken(30);
                                const token = keycloak.token;
                                
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
                                await axios.post(
                                    `${apiUrl}/user/update-location`,
                                    {
                                        userId: userData.id,
                                        lat: latitude,
                                        lng: longitude,
                                    },
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                );
                            } catch (error) {
                                console.error("Error updating location:", error);
                            }
                        }
                    },
                    (error) => {
                        console.error("Geolocation error:", error.message);
                    }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
            }
        };

        const initializeUserAndLocation = async () => {
            const userData = await fetchUserData();
            getGeolocation(userData);
        };

        initializeUserAndLocation();
    }, [keycloak]);

    return (
        <UserContext.Provider value={{ user, setUser, lat, setLat, lng, setLng }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);
