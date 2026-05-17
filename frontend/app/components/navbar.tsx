'use client';
import Image from "next/image";
import Logo from "../../public/logo-safecampus.png";
import { useContext, useState, useEffect } from 'react';
import { KeycloakContext } from '../providers';
import { useRouter } from "next/navigation";
import { UserContext } from "../UserContext";
import { BellIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

export default function Navbar() {
	const { keycloak } = useContext(KeycloakContext);
  	const isAuthenticated = !!keycloak?.authenticated;
	const { user } = useContext(UserContext);
	const [unreadCount, setUnreadCount] = useState(0);

	const router = useRouter();

	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		const fetchUnreadCount = async () => {
			try {
				const token = keycloak?.token;
				const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
				const response = await axios.get(
					`${apiUrl}/notifications/unread`,
					{
						headers: {
							'Authorization': `Bearer ${token}`,
						},
					}
				);
				setUnreadCount(response.data.length || 0);
			} catch (error) {
				console.error('Error fetching unread notifications:', error);
			}
		};

		fetchUnreadCount();

		const interval = setInterval(fetchUnreadCount, 10000);
		return () => clearInterval(interval);
	}, [isAuthenticated, keycloak?.token]);

	const handleLogout = async () => {
		if (keycloak?.logout) {
			await keycloak.logout({ redirectUri: window.location.origin });
		}
	};

    return (
        <div className="bg-[#f78fb3] flex flex-row px-12 justify-between items-center">
			<div onClick={() => router.push('/')} className="cursor-pointer">
            	<Image src={Logo} alt="SafeCampus Logo" width={90} height={90} />
			</div>

            <div className="flex flex-row gap-2 items-center">
              	{isAuthenticated ? (
                	<>
						<div className="flex flex-row gap-4">
							<button
                    			className="before:ease relative py-2 px-8 overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                    			onClick={() => router.push('/incidents')}
                  			>
                    			Incidente
                  			</button>

							{user?.role === 'ADMIN' && (
								<>
									<button
                    					className="before:ease relative py-2 px-8 overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                    					onClick={() => router.push('/users')}
                  					>
                    					Utilizatori
                  					</button>

									<button
                    					className="before:ease relative py-2 px-8 overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                    					onClick={() => window.open('http://localhost:9090', '_blank')}
                  					>
                    					Prometheus
                  					</button>

									<button
                    					className="before:ease relative py-2 px-8 overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                    					onClick={() => window.open('http://localhost:3010', '_blank')}
                  					>
                    					Grafana
                  					</button>
								</>
							)}

							<button
                    			className="before:ease relative py-2 px-8 overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                    			onClick={handleLogout}
                  			>
                    			Sign out
                  			</button>

							<button
								onClick={() => router.push('/notifications')}
								title="Notifications"
								className="relative"
							>
								<BellIcon className="w-6 h-6 text-white" />
								{unreadCount > 0 && (
									<div className="absolute -top-0 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
										{unreadCount}
									</div>
								)}
							</button>
						</div>
                	</>
              	) : (
                	<button
                  		className="before:ease relative py-2 px-8 overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                  		onClick={() => keycloak?.login()}
                	>
                  		<span className="relative z-10">Login</span>
                	</button>
              	)}
            </div>
        </div>
    );
};
