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

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

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
        navigate("/dashboard");
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
      const success = await register(registerName, registerEmail, registerPassword);
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

  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 p-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
          <Mail className="mx-auto mb-4 text-green-600" size={40} />
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-gray-600 mb-4">
            Code sent to <strong>{registerEmail}</strong>
          </p>

          <div className="bg-gray-100 p-3 rounded-lg mb-4 text-sm">
            Demo code: <strong>123456</strong>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-14 h-14 flex items-center justify-center rounded-xl mx-auto mb-3">
            <Cloud className="text-blue-600" size={28} />
          </div>
          <h1 className="text-2xl font-bold">AirQuality DSM</h1>
          <p className="text-gray-500 text-sm">Monitor air quality easily</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          {['login','register'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* LOGIN */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center border rounded-lg px-3">
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

            <div className="flex items-center border rounded-lg px-3">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            <div className="text-xs bg-blue-50 p-3 rounded-lg">
              <p className="font-semibold mb-1">Demo Accounts</p>
              <p>Admin: admin@airquality.tz</p>
              <p>Owner: owner@company.com</p>
              <p>Any email works</p>
            </div>
          </form>
        )}

        {/* REGISTER */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            {[{icon:User,value:registerName,set:setRegisterName,placeholder:"Full Name"},
              {icon:Mail,value:registerEmail,set:setRegisterEmail,placeholder:"Email"},
              {icon:Lock,value:registerPassword,set:setRegisterPassword,placeholder:"Password",type:"password"},
              {icon:Lock,value:registerConfirmPassword,set:setRegisterConfirmPassword,placeholder:"Confirm Password",type:"password"}
            ].map((field, i) => {
              const Icon = field.icon;
              return (
                <div key={i} className="flex items-center border rounded-lg px-3">
                  <Icon className="text-gray-400" size={16} />
                  <input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    className="w-full p-2 outline-none"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    required
                  />
                </div>
              );
            })}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
