import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Call from "./pages/Call";
import CEO from "./pages/dashboard/CEO";
import Leader from "./pages/dashboard/Leader";
import Manager from "./pages/dashboard/Manager";
import Member from "./pages/dashboard/Member";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/call" element={<Call />} />
        <Route
          path="/dashboard/ceo"
          element={
            <ProtectedRoute allowedRoles={["CEO"]}>
              <CEO />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/leader"
          element={
            <ProtectedRoute allowedRoles={["Leader"]}>
              <Leader />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/manager"
          element={
            <ProtectedRoute allowedRoles={["Manager"]}>
              <Manager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/member"
          element={
            <ProtectedRoute allowedRoles={["Member"]}>
              <Member />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
