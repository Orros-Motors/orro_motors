// src/pages/SeatSelection.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Check, ChevronLeft, Sofa, Loader2, Bus, X, Phone } from "lucide-react";
import { baseURL } from "../../services/baseurl";

interface Seat {
  _id: string;
  position: number;
  isPaid: boolean;
  isBooked: boolean;
  isBooking: boolean;
}

interface Trip {
  _id: string;
  tripName: string;
  tripId: string;
  pickup: { city: string; location: string };
  dropoff: { city: string; location: string };
  departureTime: string;
  arrivalTime: string;
  price: number;
  seatCount: number;
  seats: Seat[];
  bus: string;
  vehicleType: string;
  isHireTrip?: boolean;
}

const SeatSelection: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [hireFullBus, setHireFullBus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [otp, setOtp] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (!tripId) return setError("Invalid trip");

    const fetchTrip = async () => {
      try {
        const res = await axios.post(`${baseURL}/trips/search-trips-by-id`, {
          ids: [tripId],
        });
        if (res.data.success && res.data.trips[0]) {
          const fetched = res.data.trips[0];
          fetched.seats.sort((a: Seat, b: Seat) => a.position - b.position);
          setTrip(fetched);
          if (fetched.isHireTrip) setHireFullBus(true);
        } else {
          setError("Trip not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  const updateFullHireSelection = useCallback(() => {
    if (!trip) return;
    if (hireFullBus) {
      const available = trip.seats
        .filter((s) => !s.isBooked && !s.isBooking)
        .map((s) => ({ pos: s.position, id: s._id }));
      setSelectedSeats(available.map((s) => s.pos));
      setSelectedSeatIds(available.map((s) => s.id));
    } else {
      setSelectedSeats([]);
      setSelectedSeatIds([]);
    }
  }, [trip, hireFullBus]);

  useEffect(
    () => updateFullHireSelection(),
    [hireFullBus, updateFullHireSelection]
  );

  const toggleSeat = (position: number, seatId: string) => {
    if (hireFullBus || trip?.isHireTrip) return;
    const seat = trip?.seats.find((s) => s.position === position);
    if (!seat || seat.isBooked || seat.isBooking) return;

    setSelectedSeats((prev) =>
      prev.includes(position)
        ? prev.filter((p) => p !== position)
        : [...prev, position]
    );
    setSelectedSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const totalPrice = selectedSeats.length * (trip?.price || 0);
  const availableSeats =
    trip?.seats.filter((s) => !s.isBooked && !s.isBooking).length || 0;

  const handleProceed = () => {
    if (selectedSeatIds.length === 0) {
      alert("Please select at least one seat");
      return;
    }
    const user = localStorage.getItem("user");
    if (user) return initiatePayment();
    setShowOtpModal(true);
  };

  const sendOtp = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phoneNumber
    ) {
      setModalError("All fields are required");
      return;
    }
    setModalLoading(true);
    setModalError("");
    try {
      await axios.post(`${baseURL}/users/send-otp`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });
      setModalError("OTP sent to your phone!");
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setModalLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return setModalError("Enter 6-digit OTP");
    setModalLoading(true);
    try {
      const res = await axios.post(`${baseURL}/users/verify-otp`, {
        phoneNumber: formData.phoneNumber,
        otp: otp,
      });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setShowOtpModal(false);
        await initiatePayment();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setModalLoading(false);
    }
  };

  const initiatePayment = async () => {
    const user = JSON.parse(localStorage.getItem("user")!);
    const token = localStorage.getItem("token");
    setPaymentLoading(true);
    try {
      localStorage.setItem("selectedSeatIds", JSON.stringify(selectedSeatIds));
      const payload = {
        email: user.email,
        amount: totalPrice,
        callback_url: `${window.location.origin}/payment-success`,
        seatIds: selectedSeatIds,
        userId: user._id,
        tripId,
      };
      const res = await axios.post(
        `${baseURL}/pay/create-paystack-payment`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        localStorage.setItem("paymentReference", res.data.reference);
        window.location.href = res.data.authorizationUrl;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  if (error || !trip)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-600">
        {error || "Trip not found"}
      </div>
    );

  const totalSeats = trip?.seatCount || 0;

  // seats that are booked (selected by others but not yet paid)
  const bookedSeats = trip?.seats.filter((seat) => seat.isBooking).length || 0;

  // seats that are fully paid
  const paidSeats = trip?.seats.filter((seat) => seat.isPaid).length || 0;


  //screenShareInfo.userId !== userId 
  // seats available
  //const availableSeats = totalSeats - (bookedSeats + paidSeats);

  return (
    <>
      <div className="min-h-screen pt-[140px] bg-gradient-to-br from-blue-50 to-purple-50 pt-12 pb-24">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Bus className="w-8 h-8 text-purple-600" />
                  {trip.tripName}
                </h1>
                {trip.isHireTrip && (
                  <span className="inline-block mt-2 px-5 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                    FULL BUS HIRE ONLY
                  </span>
                )}
              </div>
            </div>

            {/* Hire Toggle */}
            {!trip.isHireTrip && availableSeats > 0 && (
              <div className="mt-6 p-5 bg-purple-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-purple-900">
                      {hireFullBus ? "Full Bus Hired" : "Hire Entire Bus?"}
                    </h3>
                    <p className="text-sm text-purple-700">
                      {hireFullBus
                        ? `${availableSeats} seats • ₦${(
                            trip.price * availableSeats
                          ).toLocaleString()}`
                        : "Great for groups & events"}
                    </p>
                  </div>
                  <button
                    onClick={() => setHireFullBus(!hireFullBus)}
                    className={`relative w-24 h-12 rounded-full transition-all ${
                      hireFullBus ? "bg-purple-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-10 h-10 bg-white rounded-full shadow transition-all ${
                        hireFullBus ? "translate-x-12" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seat Grid */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-bold text-center mb-8">
              {hireFullBus ||
              trip.isHireTrip ||
              bookedSeats + paidSeats >= totalSeats
                ? `Full Bus Booked (${totalSeats} seats)`
                : `Selected: ${selectedSeats.length} seat${
                    selectedSeats.length !== 1 ? "s" : ""
                  }`}
            </h2>

            <div
              className={`grid ${
                trip.seatCount <= 16 ? "grid-cols-4" : "grid-cols-5"
              } gap-6 max-w-3xl mx-auto`}
            >
              {trip.seats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.position);
                const isBooked = seat.isBooked || seat.isBooking;
                const disabled = isBooked || hireFullBus || trip.isHireTrip;

                return (
                  <button
                    key={seat._id}
                    onClick={() => toggleSeat(seat.position, seat._id)}
                    disabled={disabled}
                    className="group"
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-purple-600 to-pink-600 border-purple-700 scale-110"
                          : isBooked
                          ? "bg-gray-200 border-gray-400"
                          : "bg-gray-50 border-gray-300 hover:border-purple-500"
                      } ${disabled && !isBooked ? "opacity-50" : ""}`}
                    >
                      {isSelected ? (
                        <Check className="w-8 h-8 text-white" />
                      ) : (
                        <Sofa
                          className={`w-9 h-9 ${
                            isBooked ? "text-gray-500" : "text-gray-700"
                          }`}
                        />
                      )}
                    </div>
                    <p
                      className={`text-center mt-2 font-bold ${
                        isSelected
                          ? "text-purple-600"
                          : isBooked
                          ? "text-gray-400"
                          : "text-gray-800"
                      }`}
                    >
                      {seat.position}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-50 border-2 border-gray-300 rounded-lg" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 border-2 border-gray-400 rounded-lg" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 border-2 border-purple-700 rounded-lg" />
                <span>Selected</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg opacity-90">Total</p>
                <p className="text-4xl font-bold">
                  ₦{totalPrice.toLocaleString()}
                </p>
                {hireFullBus && <p className="text-sm mt-1">Full Bus Hire</p>}
              </div>
              <button
                onClick={handleProceed}
                disabled={selectedSeats.length === 0 || paymentLoading}
                className={`px-10 py-5 rounded-xl font-bold text-xl transition-all ${
                  selectedSeats.length === 0
                    ? "bg-gray-500"
                    : "bg-white text-purple-700 hover:scale-105 shadow-lg"
                }`}
              >
                {paymentLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin inline" />
                ) : (
                  "Pay Now"
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => window.history.back()}
            className="mt-6 text-gray-600 hover:text-gray-800 flex g- items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        </div>
      </div>

      {/* CLEAN OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Phone className="w-6 h-6 text-purple-600" />
                Verify Phone Number
              </h3>
              <button onClick={() => setShowOtpModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-xl mb-3"
            />
            <input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-xl mb-3"
            />
            <input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-xl mb-3"
            />
            <input
              placeholder="Phone Number (e.g. 08012345678)"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full px-4 py-3 border rounded-xl mb-4"
            />

            <button
              onClick={sendOtp}
              disabled={modalLoading}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
            >
              {modalLoading ? "Sending..." : "Send OTP"}
            </button>

            {modalError.includes("sent") && (
              <>
                <input
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 rounded-xl mt-4"
                  maxLength={6}
                />
                <button
                  onClick={verifyOtp}
                  disabled={modalLoading || otp.length !== 6}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"
                >
                  Verify & Pay
                </button>
              </>
            )}

            {modalError && !modalError.includes("sent") && (
              <p className="text-red-500 text-center mt-4 text-sm">
                {modalError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SeatSelection;
