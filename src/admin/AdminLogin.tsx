import { useState } from "react";
import { ArrowRight, Lock, Mail, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import orros from "../../src/assets/vite.png";
import { baseURL } from "../services/baseurl";

export default function AdminLogin() {
  const [step, setStep] = useState<"input" | "otp">("input");
  const [input, setInput] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const normalizePhone = (value: string): string => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "234" + cleaned.slice(1);
    } else if (cleaned.startsWith("234")) {
    } else if (value.startsWith("+234")) {
      cleaned = "234" + cleaned.slice(3);
    } else if (value.startsWith("+") && !value.startsWith("+234")) {
      cleaned = cleaned;
    } else if (cleaned.length === 10 && ["7", "8", "9"].includes(cleaned[0])) {
      cleaned = "234" + cleaned;
    }

    return cleaned;
  };

  const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());
  const formatDisplayPhone = (phone: string) => {
    if (phone.startsWith("234") && phone.length === 13) {
      return `+234 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone.startsWith("234") ? phone.replace("234", "+234") : phone;
  };

  const handleResendOtp = async () => {
    if (!identifier) return;

    setLoading(true);
    setMessage("");

    try {
      const payload = isEmail(identifier)
        ? { email: identifier }
        : { phone: identifier };
      const { data } = await axios.post(
        `${baseURL}/admins/resend-otp`,
        payload
      );

      setMessage(
        data.success
          ? "OTP resent successfully!"
          : data.message || "Failed to resend."
      );
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setMessage("");

    let finalIdentifier = input.trim();
    let isEmailInput = isEmail(finalIdentifier);

    if (!isEmailInput) {
      finalIdentifier = normalizePhone(finalIdentifier);
      if (finalIdentifier.length < 12) {
        setMessage("Please enter a valid phone number.");
        setLoading(false);
        return;
      }
    }

    setIdentifier(finalIdentifier);

    try {
      const payload = isEmailInput
        ? { email: finalIdentifier }
        : { phone: finalIdentifier };

      const { data } = await axios.post(`${baseURL}/admins/login`, payload);

      if (data.success) {
        setMessage(`OTP sent to your ${isEmailInput ? "email" : "phone"}!`);
        setStep("otp");
      } else {
        setMessage(data.message || "Failed to send OTP.");
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = isEmail(identifier)
        ? { email: identifier, otp }
        : { phone: identifier, otp };

      const { data } = await axios.post(
        `${baseURL}/admins/verify-otp`,
        payload
      );

      if (data.success) {
        setMessage("Login Successful!");
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminData", JSON.stringify(data.admin));
        navigate("/admin/main");
      } else {
        setMessage(data.message || "Invalid OTP.");
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const displayValue = isEmail(identifier)
    ? identifier
    : formatDisplayPhone(identifier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <img
              src={orros}
              alt="Orro Motors Logo"
              className="w-16 h-16 rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Orro Motors Admin
          </h1>
          <p className="text-gray-600 mt-2">Secure login with email or phone</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {message && (
            <p
              className={`text-sm mb-4 text-center ${
                message.includes("Success") || message.includes("sent")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {step === "input" ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Login to Admin
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Enter your email or phone number to receive OTP
              </p>

              <form onSubmit={handleSendOtp}>
                <div className="relative mb-6">
                  {isEmail(input) ? (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  ) : (
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="email@domain.com or 08012345678"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white py-4 rounded-xl transition font-semibold flex items-center justify-center gap-3 shadow-lg ${
                    loading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Sending..." : "Send OTP"}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verify OTP
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Enter the 6-digit code sent to <br />
                <span className="font-semibold text-gray-900">
                  {displayValue}
                </span>
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="relative mb-8">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-2xl tracking-widest font-mono text-center"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setOtp("");
                      setMessage("");
                    }}
                    disabled={loading}
                    className="flex-1 border border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-blue-600 text-white py-4 rounded-xl transition font-semibold shadow-lg ${
                      loading
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Didn’t receive code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-600 font-medium hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} Orro Motors. Admin access only.
        </p>
      </div>
    </div>
  );
}
