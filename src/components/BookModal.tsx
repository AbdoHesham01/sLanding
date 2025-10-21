'use client';
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

interface Passenger {
    type: 'ADULT' | 'INFANT';
    name: string;
    passportNumberOrIdNumber: string;
    files: {
        type: 'PASSPORT' | 'BIRTH_CERTIFICATE';
        originalFilename: string;
        mimeType: string;
        base64Content: string;
    }[];
}

interface BookModalProps {
    isModalOpen: boolean;
    onClose: () => void;
    from: string;
    to: string;
    price: string; // e.g., "$120"
    availableSeats: number;
    tripData?: any;
}

const BookModal: React.FC<BookModalProps> = ({
    isModalOpen,
    onClose,
    from,
    to,
    price,
    availableSeats,
    tripData,
}) => {
    const router = useRouter();
    
    // Form state
    const [bookerName, setBookerName] = useState('');
    const [bookerEmail, setBookerEmail] = useState('');
    const [bookerPhone, setBookerPhone] = useState('');
    const [numberOfAdults, setNumberOfAdults] = useState(1);
    const [numberOfInfants, setNumberOfInfants] = useState(0);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Mock seats data (44 seats)
    const generateSeats = () => {
        const seats = [];
        const rows = 11; // 44 seats = 11 rows × 4 seats
        const seatsPerRow = 4;
        const seatLetters = ['A', 'B', 'C', 'D'];
        
        for (let row = 1; row <= rows; row++) {
            for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex++) {
                seats.push({
                    id: `seat-${row}${seatLetters[seatIndex]}`,
                    seatNumber: `${row}${seatLetters[seatIndex]}`,
                    isAvailable: Math.random() > 0.3, // 70% available
                    isSelected: false
                });
            }
        }
        return seats;
    };

    const [seats, setSeats] = useState(generateSeats());

    // Restore booking data if user came back from login
    useEffect(() => {
        if (isModalOpen) {
            const pendingBooking = localStorage.getItem('pendingBooking');
            if (pendingBooking) {
                const data = JSON.parse(pendingBooking);
                setBookerName(data.bookerName || '');
                setBookerEmail(data.bookerEmail || '');
                setBookerPhone(data.bookerPhone || '');
                setNumberOfAdults(data.numberOfAdults || 1);
                setNumberOfInfants(data.numberOfInfants || 0);
                setSelectedSeats(data.selectedSeats || []);
                setPaidAmount(data.paidAmount || 0);
                if (data.passengers) {
                    setPassengers(data.passengers);
                }
            }
        }
    }, [isModalOpen]);

    // Update passengers when adult/infant count changes
    useEffect(() => {
        const newPassengers: Passenger[] = [];
        
        // Add adult passengers only (infants don't need individual passenger forms)
        for (let i = 0; i < numberOfAdults; i++) {
            newPassengers.push({
                type: 'ADULT',
                name: '',
                passportNumberOrIdNumber: '',
                files: []
            });
        }
        
        setPassengers(newPassengers);
    }, [numberOfAdults]);

    // Calculate total amount
    useEffect(() => {
        const basePrice = tripData?.basePrice || 200;
        const infantPrice = 50; // You might want to get this from API
        const total = (numberOfAdults * basePrice) + (numberOfInfants * infantPrice);
        setTotalAmount(total);
    }, [numberOfAdults, numberOfInfants, tripData]);

    // Check if form is valid
    const isFormValid = () => {
        if (!bookerName || !bookerEmail || !bookerPhone) return false;
        if (selectedSeats.length !== numberOfAdults) return false;
        if (paidAmount <= 0) return false; // Add paid amount validation
        
        // Check if all adult passengers have required info
        for (const passenger of passengers) {
            if (!passenger.name || !passenger.passportNumberOrIdNumber) return false;
            if (passenger.files.length === 0) return false;
        }
        
        return true;
    };

    const handleSeatClick = (seatId: string) => {
        const totalNeeded = numberOfAdults; // Infants don't need separate seats
        
        if (selectedSeats.includes(seatId)) {
            // Deselect seat
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
        } else if (selectedSeats.length < totalNeeded) {
            // Select seat
            setSelectedSeats(prev => [...prev, seatId]);
        }
    };

    const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
        setPassengers(prev => prev.map((passenger, i) => 
            i === index ? { ...passenger, [field]: value } : passenger
        ));
    };

    const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Content = reader.result as string;
                const fileData = {
                    type: passengers[index].type === 'ADULT' ? 'PASSPORT' as const : 'BIRTH_CERTIFICATE' as const,
                    originalFilename: file.name,
                    mimeType: file.type,
                    base64Content: base64Content.split(',')[1] // Remove data URL prefix
                };
                
                updatePassenger(index, 'files', [fileData]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBooking = async () => {
        // Check if user is logged in (you'll need to implement this logic)
        const token = localStorage.getItem('authToken');
        const isLoggedIn = !!token;
        
        if (!isLoggedIn) {
            // Store booking data in localStorage for after login
            const bookingData = {
                tripData,
                bookerName,
                bookerEmail,
                bookerPhone,
                numberOfAdults,
                numberOfInfants,
                passengers,
                selectedSeats,
                totalAmount,
                paidAmount,
                from,
                to
            };
            localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
            router.push('/signin');
            onClose();
            return;
        }

        setIsLoading(true);
        
        try {
            const bookingData = {
                tripId: tripData?.id,
                seatIds: selectedSeats,
                passengers: passengers.map(p => ({
                    type: p.type,
                    name: p.name,
                    passportNumberOrIdNumber: p.passportNumberOrIdNumber,
                    files: p.files
                }))
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gaber-airplans.onrender.com/api/v1';
            const response = await fetch(`${apiUrl}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                throw new Error('Booking failed');
            }

            const result = await response.json();
            console.log('Booking successful:', result);
            
            // Clear pending booking data
            localStorage.removeItem('pendingBooking');
            onClose();
            // You might want to show a success message or redirect
        } catch (error) {
            console.error('Booking error:', error);
            // Show error message to user
        } finally {
            setIsLoading(false);
        }
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">
                            Book Trip: {from} → {to}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                            ×
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Seat Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Select Seats</h3>
                            <p className="text-sm text-gray-600">
                                Select {numberOfAdults} seat{numberOfAdults > 1 ? 's' : ''} for adults
                                {numberOfInfants > 0 && ` (${numberOfInfants} infant${numberOfInfants > 1 ? 's' : ''} will share)`}
                            </p>
                            
                            <div className="grid grid-cols-4 gap-2 max-w-md">
                                {seats.map(seat => (
                                    <button
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat.id)}
                                        disabled={!seat.isAvailable}
                                        className={`
                                            p-2 rounded text-sm font-medium border-2 transition
                                            ${!seat.isAvailable 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300' 
                                                : selectedSeats.includes(seat.id)
                                                    ? 'bg-[#179FDB] text-white border-[#179FDB]'
                                                    : 'bg-white border-gray-300 hover:border-[#179FDB]'
                                            }
                                        `}
                                    >
                                        {seat.seatNumber}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-white border-2 border-gray-300"></div>
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-[#179FDB] border-2 border-[#179FDB]"></div>
                                    <span>Selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-300 border-2 border-gray-300"></div>
                                    <span>Occupied</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Passenger Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Passenger Information</h3>
                            
                            {/* Booker Details */}
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium">Contact Information</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={bookerName}
                                        onChange={(e) => setBookerName(e.target.value)}
                                        className="p-2 border rounded-lg"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={bookerEmail}
                                        onChange={(e) => setBookerEmail(e.target.value)}
                                        className="p-2 border rounded-lg"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        value={bookerPhone}
                                        onChange={(e) => setBookerPhone(e.target.value)}
                                        className="p-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Number of Passengers */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-2">Adults</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={availableSeats}
                                        value={numberOfAdults}
                                        onChange={(e) => setNumberOfAdults(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-2">Infants</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={numberOfInfants}
                                        onChange={(e) => setNumberOfInfants(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Passenger Details */}
                            <div className="space-y-4">
                                {passengers.map((passenger, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-3">
                                        <h4 className="font-medium">
                                            {passenger.type === 'ADULT' ? 'Adult' : 'Infant'} {index + 1}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={passenger.name}
                                                onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                                                className="p-2 border rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder={passenger.type === 'ADULT' ? 'Passport Number' : 'ID Number'}
                                                value={passenger.passportNumberOrIdNumber}
                                                onChange={(e) => updatePassenger(index, 'passportNumberOrIdNumber', e.target.value)}
                                                className="p-2 border rounded-lg"
                                            />
                                            <div>
                                                <label className="block text-sm font-medium mb-1">
                                                    {passenger.type === 'ADULT' ? 'Passport' : 'Birth Certificate'}
                                                </label>
                                                <input
                                                    type="file"
                                                    accept={passenger.type === 'ADULT' ? 'image/*' : 'application/pdf,image/*'}
                                                    onChange={(e) => handleFileUpload(index, e)}
                                                    className="w-full p-2 border rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Summary */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium">Payment Summary</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex justify-between">
                                        <span>Total Amount:</span>
                                        <span className="font-semibold">${totalAmount}</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Paid Amount"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                                        className="p-2 border rounded-lg"
                                    />
                                    <div className="flex justify-between">
                                        <span>Remaining:</span>
                                        <span className="font-semibold">${totalAmount - paidAmount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBooking}
                                    disabled={isLoading || !isFormValid()}
                                    className="px-6 py-2 rounded-xl bg-[#179FDB] text-white hover:bg-[#0f7ac3] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Booking...' : 'Book Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookModal;
