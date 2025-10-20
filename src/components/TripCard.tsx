'use client'
import Image from "next/image";
import React, { useState } from "react";
import BookModal from "./BookModal";

interface TripCardProps {
    from: string;
    to: string;
    departure: string; // e.g., "2025-10-25"
    availableSeats: number;
    flightNumber: string;
    price: string;
    image?: string;
}

const TripCard: React.FC<TripCardProps> = ({
    from,
    to,
    departure,
    availableSeats,
    flightNumber,
    price,
    image = "/siwa.jpg",
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className=" bg-white border border-gray-300 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row w-[600px] max-w-[90%] gap-4
      transform transition-transform duration-300 "
        >
            {/* Trip Image */}
            <div className="shrink-0">
                <Image
                    src={image}
                    className="rounded-2xl object-cover w-full h-48 md:h-full md:w-48"
                    width={150}
                    height={150}
                    alt={`${from} to ${to}`}
                />
            </div>

            {/* Trip Info */}
            <div className="flex flex-col justify-between flex-1 p-2 gap-2">
                {/* Route */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2">
                    <h2 className="font-semibold">
                        {from} → {to}
                    </h2>
                    <span className="text-gray-500 text-sm">{departure}</span>
                </div>

                {/* Flight Info */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div className="text-gray-600 text-sm">Flight: {flightNumber}</div>
                    <div className="text-gray-600 text-sm">
                        Seats available: {availableSeats}
                    </div>
                </div>

                {/* Price & Book Button */}
                <div className="flex justify-between items-center mt-auto">
                    <div className="text-lg font-bold text-[#179FDB]">{price}</div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#179FDB] text-white px-4 py-2 rounded-xl hover:bg-[#0f7ac3] transition">
                        Book Now
                    </button>
                </div>
            </div>
            <BookModal
                isModalOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                from={from}
                to={to}
                price={price}
                availableSeats={availableSeats}
            />
        </div>
    );
};

export default TripCard;
