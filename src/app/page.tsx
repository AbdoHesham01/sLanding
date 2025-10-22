"use client";

import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import TripCard, { TripCardRef } from "@/components/TripCard";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

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
  const tripCardRefs = useRef<{ [key: string]: TripCardRef }>({});

  // Handle pending booking restoration after login with auto-search
  useEffect(() => {
    const restorePendingBooking = async () => {
      const pendingBooking = localStorage.getItem("pendingBooking");
      if (!pendingBooking) return;

      try {
        const bookingData = JSON.parse(pendingBooking);
        const token = localStorage.getItem("authToken");

        // Check if user is now logged in and booking should be reopened
        if (token && bookingData.shouldReopenModal) {
          // Check if data is not too old (24 hours)
          const isDataFresh =
            bookingData.timestamp &&
            Date.now() - bookingData.timestamp < 24 * 60 * 60 * 1000;

          if (!isDataFresh) {
            localStorage.removeItem("pendingBooking");
            toast.error("Booking session expired. Please search again.");
            return;
          }

          // Strategy 1: If we have search results and can find matching trip, use it
          const matchingTrip = searchResults.find(
            (trip) =>
              trip.from === bookingData.from &&
              trip.to === bookingData.to &&
              trip.id === bookingData.originalTripData?.id
          );

          if (
            matchingTrip &&
            tripCardRefs.current[
              matchingTrip.id || `${matchingTrip.from}-${matchingTrip.to}`
            ]
          ) {
            // Perfect match found in current search results
            setTimeout(() => {
              tripCardRefs.current[
                matchingTrip.id || `${matchingTrip.from}-${matchingTrip.to}`
              ].openModal();
              const updatedBookingData = {
                ...bookingData,
                shouldReopenModal: false,
              };
              localStorage.setItem(
                "pendingBooking",
                JSON.stringify(updatedBookingData)
              );
            }, 1000);
            return;
          }

          // Strategy 2: Auto-search for the user's trip if no current results or no match
          if (
            bookingData.searchParams ||
            (bookingData.from && bookingData.to)
          ) {
            toast.loading("Searching for your trip...", { duration: 2000 });

            try {
              await performAutoSearch(bookingData);
            } catch (error) {
              console.error("Auto-search failed:", error);
              // Strategy 3: Fallback - create a temporary trip card with stored data
              await createTempTripForBooking(bookingData);
            }
          } else {
            // Strategy 3: No search params, use stored trip data directly
            await createTempTripForBooking(bookingData);
          }
        }
      } catch (error) {
        console.error("Error restoring pending booking:", error);
        localStorage.removeItem("pendingBooking");
        toast.error(
          "Error restoring booking data. Please search and try again."
        );
      }
    };

    // Auto-search function
    const performAutoSearch = async (bookingData: any) => {
      try {
        // Use search params if available, otherwise derive from booking data
        const searchParams = bookingData.searchParams || {
          from: bookingData.from,
          to: bookingData.to,
          departure:
            bookingData.originalTripData?.departureTime ||
            new Date().toISOString(),
        };

        // Calculate search dates
        const departureDate = new Date(searchParams.departure);
        const startDate = departureDate.toISOString().split("T")[0];
        const endDate = new Date(
          departureDate.getTime() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]; // +7 days

        // Prepare API call parameters
        const departureFrom = `${startDate}T00:00:00.000Z`;
        const departureTo = `${endDate}T23:59:59.000Z`;

        const arrivalFromDate = new Date(startDate);
        arrivalFromDate.setDate(arrivalFromDate.getDate() + 1);
        const arrivalToDate = new Date(endDate);
        arrivalToDate.setDate(arrivalToDate.getDate() + 3);

        const arrivalFrom = arrivalFromDate.toISOString();
        const arrivalTo = arrivalToDate.toISOString();

        const params = new URLSearchParams({
          from: searchParams.from,
          to: searchParams.to,
          departureFrom,
          departureTo,
          arrivalFrom,
          arrivalTo,
          offset: "0",
        });

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://gaber-airplans.onrender.com/api/v1";
        const response = await fetch(`${apiUrl}/trips?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Auto-search failed");
        }

        const data = await response.json();
        const trips = data.trips || data || [];

        if (trips.length > 0) {
          // Update search results with auto-search results
          handleSearchResults(trips);
          toast.success("Found your trips! Opening booking...", {
            duration: 2000,
          });

          // Try to find exact match or similar trip
          setTimeout(() => {
            const exactMatch = trips.find(
              (trip: any) => trip.id === bookingData.originalTripData?.id
            );

            const similarMatch = trips.find(
              (trip: any) =>
                trip.origin === searchParams.from &&
                trip.destination === searchParams.to
            );

            const targetTrip = exactMatch || similarMatch || trips[0];
            const mappedTrip = {
              id: targetTrip.id,
              from: targetTrip.origin,
              to: targetTrip.destination,
              departure: new Date(
                targetTrip.departureTime
              ).toLocaleDateString(),
              availableSeats: targetTrip.availableSeats,
              flightNumber: targetTrip.flightNumber,
              price: `$${targetTrip.basePrice} ${targetTrip.currency}`,
            };

            const tripKey =
              mappedTrip.id || `${mappedTrip.from}-${mappedTrip.to}`;
            if (tripCardRefs.current[tripKey]) {
              tripCardRefs.current[tripKey].openModal();
              const updatedBookingData = {
                ...bookingData,
                shouldReopenModal: false,
              };
              localStorage.setItem(
                "pendingBooking",
                JSON.stringify(updatedBookingData)
              );

              if (!exactMatch && similarMatch) {
                toast(
                  "⚠️ Similar trip found. Please verify the details match your needs.",
                  {
                    duration: 5000,
                  }
                );
              }
            }
          }, 1500);
        } else {
          throw new Error("No trips found");
        }
      } catch (error) {
        console.error("Auto-search error:", error);
        throw error;
      }
    };

    // Fallback: Create temporary trip for booking continuation
    const createTempTripForBooking = async (bookingData: any) => {
      try {
        if (bookingData.originalTripData || bookingData.from) {
          toast("Restoring your trip data...", { duration: 2000 });

          // Create a temporary search result with the stored trip data
          const tempTrip = {
            id: bookingData.originalTripData?.id || `temp-${Date.now()}`,
            from: bookingData.from,
            to: bookingData.to,
            departure: bookingData.originalTripData?.departureTime
              ? new Date(
                  bookingData.originalTripData.departureTime
                ).toLocaleDateString()
              : new Date().toLocaleDateString(),
            availableSeats: bookingData.originalTripData?.availableSeats || 10,
            flightNumber:
              bookingData.originalTripData?.flightNumber || "TEMP001",
            price: `$${bookingData.originalTripData?.basePrice || 200} ${
              bookingData.originalTripData?.currency || "USD"
            }`,
            image: "/siwa.jpg",
            seatMap: bookingData.originalTripData?.seatMap,
            basePrice: bookingData.originalTripData?.basePrice || 200,
            currency: bookingData.originalTripData?.currency || "USD",
          };

          // Add this trip to search results
          setSearchResults([tempTrip]);
          setHasSearched(true);

          // Open modal after a short delay
          setTimeout(() => {
            const tripKey = tempTrip.id;
            if (tripCardRefs.current[tripKey]) {
              tripCardRefs.current[tripKey].openModal();
              const updatedBookingData = {
                ...bookingData,
                shouldReopenModal: false,
              };
              localStorage.setItem(
                "pendingBooking",
                JSON.stringify(updatedBookingData)
              );

              toast(
                "📋 Your trip data has been restored. Please verify and continue booking.",
                {
                  duration: 4000,
                  icon: "📋",
                }
              );
            }
          }, 1000);
        } else {
          toast.error(
            "Unable to restore trip data. Please search for your trip again."
          );
          localStorage.removeItem("pendingBooking");
        }
      } catch (error) {
        console.error("Error creating temp trip:", error);
        toast.error(
          "Unable to restore trip data. Please search for your trip again."
        );
        localStorage.removeItem("pendingBooking");
      }
    };

    restorePendingBooking();
  }, [searchResults]); // Depend on searchResults to recheck when trips are loaded

  // Clear pending booking if user manually navigates away and searches for different trips
  useEffect(() => {
    const pendingBooking = localStorage.getItem("pendingBooking");
    if (pendingBooking && searchResults.length > 0) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        const hasMatchingTrip = searchResults.some(
          (trip) => trip.from === bookingData.from && trip.to === bookingData.to
        );

        // If user searched for completely different routes and has pending booking, ask what to do
        if (!hasMatchingTrip && !bookingData.shouldReopenModal) {
          const timeoutId = setTimeout(() => {
            const shouldClear = confirm(
              "You have a pending booking for a different trip. Would you like to clear it and start fresh?"
            );
            if (shouldClear) {
              localStorage.removeItem("pendingBooking");
              toast.success(
                "Previous booking cleared. You can start a new booking."
              );
            }
          }, 2000);

          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Error checking pending booking:", error);
      }
    }
  }, [searchResults]);

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
        currency: trip.currency,
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
          <h2 className="text-4xl md:text-6xl font-semibold text-white">
            {" "}
            trip of your life
          </h2>
          <h3 className="text-xl text-white ">
            Siwa, Egypt’s hidden gem — where the desert embraces life and the
            heart finds stillness
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
          searchResults.map((trip, index) => {
            const tripKey = trip.id || `${trip.from}-${trip.to}`;
            return (
              <TripCard
                key={trip.id || index}
                ref={(ref) => {
                  if (ref) {
                    tripCardRefs.current[tripKey] = ref;
                  } else {
                    delete tripCardRefs.current[tripKey];
                  }
                }}
                from={trip.from}
                to={trip.to}
                departure={trip.departure}
                availableSeats={trip.availableSeats}
                flightNumber={trip.flightNumber}
                price={trip.price}
                image={trip.image}
                tripData={trip}
              />
            );
          })
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
