'use client';

interface UpdateModalProps {
    isOpen: boolean;
    selectedItem: any;
    itemLabel: string;
    onClose: () => void;
    onSave: () => void;
    onItemChange: (item: any) => void;
    options: readonly string[];
    fieldName: string;
    fieldKey: string;
}

export default function UpdateModal({ 
    isOpen, 
    selectedItem, 
    itemLabel,
    onClose, 
    onSave, 
    onItemChange,
    options,
    fieldName,
    fieldKey
}: UpdateModalProps) {
    if (!isOpen || !selectedItem) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full border-4 border-[#f78fb3]">
                <h2 className="text-2xl text-[#f78fb3] font-bold mb-6">Editează {fieldName}</h2>
                <p className="text-gray-700 mb-4">{itemLabel}</p>
                
                <div className="space-y-2 mb-6">
                    {options.map((option) => (
                        <label key={option} className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name={fieldKey}
                                value={option}
                                checked={selectedItem[fieldKey] === option}
                                onChange={(e) => onItemChange({ ...selectedItem, [fieldKey]: e.target.value })}
                                className="mr-3"
                            />
                            <span className="text-gray-700 font-medium">{option}</span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onSave}
                        className="flex-1 bg-[#f78fb3] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#e67a9f] transition"
                    >
                        Salvează
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-[#f78fb3] font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                    >
                        Anulează
                    </button>
                </div>
            </div>
        </div>
    );
}
