import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Cloud, Mail, Lock, User } from "lucide-react";

export default function LoginPage() {
  const { login, register, error: authError } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    setIsLoading(true);

    try {
      const success = await login(loginEmail, loginPassword);
      if (success) {
        navigate("/dashboard");
      } else {
        setLocalError(authError || "Invalid email or password");
      }
    } catch (err) {
      setLocalError("Login error");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;

    return {
      isValid:
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar &&
        isLongEnough,
      errors: [
        !isLongEnough && "At least 8 characters",
        !hasUpperCase && "One uppercase letter",
        !hasLowerCase && "One lowercase letter",
        !hasNumber && "One number",
        !hasSpecialChar && "One special character (@$!%*?&)",
      ].filter(Boolean),
    };
  };

  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [],
  });

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setRegisterPassword(pwd);
    setPasswordValidation(validatePassword(pwd));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (registerPassword !== registerConfirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(registerPassword);
    if (!passwordValidation.isValid) {
      setLocalError("Password: " + passwordValidation.errors.join(", "));
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
        navigate("/dashboard");
      } else {
        setLocalError(authError || "Registration failed");
      }
    } catch (err) {
      setLocalError("Registration error");
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

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
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setLocalError("");
              }}
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

        {displayError && (
          <div className="bg-red-100 text-red-600 text-sm p-3 rounded mb-4">
            {displayError}
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* REGISTER */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center border rounded-lg px-3">
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

            {/* Email */}
            <div className="flex items-center border rounded-lg px-3">
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

            {/* Password */}
            <div className="flex items-center border rounded-lg px-3">
              <Lock className="text-gray-400" size={16} />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 outline-none"
                value={registerPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            {/* Password Validation Feedback */}
            {registerPassword && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold mb-2">Password Requirements:</p>
                <ul className="space-y-1">
                  <li className={passwordValidation.errors.some(e => e.includes("8 characters")) ? "text-red-600" : "text-green-600"}>
                    {passwordValidation.errors.some(e => e.includes("8 characters")) ? "✗" : "✓"} At least 8 characters
                  </li>
                  <li className={passwordValidation.errors.some(e => e.includes("uppercase")) ? "text-red-600" : "text-green-600"}>
                    {passwordValidation.errors.some(e => e.includes("uppercase")) ? "✗" : "✓"} One uppercase letter (A-Z)
                  </li>
                  <li className={passwordValidation.errors.some(e => e.includes("lowercase")) ? "text-red-600" : "text-green-600"}>
                    {passwordValidation.errors.some(e => e.includes("lowercase")) ? "✗" : "✓"} One lowercase letter (a-z)
                  </li>
                  <li className={passwordValidation.errors.some(e => e.includes("number")) ? "text-red-600" : "text-green-600"}>
                    {passwordValidation.errors.some(e => e.includes("number")) ? "✗" : "✓"} One number (0-9)
                  </li>
                  <li className={passwordValidation.errors.some(e => e.includes("special")) ? "text-red-600" : "text-green-600"}>
                    {passwordValidation.errors.some(e => e.includes("special")) ? "✗" : "✓"} One special character (@$!%*?&)
                  </li>
                </ul>
              </div>
            )}

            {/* Confirm Password */}
            <div className="flex items-center border rounded-lg px-3">
              <Lock className="text-gray-400" size={16} />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full p-2 outline-none"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
