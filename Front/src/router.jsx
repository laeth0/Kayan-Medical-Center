import { createBrowserRouter } from "react-router-dom";
import { ROLES } from "./constant";
import PatientLayout from "./layout/PatientLayout";
import AdminLayout from "./layout/AdminLayout";
import DoctorLayout from "./layout/DoctorLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import Landing from "./pages/landing";
import PatientAppointments from "./pages/patient/Appointments";
import PatientBook from "./pages/patient/Book";
import DoctorVisit from "./pages/doctor/DoctorVisit";
import BookedAppointments from "./pages/doctor/BookedAppointments";
import WeeklyWorkingHours from "./pages/doctor/WeeklyWorkingHours";
import DoctorVisitDetails from "./pages/doctor/DoctorVisitDetails";
import DoctorPastVisits from "./pages/doctor/DoctorPastVisits";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import Dashboard from "./pages/admin/Dashboard";
import DoctorsList from "./pages/admin/DoctorsList";
import FinanceList from "./pages/admin/FinanceList";
import StaffForm from "./pages/admin/StaffForm";
import AccessControl from "./components/AccessControl";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientVisits from "./pages/patient/PatientVisits";
import FinanceVisitsSearch from "./pages/finance/FinanceVisitsSearch";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing />
    },
    {
        path: "/admin",
        element: <AccessControl roles={[ROLES.ADMIN]} />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { index: true, element: <Dashboard /> },
                    { path: "doctors", element: <DoctorsList /> },
                    { path: "finance", element: <FinanceList /> },
                    { path: ":role/new", element: <StaffForm /> }
                ],
            }
        ],
    },
    {
        path: "/doctor",
        element: <AccessControl roles={[ROLES.DOCTOR]} />,
        children: [
            {
                element: <DoctorLayout />,
                children: [
                    { path: "appointments", element: <BookedAppointments /> },
                    { path: "visit/:appointmentId", element: <DoctorVisit /> },

                    { path: "working-hours", element: <WeeklyWorkingHours /> },

                    { path: "DoctorPastVisits", element: <DoctorPastVisits /> },
                    { path: "DoctorVisitDetails/:visitId", element: <DoctorVisitDetails /> },

                    { path: "profile", element: <DoctorProfile /> },
                ],
            },
        ],
    },
    {
        path: "/patient",
        element: <AccessControl roles={[ROLES.PATIENT]} />,
        children: [
            {
                element: <PatientLayout />,
                children: [
                    { path: "book", element: <PatientBook /> },
                    { path: "appointments", element: <PatientAppointments /> },
                    { path: "visits", element: <PatientVisits /> },
                    { path: "profile", element: <PatientProfile /> },
                ],
            },
        ],
    },
    {
        path: "/finance",
        element: <AccessControl roles={[ROLES.FINANCE]} />,
        children: [
            {
                index: true,
                element: <FinanceVisitsSearch />,
            },
        ],
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "*",
        element: <NotFound />
    },

]);

export default router;