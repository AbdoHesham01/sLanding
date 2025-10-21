'use client';

import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import TripCard from "@/components/TripCard";
import Image from "next/image";
import { useState } from "react";

interface Trip {
  id?: string;
  from: string;
  to: string;
  departure: string;
  availableSeats: number;
  flightNumber: string;
  price: string;
  image?: string;
  seatMap?: any[];
  basePrice?: number;
  currency?: string;
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchResults = (results: any[]) => {
    setIsSearching(false);
    setSearchError(null);
    setHasSearched(true);
    // Map API results to TripCard props format
    const mappedResults: Trip[] = results.map((trip: any) => {
      // Format the departure date from ISO string to readable format
      const departureDate = new Date(trip.departureTime).toLocaleDateString();
      
      return {
        id: trip.id,
        from: trip.origin,
        to: trip.destination,
        departure: departureDate,
        availableSeats: trip.availableSeats,
        flightNumber: trip.flightNumber,
        price: `$${trip.basePrice} ${trip.currency}`,
        image: "/siwa.jpg", // Default image, you might want to add logic for different destinations
        seatMap: trip.seatMap,
        basePrice: trip.basePrice,
        currency: trip.currency
      };
    });
    setSearchResults(mappedResults);
  };

  const handleSearchError = (error: string) => {
    setIsSearching(false);
    setSearchError(error);
    setSearchResults([]);
    setHasSearched(true);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchError(null);
  };

  return (
    <div className="md:py-15 md:px-10 bg-white/95 w-full flex flex-col gap-3 h-screen">
      <Navbar />
      <div className="md:rounded-2xl bg-[url('/siwa.jpg')] bg-center bg-cover w-full h-full grid md:grid-cols-1 min-h-[500px]">
        <div className="flex flex-col mt-25 md:mt-0 justify-end gap-3 p-5 text-white">
          <h2 className="text-4xl md:text-6xl font-semibold  m-0">
            Book the best
          </h2>
          <h2 className="text-4xl md:text-6xl font-semibold text-white">            trip of your life
          </h2>
          <h3 className="text-xl text-white ">
            Siwa, Egypt’s hidden gem — where the desert embraces life and the heart finds stillness
          </h3>
          <SearchBar 
            onSearchResults={handleSearchResults} 
            onSearchStart={handleSearchStart}
            onSearchError={handleSearchError}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-4  mt-65 md:my-2">
        {isSearching && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#179FDB]"></div>
            <p className="mt-2 text-gray-600">Searching for trips...</p>
          </div>
        )}
        
        {searchError && (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️ Search Error</div>
            <p className="text-gray-600">{searchError}</p>
          </div>
        )}
        
        {searchResults.length > 0 ? (
          searchResults.map((trip, index) => (
            <TripCard
              key={trip.id || index}
              from={trip.from}
              to={trip.to}
              departure={trip.departure}
              availableSeats={trip.availableSeats}
              flightNumber={trip.flightNumber}
              price={trip.price}
              image={trip.image}
              tripData={trip}
            />
          ))
        ) : hasSearched && !isSearching && !searchError ? (
          // No results found after search
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">🔍 No trips found</div>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
