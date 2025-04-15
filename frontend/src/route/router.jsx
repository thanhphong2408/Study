import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import MainLayout from "../layout/mainLayout";
import Classes from "../pages/Classes/Classes";
import SignleClasses from "../pages/Classes/SignleClasses";
import Dashboard from "../pages/Dashboard/Dashboard";
import AddClass from "../pages/Dashboard/Instructor/AddClass";
import InstructorCP from "../pages/Dashboard/Instructor/InstructorCP";

import AdminCP from "../pages/Dashboard/Admin/AdminCP";
import CreateAccount from "../pages/Dashboard/Admin/CreateAccount";
import ManageApplications from "../pages/Dashboard/Admin/ManageApplications";
import ManageClass from "../pages/Dashboard/Admin/ManageClass";
import ManageUser from "../pages/Dashboard/Admin/ManageUser";
import SeoSetting from "../pages/Dashboard/Admin/SeoSetting";
import UpdateAccount from "../pages/Dashboard/Admin/UpdateAccount";
import ChangePass from "../pages/Dashboard/Dashboard_shared/ChangePass";
import ProFile from "../pages/Dashboard/Dashboard_shared/Profile";
import UpdateProfile from "../pages/Dashboard/Dashboard_shared/UpdateProfile";
import MyApproved from "../pages/Dashboard/Instructor/MyApproved";
import MyClasses from "../pages/Dashboard/Instructor/MyClasses";
import PendingCourse from "../pages/Dashboard/Instructor/PendingCourse";
import RejectedCourse from "../pages/Dashboard/Instructor/RejectedCourse";
import UpdateClass from "../pages/Dashboard/Instructor/UpdateClass";
import ApplyInstructor from "../pages/Dashboard/Student/apply/ApplyInstructor";
import NewAppliedInstructor from "../pages/Dashboard/Student/apply/NewAppliedInstructor";
import EnrolledClasses from "../pages/Dashboard/Student/Enroll/EnrolledClasses";
import Payment from "../pages/Dashboard/Student/Payment/History/Payment";
import PaymentHistory from "../pages/Dashboard/Student/Payment/MyPaymentHistory";
import SelectedClass from "../pages/Dashboard/Student/SelectedClass";
import StudentCP from "../pages/Dashboard/Student/StudentCP";
import Home from "../pages/Home/Home";
import Instructors from "../pages/Instructors/Instructors";
import Login from "../user/login";
import Register from "../user/register";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/instructors",
        element: <Instructors />,
      },
      {
        path: "/classes",
        element: <Classes />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/classes/:id",
        element: <SignleClasses />,
        loader: async ({ params }) => {
          const response = await fetch(
            `http://localhost:3000/class/${params.id}`
          );
          if (!response.ok) {
            throw new Response("Not Found", { status: 404 });
          }
          return response.json();
        },
      },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      // Dashboard routes here
      {
        index: true,
        element: <Dashboard />,
      },

      //student routes here
      {
        path: "students-cp",
        element: <StudentCP />,
      },
      {
        path: "enrolled-class",
        element: <EnrolledClasses />,
      },
      {
        path: "my-selected",
        element: <SelectedClass />,
      },
      {
        path: "my-payments",
        element: <PaymentHistory />,
      },
      {
        path: "apply-instructor",
        element: <ApplyInstructor />,
      },

      {
        path: "new-apply-instructor",
        element: <NewAppliedInstructor />,
      },

      {
        path: "user/payment",
        element: <Payment />,
      },

      // intructor routes here
      {
        path: "instructor-cp",
        element: <InstructorCP />,
      },
      {
        path: "add-class",
        element: <AddClass />,
      },
      {
        path: "my-classes",
        element: <MyClasses />,
      },
      {
        path: "my-pedding",
        element: <PendingCourse />,
      },
      {
        path: "my-approved",
        element: <MyApproved />,
      },
      {
        path: "my-rejected",
        element: <RejectedCourse />,
      },
      {
        path: "update/:id",
        element: <UpdateClass />,
      },
      {
        path: "class/:id", // Route chi tiết lớp học
        element: <SignleClasses />,
      },

      // Admin routes here
      {
        path: "admin-home",
        element: <AdminCP />,
      },
      {
        path: "manage-users",
        element: <ManageUser />,
      },
      {
        path: "manage-class",
        element: <ManageClass />,
      },
      {
        path: "manage-applications",
        element: <ManageApplications />,
      },
      {
        path: "update-user/:id",
        element: <UpdateAccount />,
        loader: ({ params }) =>
          fetch(`http://localhost:3000/users/${params.id}`),
      },
      {
        path: "create-accounts",
        element: <CreateAccount />,
      },
      {
        path: "seo-setting",
        element: <SeoSetting />,
      },

      // router shared
      {
        path: "info-profile",
        element: <ProFile />,
      },
      {
        path: "change-password",
        element: <ChangePass />,
      },
      {
        path: "/dashboard/update-own-profile/:id",
        element: <UpdateProfile />,
        loader: ({ params }) =>
          fetch(`http://localhost:3000/users/${params.id}`),
      },
    ],
  },
]);
