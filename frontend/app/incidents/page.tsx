'use client';
import { useState, useEffect, useContext } from 'react';
import Navbar from "../components/navbar";
import IncidentModal from "../components/incident-modal";
import UpdateModal from "../components/update-modal";
import { UserContext } from '../UserContext';
import { Incident } from "../utils/interfaces";
import { KeycloakContext } from "../providers";
import axios from 'axios';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function Incidents() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const { keycloak } = useContext(KeycloakContext);
    const { user } = useContext(UserContext);

    const fetchIncidents = async () => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const response = await axios.get(
                `${apiUrl}/incidents`,
                {
                    headers: {
                        'Authorization': `Bearer ${keycloak?.token}`,
                    },
                }
            );
            setIncidents(response.data);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserRole = () => {
        if (user?.role) {
            setUserRole(user.role);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [keycloak?.token]);

    useEffect(() => {
        getUserRole();
    }, [user]);

    const handleUpdateStatus = async () => {
        if (!selectedIncident) {
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await axios.patch(
                `${apiUrl}/incidents/update-status`,
                {
                    incidentId: selectedIncident.id,
                    status: selectedIncident.status,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${keycloak?.token}`,
                    },
                }
            );
            setIsStatusModalOpen(false);
            setSelectedIncident(null);
            refreshIncidents();
        } catch (error) {
            console.error('Error updating incident status:', error);
            alert('Eroare la actualizarea statusului incidentului');
        }
    };

    const handleDeleteIncident = async (incidentId: string) => {
        if (!confirm('Esti sigur ca vrei sa stergi acest incident?')) {
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await axios.delete(
                `${apiUrl}/incidents/delete`,
                {
                    headers: {
                        'Authorization': `Bearer ${keycloak?.token}`,
                    },
                    data: { incidentId },
                }
            );
            refreshIncidents();
        } catch (error) {
            console.error('Error deleting incident:', error);
            alert('Eroare la stergerea incidentului');
        }
    };

    const refreshIncidents = () => {
        fetchIncidents();
    };

    return (
        <div className="min-h-screen bg-[#f8a5c2] flex flex-col">
            <Navbar />
            <div className="flex flex-col w-[80%] mx-auto items-center justify-center mt-10">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="before:ease relative py-4 px-8 font-bold text-3xl overflow-hidden border text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-[#ffffff] hover:before:-translate-x-40"
                >
                    Raportează un incident
                </button>

                <div className="w-full my-8 space-y-4">
                    {loading ? (
                        <div className="text-white text-center py-8">Se încarcă...</div>
                    ) : incidents.length === 0 ? (
                        <div className="text-white text-center py-8">Nu sunt incidente</div>
                    ) : (
                        incidents.map((incident) => (
                            <div key={incident.id} className="bg-white rounded-lg p-6 shadow-lg">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <h3 className="font-bold text-lg text-[#f78fb3]">{incident.title}</h3>
                                        </div>
                                        <p className="text-[#f78fb3] mb-3">{incident.description}</p>
                                        <p className="text-sm text-gray-600">
                                            Raportat de: {incident.reportedBy?.email}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 w-32">
                                        <span className="w-full text-center px-3 py-1 rounded-full text-white font-semibold text-sm bg-[#f78fb3]">
                                            {incident.type}
                                        </span>
                                        <span className={`w-full text-center px-3 py-1 rounded-full text-white font-semibold text-sm ${
                                            incident.status === 'PENDING' ? 'bg-yellow-500' :
                                            incident.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                            'bg-green-500'
                                        }`}>
                                            {incident.status}
                                        </span>

                                        {(userRole && userRole !== 'STUDENT') && (
                                            <div className="w-full flex gap-2 border-2 border-[#f78fb3] rounded-full p-1.5">
                                                <button
                                                    onClick={() => {
                                                        setSelectedIncident(incident);
                                                        setIsStatusModalOpen(true);
                                                    }}
                                                    className="flex-1 text-gray-600 hover:text-gray-800 transition"
                                                    title="Editează"
                                                >
                                                    <PencilIcon className="w-4 h-4 mx-auto" />
                                                </button>

                                                {userRole === 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDeleteIncident(incident.id)}
                                                        className="flex-1 text-red-600 hover:text-red-800 transition"
                                                        title="Șterge"
                                                    >
                                                        <TrashIcon className="w-4 h-4 mx-auto" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <IncidentModal isOpen={isModalOpen} onClose={() => {
                setIsModalOpen(false);
                refreshIncidents();
            }} />

            <UpdateModal
                isOpen={isStatusModalOpen}
                selectedItem={selectedIncident}
                itemLabel={selectedIncident ? `Incident: ${selectedIncident.title}` : ''}
                onClose={() => {
                    setIsStatusModalOpen(false);
                    setSelectedIncident(null);
                }}
                onSave={handleUpdateStatus}
                onItemChange={setSelectedIncident}
                options={['PENDING', 'IN_PROGRESS', 'RESOLVED']}
                fieldName="Status"
                fieldKey="status"
            />
        </div>
    )
}

