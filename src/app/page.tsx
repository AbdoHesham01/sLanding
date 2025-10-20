import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import TripCard from "@/components/TripCard";
import Image from "next/image";

export default function Home() {
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
          <SearchBar />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center gap-4  mt-65 md:my-2">
        <TripCard
          from="Siwa"
          to="Cairo"
          departure="2025-10-25"
          availableSeats={12}
          flightNumber="S1234"
          price="$120"
        />
        <TripCard
          from="Siwa"
          to="Alexandria"
          departure="2025-11-01"
          availableSeats={8}
          flightNumber="S5678"
          price="$150"
        />
      </div>
    </div>
  );
}
