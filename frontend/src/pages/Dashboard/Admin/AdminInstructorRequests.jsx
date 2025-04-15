import React, { useEffect, useState } from "react";

const AdminInstructorRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("/applied-instrustion/all") // Giả sử bạn có route này để lấy tất cả apply
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error(err));
  }, []);

  const handleStatusChange = async (id, status, email) => {
    try {
      const response = await fetch(`/update-instructor-status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.modifiedCount > 0) {
        if (status === "approved") {
          // Gọi API để đổi role user thành instructor
          await fetch(`/promote-to-instructor/${email}`, {
            method: "PATCH",
          });
        }

        setRequests((prev) =>
          prev.map((req) => (req._id === id ? { ...req, status } : req))
        );

        alert(`Đã cập nhật trạng thái thành ${status}!`);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Yêu cầu đăng ký làm giáo viên</h2>
      {requests.map((request) => (
        <div key={request._id} className="border p-4 mb-4 rounded shadow">
          <p>
            <strong>Tên:</strong> {request.name}
          </p>
          <p>
            <strong>Email:</strong> {request.email}
          </p>
          <p>
            <strong>Điện thoại:</strong> {request.phone}
          </p>
          <p>
            <strong>Chuyên môn:</strong> {request.expertise}
          </p>
          <p>
            <strong>Mô tả:</strong> {request.about}
          </p>
          <p>
            <strong>Trạng thái:</strong> {request.status || "Chờ duyệt"}
          </p>

          <div className="mt-2 flex gap-2">
            <button
              onClick={() =>
                handleStatusChange(request._id, "approved", request.email)
              }
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Duyệt
            </button>
            <button
              onClick={() => handleStatusChange(request._id, "denied")}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Từ chối
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminInstructorRequests;
