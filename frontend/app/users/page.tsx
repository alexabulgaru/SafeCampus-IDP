'use client';
import { useState, useEffect, useContext } from 'react';
import Navbar from "../components/navbar";
import UpdateModal from "../components/update-modal";
import { User } from "../utils/interfaces";
import { KeycloakContext } from "../providers";
import axios from 'axios';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function Users() {
    const [loading, setLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { keycloak } = useContext(KeycloakContext);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = keycloak?.token;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const response = await axios.get<User[]>(`${apiUrl}/user/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Eroare la încărcarea utilizatorilor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [keycloak?.token]);

    const handleUpdateRole = async () => {
        if (!selectedUser) {
            return;
        }

        try {
            const token = keycloak?.token;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await axios.patch(
                `${apiUrl}/user/update-role/${selectedUser.id}`,
                { newRole: selectedUser.role },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            alert('Rol actualizat cu succes!');
            setIsRoleModalOpen(false);
            refreshUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Eroare la actualizarea rolului');
        }
    };

    const handleDeleteUser = async (userToDelete: User) => {
        if (!userToDelete) {
            return;
        }

        if (!confirm(`Esti sigur ca vrei sa stergi utilizatorul ${userToDelete.firstName} ${userToDelete.lastName}?`)) {
            return;
        }

        try {
            const token = keycloak?.token;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await axios.delete(
                `${apiUrl}/user/delete/${userToDelete.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            alert('Utilizator sters cu succes!');
            refreshUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Eroare la ștergerea utilizatorului');
        }
    };

    const refreshUsers = () => {
        fetchUsers();
    };

    return (
        <div className="min-h-screen bg-[#f8a5c2] flex flex-col">
            <Navbar />
            <div className="flex flex-col w-[80%] mx-auto items-center justify-center mt-10">
                <div className="w-full my-8 space-y-4">
                    {loading ? (
                        <div className="text-white text-center py-8">Se încarcă...</div>
                    ) : users.length === 0 ? (
                        <div className="text-white text-center py-8">Nu sunt incidente</div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="bg-white rounded-lg p-6 shadow-lg border-2 border-[#f78fb3]">
                                <div className="flex justify-between items-start gap-4">
                                    <div className='flex-1'>
                                        <div className="flex items-center mb-2">
                                            <h3 className="font-bold text-lg text-[#f78fb3]">{user.firstName} {user.lastName}</h3>
                                        </div>
                                        <p className="text-[#f78fb3] mb-3">{user.email}</p>
                                        
                                        {user.incidents && user.incidents.length > 0 && (
                                            <div className="mt-4 pt-4 border-t-2 border-[#f78fb3]">
                                                <p className="text-sm font-semibold text-[#f78fb3] mb-2">Incidente raportate:</p>
                                                <p className="text-sm text-[#f78fb3]">
                                                    {user.incidents.map((incident) => incident.title).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 w-32">
                                        <span className="w-full text-center px-3 py-1 rounded-full text-white font-semibold text-sm bg-[#f78fb3]">
                                            {user.role}
                                        </span>
                                        <div className="w-full flex gap-2 border-2 border-[#f78fb3] rounded-full p-1.5">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsRoleModalOpen(true);
                                                }}
                                                className="flex-1 text-gray-600 hover:text-gray-800 transition"
                                                title="Editează"
                                            >
                                                <PencilIcon className="w-4 h-4 mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="flex-1 text-red-600 hover:text-red-800 transition"
                                                title="Șterge"
                                            >
                                                <TrashIcon className="w-4 h-4 mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <UpdateModal
                isOpen={isRoleModalOpen}
                selectedItem={selectedUser}
                itemLabel={selectedUser ? `User: ${selectedUser.firstName} ${selectedUser.lastName}` : ''}
                onClose={() => {
                    setIsRoleModalOpen(false);
                    setSelectedUser(null);
                }}
                onSave={handleUpdateRole}
                onItemChange={setSelectedUser}
                options={['STUDENT', 'OPERATOR', 'MAINTENANCE', 'ADMIN']}
                fieldName="Rol"
                fieldKey="role"
            />
        </div>
    )
}
