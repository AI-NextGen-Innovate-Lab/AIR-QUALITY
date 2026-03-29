import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Cloud, Mail, Lock, User } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(loginEmail, loginPassword);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Login error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(
        registerName,
        registerEmail,
        registerPassword
      );

      if (success) {
        setShowVerification(true);
      } else {
        setError("Registration failed");
      }
    } catch {
      setError("Registration error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-500 p-4">
        <div className="bg-white p-8 rounded-lg w-full max-w-md text-center">
          <Mail className="mx-auto mb-4 text-green-600" size={40} />
          <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            Code sent to <strong>{registerEmail}</strong>
          </p>

          <p className="text-sm bg-gray-100 p-2 rounded mb-4">
            Demo code: <strong>123456</strong>
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-500 p-4">
      <div className="bg-white p-8 rounded-lg w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <Cloud className="mx-auto text-blue-500 mb-2" size={40} />
          <h1 className="text-xl font-bold">AirQuality DSM</h1>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 border rounded overflow-hidden">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 ${
              activeTab === "login"
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 ${
              activeTab === "register"
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        {/* LOGIN */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="flex items-center border rounded px-2">
              <Mail className="text-gray-400" size={16} />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 outline-none"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center border rounded px-2">
              <Lock className="text-gray-400" size={16} />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 outline-none"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            {/* Demo */}
            <div className="text-xs bg-gray-100 p-2 rounded">
              <p>Admin: admin@airquality.tz</p>
              <p>Owner: owner@company.com</p>
              <p>Any email works</p>
            </div>
          </form>
        )}

        {/* REGISTER */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="flex items-center border rounded px-2">
              <User className="text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-2 outline-none"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center border rounded px-2">
              <Mail className="text-gray-400" size={16} />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 outline-none"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center border rounded px-2">
              <Lock className="text-gray-400" size={16} />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 outline-none"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center border rounded px-2">
              <Lock className="text-gray-400" size={16} />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-2 outline-none"
                value={registerConfirmPassword}
                onChange={(e) =>
                  setRegisterConfirmPassword(e.target.value)
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}