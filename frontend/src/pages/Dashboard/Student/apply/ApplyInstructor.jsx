import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "../../../../hooks/useUser";

const AppliedApplications = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useUser();

  useEffect(() => {
    setLoading(true);

    fetch(
      `http://localhost:3000/applied-instrustion/user/${currentUser?.email}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Data nhận được từ API:", data); // Kiểm tra dữ liệu trả về
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi lấy danh sách đơn:", err);
        setLoading(false);
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      });
  }, [currentUser]);

  const handleApplyInstructor = () => {
    // Chuyển hướng đến trang đăng ký làm giảng viên
    navigate("/dashboard/new-apply-instructor");
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        List Register <span className="text-secondary">Instructor</span>
      </h2>

      {/* Hiển thị thông báo lỗi nếu có */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Hiển thị thông báo loading khi đang tải */}
      {loading ? (
        <p className="text-blue-500">Đang tải dữ liệu...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">Bạn chưa có đơn đăng ký nào.</p>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleApplyInstructor}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Register as a Instructor
            </button>
          </div>

          {requests.map((request) => (
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
                    <strong>Skills:</strong> {request.skills || "Chưa cập nhật"}
                  </p>
                  <p>
                    <strong>About:</strong>{" "}
                    {request.about || "Chưa có thông tin"}
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
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default AppliedApplications;
