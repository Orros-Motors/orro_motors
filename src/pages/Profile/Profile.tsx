// src/pages/Profile.tsx
import  { useState } from "react";
import {
  LogOut,
  User,
  Mail,
  Phone,
  Calendar,
  X,
  CheckCircle,
} from "lucide-react";

const Profile = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("selectedSeatIds");
    localStorage.removeItem("paymentReference");
    window.location.href = "/";
  };

  if (!user || !user._id) {
    return (
      <div className="min-h-screen pt-[120px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-10 text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Not Logged In
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your profile
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pt-[120px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Header */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                <User className="w-16 h-16 text-white" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-800">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-lg text-purple-600 mt-2 flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verified Account
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
              <User className="w-7 h-7 text-purple-600" />
              Profile Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-5 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-bold text-gray-800">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-pink-50 rounded-xl border border-pink-200">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email Address</p>
                  <p className="text-lg font-bold text-gray-800 break-all">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-lg font-bold text-gray-800">
                    +{user.phoneNumber.replace(/^234/, "234 ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-green-50 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-lg font-bold text-gray-800">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="text-center">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold text-xl rounded-xl hover:scale-105 transition shadow-xl"
            >
              <LogOut className="w-7 h-7" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Logout Confirmation
              </h3>
              <p className="text-gray-600">Are you sure you want to logout?</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition shadow-lg"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
