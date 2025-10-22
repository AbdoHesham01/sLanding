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
    const [isLoading, setIsLoading] = useState(false);
    const [seats, setSeats] = useState<any[]>([]);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
    
    // Reset all states when modal is closed
    const resetModalStates = () => {
        setPaymentUrl(null);
        setShowPayment(false);
        setBookingConfirmed(false);
        setCurrentBookingId(null);
        setBookingDetails(null);
    };
    
    // Enhanced onClose to reset states and cancel booking if needed
    const handleModalClose = async () => {
        // If user closes modal while on payment screen, cancel the booking
        if (showPayment && currentBookingId) {
            try {
                const token = localStorage.getItem('authToken');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://siwayanlandapi.runasp.net/api';

                await fetch(`${apiUrl}/bookings/${currentBookingId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('Booking cancelled due to modal close');
            } catch (error) {
                console.error('Error cancelling booking on modal close:', error);
            }
        }
        
        resetModalStates();
        onClose();
    };
    
    // Handle payment completion
    const handlePaymentComplete = () => {
        setShowPayment(false);
        setPaymentUrl(null);
        setCurrentBookingId(null); // Clear booking ID after successful payment
        setBookingConfirmed(true);
        // Store booking details for confirmation screen
        setBookingDetails({
            from,
            to,
            price,
            selectedSeats,
            passengers: passengers.filter(p => p.name.trim() !== ''),
            bookerName,
            bookerEmail
        });
    };

    // Handle booking cancellation when going back from payment
    const handleCancelBooking = async () => {
        if (!currentBookingId) {
            // If no booking ID, just go back to booking form
            setShowPayment(false);
            setPaymentUrl(null);
            return;
        }

        // Confirm cancellation with user
        const confirmCancel = window.confirm(
            'Going back will cancel your current booking. Are you sure you want to continue?'
        );
        
        if (!confirmCancel) {
            return;
        }

        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://siwayanlandapi.runasp.net/api';

            const response = await fetch(`${apiUrl}/bookings/${currentBookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('Failed to cancel booking');
                // Even if cancellation fails, allow user to go back
            } else {
                console.log('Booking cancelled successfully');
            }
            
            // Reset states
            setShowPayment(false);
            setPaymentUrl(null);
            setCurrentBookingId(null);
            
        } catch (error) {
            console.error('Error cancelling booking:', error);
            // Even if there's an error, allow user to go back
            setShowPayment(false);
            setPaymentUrl(null);
            setCurrentBookingId(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize seats on component mount and when tripData changes
    useEffect(() => {
        // Generate seats from trip data or mock data
        let newSeats;
        
        // If we have real seat data from the API, use it
        if (tripData?.seatMap && Array.isArray(tripData.seatMap)) {
            newSeats = tripData.seatMap.map((seat: any) => ({
                id: seat.id, // This should be the UUID from the API
                seatNumber: seat.seatNumber,
                isAvailable: seat.isAvailable,
                isSelected: false
            }));
        } else {
            // Fallback to mock data if no real seat data
            newSeats = [];
            const rows = 11; // 44 seats = 11 rows × 4 seats
            const seatsPerRow = 4;
            const seatLetters = ['A', 'B', 'C', 'D'];
            
            for (let row = 1; row <= rows; row++) {
                for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex++) {
                    newSeats.push({
                        id: `mock-seat-${row}${seatLetters[seatIndex]}`, // Mock UUID-like ID
                        seatNumber: `${row}${seatLetters[seatIndex]}`,
                        isAvailable: Math.random() > 0.3, // 70% available
                        isSelected: false
                    });
                }
            }
        }
        
        setSeats(newSeats);
    }, [tripData]);

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
        
        // Check if all adult passengers have required info (files are optional)
        for (const passenger of passengers) {
            if (!passenger.name || !passenger.passportNumberOrIdNumber) return false;
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
        // Check if user is logged in
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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gaber-airplans.onrender.com/api/v1';
            
            // Step 1: Create booking
            const bookingData = {
                tripId: tripData?.id,
                seatIds: selectedSeats,
                passengers: passengers.map(p => ({
                    type: p.type,
                    name: p.name,
                    passportNumberOrIdNumber: p.passportNumberOrIdNumber,
                    files: p.files || [] // Send empty array if no files
                }))
            };

            const bookingResponse = await fetch(`${apiUrl}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            if (!bookingResponse.ok) {
                throw new Error('Booking creation failed');
            }

            const bookingResult = await bookingResponse.json();
            console.log('Booking created:', bookingResult);
            
            // Store booking ID for potential cancellation
            setCurrentBookingId(bookingResult.id);
            
            // Step 2: Create payment intent
            const paymentData = {
                firstName: bookerName.split(' ')[0] || bookerName,
                lastName: bookerName.split(' ').slice(1).join(' ') || bookerName,
                email: bookerEmail,
                phone: bookerPhone,
                city: "Cairo", // You might want to make this dynamic
                country: "EG"
            };

            const paymentResponse = await fetch(`${apiUrl}/bookings/${bookingResult.id}/payments/intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });

            if (!paymentResponse.ok) {
                throw new Error('Payment intent creation failed');
            }

            const paymentResult = await paymentResponse.json();
            console.log('Payment intent created:', paymentResult);
            
            // Clear pending booking data
            localStorage.removeItem('pendingBooking');
            
            // Show payment iframe instead of redirecting
            if (paymentResult.redirectUrl) {
                setPaymentUrl(paymentResult.redirectUrl);
                setShowPayment(true);
            } else {
                // If no payment URL, show success message
                alert('Booking created successfully!');
                onClose();
            }
            
        } catch (error) {
            console.error('Booking error:', error);
            alert(error instanceof Error ? error.message : 'Booking failed. Please try again.');
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
                            {bookingConfirmed ? "Booking Confirmed!" : showPayment ? "Complete Payment" : `Book Trip: ${from} → ${to}`}
                        </h2>
                        <button onClick={handleModalClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                            ×
                        </button>
                    </div>

                    {/* Booking confirmation view */}
                    {bookingConfirmed ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <div className="text-3xl text-green-600">✓</div>
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
                                <p className="text-gray-600">Your trip has been booked successfully.</p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
                                <h4 className="font-semibold mb-4">Booking Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Route:</span>
                                        <span className="font-medium">{bookingDetails?.from} → {bookingDetails?.to}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="font-medium">{bookingDetails?.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Seats:</span>
                                        <span className="font-medium">{bookingDetails?.selectedSeats?.length} seat(s)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Passengers:</span>
                                        <span className="font-medium">{bookingDetails?.passengers?.length} passenger(s)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Booked by:</span>
                                        <span className="font-medium">{bookingDetails?.bookerName}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500">
                                    A confirmation email has been sent to {bookingDetails?.bookerEmail}
                                </p>
                                <button
                                    onClick={handleModalClose}
                                    className="px-6 py-3 bg-[#179FDB] text-white rounded-lg hover:bg-[#0f7ac3] transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ) : showPayment && paymentUrl ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-blue-800 font-medium">
                                        {isLoading ? 'Processing...' : 'Payment Processing'}
                                    </p>
                                </div>
                                <p className="text-blue-600 text-sm mt-1">
                                    {isLoading 
                                        ? 'Please wait while we process your request...'
                                        : 'Complete your payment below to confirm your booking'
                                    }
                                </p>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                                <iframe 
                                    src={paymentUrl}
                                    width="100%"
                                    height="650"
                                    className="border-0"
                                    title="Payment Gateway"
                                    style={{ minHeight: '650px' }}
                                />
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t bg-gray-50 p-4 rounded-lg">
                                <button
                                    onClick={handleCancelBooking}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Cancelling...' : '← Back to Booking'}
                                </button>
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Secure payment powered by</div>
                                    <div className="text-sm font-semibold text-blue-600">Paymob</div>
                                </div>
                                <button
                                    onClick={handlePaymentComplete}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Payment Complete ✓
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Original booking form */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column - Seat Selection */}
                            <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Select Seats</h3>
                            <p className="text-sm text-gray-600">
                                Select {numberOfAdults} seat{numberOfAdults > 1 ? 's' : ''} for adults
                                {numberOfInfants > 0 && ` (${numberOfInfants} infant${numberOfInfants > 1 ? 's' : ''} will share)`}
                            </p>
                            
                            <div className="grid grid-cols-4 gap-2 max-w-md">
                                {seats.map((seat: any) => (
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
                                                    {passenger.type === 'ADULT' ? 'Passport (Optional)' : 'Birth Certificate (Optional)'}
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

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleModalClose}
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookModal;
