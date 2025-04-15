import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ManageApplications = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/applied-instrustion/all")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Lỗi khi lấy danh sách:", err));
  }, []);

  const handleStatusChange = async (id, newStatus, email) => {
    try {
      const currentRequest = requests.find((req) => req._id === id);
      if (currentRequest.status === newStatus) {
        // Gọi toast khi trạng thái không thay đổi
        toast(`Trạng thái đã là "${newStatus}", không cần thay đổi.`, {
          icon: "⚠️", // hoặc để trống "", hoặc dùng emoji/icon tùy ý
          duration: 4000, // thời gian hiển thị (ms)
        });

        return;
      }

      const response = await fetch(
        `http://localhost:3000/update-instructor-status/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();
      console.log("Update Status Result:", result);

      if (result.modifiedCount > 0) {
        if (newStatus === "approved") {
          // Duyệt đơn và cập nhật quyền làm giảng viên
          await axios.patch(
            `http://localhost:3000/promote-to-instructor/${email}`
          );
        }

        setRequests((prev) =>
          prev.map((req) =>
            req._id === id ? { ...req, status: newStatus } : req
          )
        );

        toast.success(`✅ Đã cập nhật trạng thái thành "${newStatus}"`);
      } else {
        toast.error("⚠️ Không cập nhật được trạng thái.");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error(" Có lỗi xảy ra.");
    }
  };

  const denyInstructor = async (id, email) => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/deny-instructor/${email}`
      );
      // console.log("Phản hồi từ API deny:", response.data);

      toast.success("Từ chối đơn và reset quyền thành công");

      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: "denied" } : req))
      );
    } catch (err) {
      toast.error("Lỗi khi từ chối đơn");
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-4xl font-bold mb-4">
        Application <span className="text-secondary">for</span> Membership
      </h2>

      {requests.length === 0 ? (
        <p className="text-gray-500">Không có yêu cầu nào.</p>
      ) : (
        requests.map((request) => (
          <div key={request._id} className="border p-4 mb-4 rounded shadow">
            <div className="flex items-center mb-4">
              {request.photoUrl && (
                <img
                  src={request.photoUrl}
                  alt={request.name}
                  className="w-40 h-40 rounded-full mr-4"
                />
              )}
              <div>
                <p>
                  <strong>Name:</strong> {request.name}
                </p>
                <p>
                  <strong>Email:</strong> {request.email}
                </p>
                <p>
                  <strong>Address:</strong> {request.address}
                </p>
                <p>
                  <strong>Phone:</strong> {request.phone}
                </p>
                <p>
                  <strong>Skills:</strong> {request.expertise}
                </p>
                <p>
                  <strong>About:</strong> {request.about}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {request.status === "approved"
                    ? "✅ Đã duyệt"
                    : request.status === "denied"
                    ? "❌ Đã từ chối"
                    : "⏳ Chờ duyệt"}
                </p>
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() =>
                  handleStatusChange(request._id, "approved", request.email)
                }
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Approved
              </button>
              <button
                onClick={() => denyInstructor(request._id, request.email)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Deny
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ManageApplications;
