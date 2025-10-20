import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface BookModalProps {
    isModalOpen: boolean;
    onClose: () => void;
    from: string;
    to: string;
    price: string; // e.g., "$120"
    availableSeats: number;
}

const BookModal: React.FC<BookModalProps> = ({
    isModalOpen,
    onClose,
    from,
    to,
    price,
    availableSeats,
}) => {
    const [members, setMembers] = useState(1);
    const router = useRouter()
    if (!isModalOpen) return null;

    // Extract numeric value from price string
    const numericPrice = Number(price.replace("$", ""));
    const totalAmount = numericPrice * members;

    return (
        <div className="fixed inset-0 z-50 flex top-1/2 left-1/2 -translate-1/2 w-screen h-screen items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
                <h2 className="text-xl font-semibold mb-4">
                    Book Trip: {from} → {to}
                </h2>

                {/* Members Selector */}
                <div className="flex flex-col gap-2 mb-4">
                    <label className="font-semibold">Number of Members</label>
                    <input
                        type="number"
                        min={1}
                        max={availableSeats}
                        value={members}
                        onChange={(e) =>
                            setMembers(Math.min(availableSeats, Number(e.target.value)))
                        }
                        className="border p-2 rounded-lg w-full"
                    />
                    <span className="text-gray-500 text-sm">
                        Max available seats: {availableSeats}
                    </span>
                </div>

                {/* Total Amount */}
                <div className="mb-4 text-lg font-semibold">Total: ${totalAmount}</div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            router.push('/signin')
                            onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-[#179FDB] text-white hover:bg-[#0f7ac3] transition"
                    >
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookModal;
