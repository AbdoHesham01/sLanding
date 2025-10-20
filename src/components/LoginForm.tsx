'use client'
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const LoginSection: React.FC = () => {
    const router = useRouter()
    return (
        <section className="border-red-500 bg-gray-200 p-3 min-h-screen flex items-center justify-center">
            <div className="bg-gray-100 p-5 flex rounded-2xl shadow-lg max-w-3xl w-full">
                {/* Left Form */}
                <div className="md:w-1/2 px-5 w-full">
                    <h2 className="text-2xl font-bold text-[#002D74]">Login</h2>
                    <p className="text-sm mt-4 text-[#002D74]">
                        If you have an account, please login
                    </p>

                    <form className="mt-6" action="#" method="POST">
                        <div>
                            <label className="block text-gray-700" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter Email Address"
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                                autoFocus
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-gray-700" htmlFor="password">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter Password"
                                minLength={6}
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
                                required
                            />
                        </div>



                        <button
                            type="button"

                            className="w-full block bg-blue-500 hover:bg-blue-400 focus:bg-blue-400 text-white font-semibold rounded-lg px-4 py-2 mt-6"
                        >
                            Log In
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-7 grid grid-cols-3 items-center text-gray-500">
                        <hr className="border-gray-500" />
                        <p className="text-center text-sm">OR</p>
                        <hr className="border-gray-500" />
                    </div>



                    {/* Register */}
                    <div className="text-sm flex justify-between items-center mt-3">
                        <p>If you don't have an account...</p>
                        <button onClick={() => {
                            router.push('/signup')
                        }} className="py-2 px-5 ml-3 bg-white border rounded-xl hover:scale-110 duration-300 border-blue-400">
                            Register
                        </button>
                    </div>
                </div>

                {/* Right Image */}
                <div className="w-1/2 md:block hidden">
                    <Image
                        src="/siwa.jpg"
                        alt="page img"
                        width={700}
                        height={100}

                        className="rounded-2xl h-full object-cover"
                    />
                </div>
            </div>
        </section>
    );
};

export default LoginSection;
