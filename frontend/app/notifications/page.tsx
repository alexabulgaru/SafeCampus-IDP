'use client';
import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { KeycloakContext } from '../providers';
import { Notification } from '../utils/interfaces';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/solid';
import Navbar from '../components/navbar';
import axios from 'axios';

export default function NotificationsPage() {
    const router = useRouter();
    const { keycloak } = useContext(KeycloakContext);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!keycloak?.authenticated) {
            router.push('/');
            return;
        }

        fetchNotifications();
    }, [keycloak?.authenticated]);

    const fetchNotifications = async () => {
        try {
            const token = keycloak?.token;
            const response = await axios.get<Notification[]>(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            alert('Eroare la încărcarea notificărilor');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const token = keycloak?.token;
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === notificationId ? { ...notif, isRead: true } : notif,
                ),
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
            alert('Eroare la marcarea notificării');
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            const token = keycloak?.token;
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/delete`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
            alert('Notificare ștearsă cu succes!');
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Eroare la ștergerea notificării');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = keycloak?.token;
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
            alert('Toate notificările au fost marcate ca citite!');
        } catch (error) {
            console.error('Error marking all as read:', error);
            alert('Eroare la marcarea notificărilor');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8a5c2] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-white">Se încarcă...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8a5c2] flex flex-col">
            <Navbar />
            <div className="flex flex-col w-[80%] mx-auto items-center justify-center mt-10">
                <div className="w-full my-8 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-white text-center py-8">Nu aveți notificări</div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`rounded-lg p-6 shadow-lg border-2 transition-colors ${
                                    notification.isRead
                                        ? 'bg-white border-[#f78fb3]'
                                        : 'bg-[#f78fb3] border-[#f78fb3]'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className='flex-1'>
                                        <div className="flex items-center mb-2">
                                            <h3 className={`font-bold text-lg ${
                                                notification.isRead
                                                    ? 'text-[#f78fb3]'
                                                    : 'text-white'
                                            }`}>
                                                {notification.title}
                                            </h3>
                                        </div>
                                        <p className={`mb-3 ${
                                            notification.isRead
                                                ? 'text-[#f78fb3]'
                                                : 'text-white'
                                        }`}>{notification.message}</p>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm ${
                                                notification.isRead
                                                    ? 'text-gray-600'
                                                    : 'text-white text-opacity-80'
                                            }`}>
                                                {new Date(notification.createdAt).toLocaleString('ro-RO')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`flex gap-2 border-2 rounded-full p-1.5 ${
                                        notification.isRead
                                            ? 'border-[#f78fb3]'
                                            : 'border-white'
                                    }`}>
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="flex-1 text-white hover:text-gray-200 transition"
                                                title="Marcați ca citit"
                                            >
                                                <CheckIcon className="w-4 h-4 mx-auto" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className={`flex-1 transition ${
                                                notification.isRead
                                                    ? 'text-red-600 hover:text-red-800'
                                                    : 'text-white hover:text-gray-200'
                                            }`}
                                            title="Șterge"
                                        >
                                            <TrashIcon className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {notifications.some((n) => !n.isRead) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-[#f78fb3] text-white rounded-lg hover:bg-pink-600 transition-colors mb-8"
                    >
                        Marcați toate ca citite
                    </button>
                )}
            </div>
        </div>
    );
}
