import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useUser from "../../../../hooks/useUser";

const NewAppliedInstructor = () => {
  const { currentUser } = useUser();
  const Navigate = useNavigate();
  const [formData, setFormData] = useState({
    photoUrl: "",
    name: "",
    email: "",
    address: "",
    phone: "",
    skills: "",
    about: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/ass-instrustor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.insertedId) {
        toast.success(
          "🎉 Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm."
        ),
          setFormData({
            photoUrl: "",
            name: "",
            email: "",
            address: "",
            phone: "",
            skills: "",
            about: "",
          });
        Navigate("/dashboard/apply-instructor");
      } else {
        setMessage("Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Lỗi kết nối server, vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/user/${encodeURIComponent(currentUser.email)}`
        );

        const data = await response.json();
        console.log(`http://localhost:3000/users/${currentUser?.email}`);
        // nếu dữ liệu hợp lệ thì gán vào formData
        if (data) {
          setFormData({
            photoUrl: data.photoUrl || "",
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            phone: data.phone || "",
            skills: data.skills || "",
            about: data.about || "",
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 ">
      <div className="  bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Register <span className="text-secondary">Instructor</span>
        </h2>

        {message && <p className="text-center text-green-600">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 ">
          <div>
            <label className="block text-gray-700">Url Img</label>
            <input
              type="text"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
              placeholder="Nhập đường dẫn ảnh đại diện của bạn"
            />
          </div>

          <div>
            <label className="block text-gray-700">Họ và tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
              placeholder="Nhập họ tên của bạn"
            />
          </div>

          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              disabled
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
              placeholder="Email liên hệ"
            />
          </div>

          <div>
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
              placeholder="Địa chỉ"
            />
          </div>

          <div>
            <label className="block text-gray-700">Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
              placeholder="Số điện thoại của bạn"
            />
          </div>

          <div>
            <label className="block text-gray-700">Chuyên môn</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
              placeholder="Nhập chuyên môn của bạn"
            />
          </div>

          <div>
            <label className="block text-gray-700">Giới thiệu bản thân</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              rows="3"
              className="w-full mt-1 p-2 border rounded"
              placeholder="Bạn hãy giới thiệu đôi nét về bản thân nhé!"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
          >
            Gửi đăng ký
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewAppliedInstructor;
