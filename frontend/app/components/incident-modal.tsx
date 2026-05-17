'use client';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useUserContext } from '../UserContext';
import { useState, useContext } from 'react';
import { KeycloakContext } from '../providers';
import axios from 'axios';

interface IncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const validationSchema = Yup.object({
    title: Yup.string().required('Titlul este obligatoriu'),
    description: Yup.string().required('Descrierea este obligatorie'),
    type: Yup.string().required('Tipul incidentului este obligatoriu'),
});

const INCIDENT_TYPES = ['SAFETY', 'MAINTENANCE', 'MEDICAL', 'USUAL'];

export default function IncidentModal({ isOpen, onClose }: IncidentModalProps) {
    const { lat, lng, user } = useUserContext();
    const { keycloak } = useContext(KeycloakContext);
    const [coordinates] = useState({ lat: lat || '', lng: lng || '' });

    const handleSubmit = async (values: { title: string; description: string; type: string }, { setSubmitting }: any) => {
        try {
            const token = keycloak?.token;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await axios.post(
                `${apiUrl}/incidents/create`,
                {
                    title: values.title,
                    description: values.description,
                    type: values.type,
                    lat: String(coordinates.lat || lat || '0'),
                    lng: String(coordinates.lng || lng || '0'),
                    reportedById: user?.id,
                    status: 'PENDING',
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            alert('Incident raportat cu succes!');
            onClose();
        } catch (error) {
            console.error('Error reporting incident:', error);
            alert('Eroare la raportarea incidentului');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full border-4 border-[#f78fb3]">
                <h2 className="text-2xl text-[#f78fb3] font-bold mb-6">Raportează un incident</h2>
                
                <Formik
                    initialValues={{
                        title: '',
                        description: '',
                        type: 'USUAL',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {(formik) => (
                        <Form className="space-y-4">
                            <div>
                                <label className="block text-md font-medium text-[#f78fb3] mb-2">
                                    Titlu
                                </label>
                                <Field
                                    type="text"
                                    id="title"
                                    name="title"
                                    placeholder="Introdu titlul incidentului"
                                    className="w-full autofill px-4 py-2 border-2 border-[#f78fb3] rounded-lg focus:outline-none focus:border-[#f78fb3] text-[#f78fb3] placeholder-[#f78fb3]"
                                />
                                <ErrorMessage
                                    name="title"
                                    component="div"
                                    className="text-red-500 text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-md font-medium text-[#f78fb3] mb-2">
                                    Descriere
                                </label>
                                <Field
                                    as="textarea"
                                    id="description"
                                    name="description"
                                    placeholder="Introdu descrierea incidentului"
                                    rows={4}
                                    className="w-full autofill px-4 py-2 border-2 border-[#f78fb3] rounded-lg focus:outline-none focus:border-[#f78fb3] text-[#f78fb3] placeholder-[#f78fb3]"
                                />
                                <ErrorMessage
                                    name="description"
                                    component="div"
                                    className="text-red-500 text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-md font-medium text-[#f78fb3] mb-2">
                                    Tip Incident
                                </label>
                                <Field
                                    as="select"
                                    id="type"
                                    name="type"
                                    className="w-full autofill px-4 py-2 border-2 border-[#f78fb3] rounded-lg focus:outline-none focus:border-[#f78fb3] text-[#f78fb3]"
                                >
                                    <option value="">Selectează tipul incidentului</option>
                                    {INCIDENT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </Field>
                                <ErrorMessage
                                    name="type"
                                    component="div"
                                    className="text-red-500 text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-md font-medium text-[#f78fb3] mb-2">
                                    Locație / Adresă - {coordinates.lat && coordinates.lng ? `(${coordinates.lat}, ${coordinates.lng})` : 'Folosește locația ta curentă'}
                                </label>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="submit"
                                    disabled={formik.isSubmitting}
                                    className="flex-1 bg-[#f78fb3] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#e67a9f] transition disabled:opacity-50"
                                >
                                    {formik.isSubmitting ? 'Se raportează...' : 'Raportează'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-gray-300 text-[#f78fb3] font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Anulează
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
