"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const locations = ["Siwa", "Cairo", "Alexandria", "Luxor", "Aswan"];

const getRandomDate = (start: Date, end: Date) => {
    return new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
    ).toISOString().split("T")[0]; // YYYY-MM-DD
};

const SearchBar = () => {
    const router = useRouter();
    const [from, setFrom] = useState<string>(locations[0]);
    const [to, setTo] = useState<string>(locations[1]);
    const [startDate, setStartDate] = useState<string>(
        getRandomDate(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)) // within 30 days
    );
    const [endDate, setEndDate] = useState<string>(
        getRandomDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * 31), new Date(Date.now() + 1000 * 60 * 60 * 24 * 60))
    );

    const handleSearch = () => {
        // You can replace this with real navigation or API call
        console.log({ from, to, startDate, endDate });
        // router.push(`/trips?from=${from}&to=${to}&start=${startDate}&end=${endDate}`);
    };

    return (
        <div className="bg-white/90 text-black backdrop-blur-md p-3 md:p-5 rounded-2xl shadow-lg w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 items-end">
            {/* From Location */}
            <div className="flex flex-col w-full md:w-1/4">
                <label className="font-semibold mb-1">From</label>
                <select
                    className="p-2 rounded-lg border border-gray-300"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                >
                    {locations.map((loc) => (
                        <option key={loc} value={loc}>
                            {loc}
                        </option>
                    ))}
                </select>
            </div>

            {/* To Location */}
            <div className="flex flex-col w-full md:w-1/4">
                <label className="font-semibold mb-1">To</label>
                <select
                    className="p-2 rounded-lg border border-gray-300"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                >
                    {locations.map((loc) => (
                        <option key={loc} value={loc}>
                            {loc}
                        </option>
                    ))}
                </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col w-full md:w-1/4">
                <label className="font-semibold mb-1">Start Date</label>
                <input
                    type="date"
                    className="p-2 rounded-lg border border-gray-300"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>

            {/* End Date */}
            <div className="flex flex-col w-full md:w-1/4">
                <label className="font-semibold mb-1">End Date</label>
                <input
                    type="date"
                    className="p-2 rounded-lg border border-gray-300"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>

            {/* Search Button */}
            <button
                onClick={handleSearch}
                type="button"
                className="bg-[#179FDB] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0f7ac3] transition w-full md:w-auto"
            >
                Search
            </button>
        </div>
    );
};

export default SearchBar;
