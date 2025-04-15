const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
// const saltRounds = 10;
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMEN_SECRET);
var jwt = require("jsonwebtoken");

const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors());

// conect mongodb

const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  Transaction,
} = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cbn97.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // create a dabase and collection
    const database = client.db("study");
    const usersCollections = database.collection("users");
    const classesCollections = database.collection("classes");
    const cartCollections = database.collection("cart");
    const paymentCollections = database.collection("payment");
    const errolledCollections = database.collection("errolled");
    const appliedCollection = database.collection("applied");
    const settingSEOCollection = database.collection("seoSettings");

    // verify token
    const verifyJWT = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Invalid authorization" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Invalid token" });
        }
        req.decode = decoded; // Chuyển thông tin người dùng vào req.decode
        next();
      });
    };

    // Admin middleware cho admin và instructor
    const verifyAdmin = async (req, res, next) => {
      const email = req.decode?.email; // Kiểm tra xem decode đã được gán chưa
      if (!email) {
        return res.status(400).send({ message: "No user found in token" });
      }
      try {
        const user = await usersCollections.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        if (user.role === "admin") {
          next();
        } else {
          return res.status(403).send({ message: "Access forbidden" });
        }
      } catch (err) {
        return res.status(500).send({ message: "Server error" });
      }
    };

    const verifyInstrustor = async (req, res, next) => {
      const email = req.decode.email;
      const query = { email: email };
      const user = await usersCollections.findOne(query);
      if (user && user.role === "instrustor") {
        next();
      } else {
        return res.status(401).send({ message: "Not Access" });
      }
    };

    // ROUTER setting SEO
    // Lấy SEO info theo slug
    // GET tất cả site settings
    app.get("/site-settings", async (req, res) => {
      const settings = await settingSEOCollection.findOne();
      res.json(settings);
    });

    // PUT cập nhật site settings
    app.put("/site-settings", async (req, res) => {
      const updatedData = req.body;

      delete updatedData._id;

      // Cập nhật tài liệu với toán tử $set
      const settings = await settingSEOCollection.findOneAndUpdate(
        {}, // Điều kiện tìm tài liệu
        { $set: updatedData }, // Dùng $set để cập nhật dữ liệu
        { new: true } // Tùy chọn: trả về tài liệu mới sau khi cập nhật
      );

      if (!settings) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy tài liệu để cập nhật." });
      }

      res.json(settings); // Trả lại dữ liệu đã cập nhật
    });

    // routers for users
    app.post("/api/set-token", async (req, res) => {
      const user = req.body;
      const secretKey = process.env.ACCESS_SECRET || "mySuperSecretKey";
      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: "1h" });

      res.send(token);
    });
    app.post("/new-user", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollections.insertOne(newUser);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollections.find().toArray();
      res.send(result);
    });

    app.get("/user/:identifier", async (req, res) => {
      const identifier = req.params.identifier;

      let query = {};
      if (ObjectId.isValid(identifier)) {
        // Nếu là ObjectId hợp lệ => Tìm theo ID
        query = { _id: new ObjectId(identifier) };
      } else {
        // Nếu không phải ObjectId => Tìm theo email
        query = { email: identifier };
      }

      try {
        const user = await usersCollections.findOne(query);
        if (!user) {
          return res.status(404).send("User not found");
        }
        res.send(user);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });

    //router get /users by ID
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format");
      }
      const query = { _id: new ObjectId(id) };

      const result = await usersCollections.findOne(query);
      res.send(result);
    });

    //router get /user by email v1
    // app.get("/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email: email };
    //   const result = await usersCollections.findOne(query);
    //   res.send(result);
    // });

    //router get /user by email v1
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      try {
        const result = await usersCollections.findOne(query);
        console.log(result);

        if (!result) {
          return res.status(404).json({ message: "User not found" });
        }

        // Trả về tất cả các trường cần thiết
        const userData = {
          name: result.name,
          email: result.email,
          photoUrl: result.photoUrl,
          gender: result.gender,
          phone: result.phone,
          address: result.address,
          skills: result.skills,
          about: result.about,
          createdAt: result.createdAt,
        };

        res.json(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.delete("/delete-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollections.deleteOne(query);
      res.send(result);
    });
    // , verifyJWT, verifyAdmin,
    app.put("/update-user/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;

      console.log("Received data:", updateUser); // Kiểm tra dữ liệu từ frontend

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updateUser.name,
          email: updateUser.email,
          password: updateUser.password,
          role: updateUser.role || updateUser.option, // Kiểm tra nếu updateUser.role có giá trị hợp lệ
          address: updateUser.address,
          about: updateUser.about,
          photoUrl: updateUser.photoUrl,
          skills: updateUser.skills ? updateUser.skills : null,
        },
      };

      const result = await usersCollections.updateOne(
        filter,
        updateDoc,
        { returnDocument: "after" },
        options
      );
      console.log("MongoDB update result:", result); // Kiểm tra phản hồi từ MongoDB

      res.send(result);
    });

    // classes router
    app.post("/new-class", async (req, res) => {
      const newClass = req.body;
      newClass.availiableSeats = parseInt(newClass.availiableSeats);
      const result = await classesCollections.insertOne(newClass);
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollections.find(query).toArray();
      res.send(result);
    });

    //classes by email
    app.get(
      "/classes/:email",
      // verifyJWT,
      // verifyInstrustor,
      async (req, res) => {
        const email = req.params.email;
        const query = { instructorEmail: email };
        const result = await classesCollections.find(query).toArray();
        res.send(result);
      }
    );

    //manage classes
    app.get("/manage-classes", async (req, res) => {
      const result = await classesCollections.find().toArray();
      res.send(result);
    });

    // update classes status and reason
    app.put(
      "/change-status/:id",
      // verifyJWT,
      // verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const status = req.body.status;
        const reason = req.body.reson;
        const filter = { _id: new ObjectId(id) };
        const otions = { upsert: true };
        const updateDoc = {
          $set: {
            status: status,
            reason: reason,
          },
        };
        const result = await classesCollections.updateOne(
          filter,
          updateDoc,
          otions
        );
        res.send(result);
      }
    );

    // get approved classes
    app.get("/approved-classes", async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollections.find(query).toArray();
      res.send(result);
    });

    // get signle class details
    app.get("/class/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollections.findOne(query);
      res.send(result);
    });

    // update class detail
    // app.put(
    //   "/update-class/:id",
    //   verifyJWT,
    //   verifyInstrustor,
    //   async (req, res) => {
    //     const id = req.params.id;
    //     const updateClass = req.body;
    //     const filter = { _id: new ObjectId(id) };
    //     const options = { upsert: true };
    //     const updateDoc = {
    //       $set: {
    //         name: updateClass.name,
    //         description: updateClass.description,
    //         price: updateClass.price,
    //         availableSeats: updateClass.availableSeats,
    //         videoLink: updateClass.videoLink,
    //         status: "pending",
    //       },
    //     };
    //     const result = await classesCollections.updateOne(
    //       filter,
    //       updateDoc,
    //       options
    //     );
    //     res.send(result);
    //   }
    // );

    app.put(
      "/update-class/:id",
      // verifyJWT,
      // verifyInstrustor,
      async (req, res) => {
        try {
          const id = req.params.id;
          const updateClass = req.body;
          const filter = { _id: new ObjectId(id) };

          const updateDoc = {
            $set: {
              name: updateClass.name,
              description: updateClass.description,
              price: updateClass.price,
              availableSeats: updateClass.availableSeats, // Sửa chính tả
              videoLink: updateClass.videoLink,
              image: updateClass.image, // Cập nhật ảnh nếu có
              status: "pending",
            },
          };

          const result = await classesCollections.updateOne(filter, updateDoc);

          if (result.modifiedCount > 0) {
            res.json({ success: true, message: "Class updated successfully!" });
          } else {
            res.json({ success: false, message: "No changes detected!" });
          }
        } catch (error) {
          console.error("Error updating class:", error);
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }
      }
    );

    // xóa classes
    app.delete("/delete-classes/:id", async (req, res) => {
      try {
        const classId = req.params.id;
        const filter = { _id: new ObjectId(classId) };

        const result = await classesCollections.deleteOne(filter);

        if (result.deletedCount > 0) {
          res.json({ success: true, message: "Class deleted successfully!" });
        } else {
          res.status(404).json({ success: false, message: "Class not found!" });
        }
      } catch (error) {
        console.error("Error deleting class:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    // cart Router
    app.post("/add-to-cart", verifyJWT, async (req, res) => {
      const newCartItems = req.body;
      const result = await cartCollections.insertOne(newCartItems);
      res.send(result);
    });

    // get cart items by id
    app.get("/cart-item/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = {
        classId: id,
        UserMail: email,
      };
      const projection = { classId: 1 };
      const result = await cartCollections.findOne(query, {
        projection: projection,
      });
      res.send(result);
    });

    // get info cart items by  users email
    // app.get("/cart/:email", verifyJWT, async (req, res) => {
    //   const email = req.params.email;
    //   const query = { UseMail: email };
    //   const projection = { classId: 1 };
    //   const carts = await cartCollections.findOne(query, {
    //     projection: projection,
    //   });
    //   // const classIds = carts?.map((cart) => new ObjectId(cart.classId));
    //   // const query2 = { _id: { $in: classIds } };
    //   // const result2 = await classesCollections.find(query2).toArray();
    //   // res.send(result2);
    //   const classIds = carts?.map((cart) => cart.classId).filter((id) => id); // Lọc ra id hợp lệ

    //   // Đảm bảo classIds là mảng trước khi query
    //   if (!Array.isArray(classIds) || classIds.length === 0) {
    //     return res.send([]);
    //   }

    //   // Convert to ObjectId
    //   const objectIds = classIds.map((id) => new ObjectId(id));

    //   const query2 = { _id: { $in: objectIds } };
    //   const result2 = await classesCollections.find(query2).toArray();
    //   res.send(result2);
    // });

    app.get("/cart/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { useMail: email }; // Dùng userEmail thay vì useMail
      const projection = { classId: 1 };

      const carts = await cartCollections
        .find(query, {
          projection: projection,
        })
        .toArray(); // Lấy mảng thay vì findOne

      const classIds = carts.map((cart) => cart.classId).filter((id) => id); // Lọc id hợp lệ

      if (!Array.isArray(classIds) || classIds.length === 0) {
        return res.send([]);
      }

      // Convert to ObjectId
      const objectIds = classIds.map((id) => new ObjectId(id));

      const query2 = { _id: { $in: objectIds } };
      const result2 = await classesCollections.find(query2).toArray();
      res.send(result2);
    });

    // delete cart item
    app.delete("/delete-cart-item/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollections.deleteOne(query);
      res.send(result);
    });

    // payment router
    // app.post("/create-payment-intent", async (req, res) => {
    //   const { price } = req.body;
    //   const amount = parseInt(price) * 100;
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types: ["card"],
    //   });
    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { price } = req.body;
        if (!price || isNaN(price)) {
          return res.status(400).send({ error: "Invalid price value" });
        }

        const amount = parseInt(price) * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        console.log(
          "🔥 Client Secret gửi về frontend:",
          paymentIntent.client_secret
        );

        // console.log("🔥 Tạo Payment Intent thành công:", paymentIntent.id);
        // console.log(
        //   "🔥 Client Secret gửi về frontend:",
        //   paymentIntent.client_secret
        // );
        // console.log("PaymentIntent Created:", paymentIntent.id);
        // console.log("Client Secret:", paymentIntent.client_secret);
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // post payment info to db
    app.post("/payment-info", async (req, res) => {
      const paymentInfo = req.body;
      const classId = paymentInfo.classId;
      const userEmail = paymentInfo.email;
      const signClassId = req.body.classId;
      let query;
      if (signClassId) {
        query = { classId: signClassId, userEmail: userEmail };
      } else {
        query = { classId: { $in: classId } };
      }
      const classesQuery = {
        _id: { $in: classId.map((id) => new ObjectId(id)) },
      };
      const classes = await classesCollections.find(classesQuery).toArray();
      const newErrolledData = {
        userEmail: userEmail,
        classId: signClassId.map((id) => new ObjectId(id)),
        transactionId: paymentInfo.transactionId,
      };
      const updateDoc = {
        $set: {
          totalErrolled:
            classId.reduce(
              (total, current) => total + current.totalErrolled,
              0
            ) + 1 || 0,
          totalErrolled:
            classId.reduce(
              (total, current) => total + current.totalErrolled,
              0
            ) - 1 || 0,
        },
      };
      const updateResult = await classesCollections.updateMany(
        classesQuery,
        updateDoc,
        { upsert: true }
      );
      const errolledResult = await errolledCollections.insertOne(
        newErrolledData
      );
      const deleteResult = await cartCollections.deleteMany(query);
      const paymentResult = await paymentCollections.insertOne(paymentInfo);
      res.send(paymentResult, deleteResult, errolledResult, updateResult);
    });

    // get payment history
    app.get("/payment-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await paymentCollections
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    // get payment history length
    app.get("/payment-history-length/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const total = await paymentCollections.countDocuments(query);
      res.send(total);
    });

    // ErrolledPayment routers
    app.get("/popular-classes", async (req, res) => {
      const result = await classesCollections
        .find()
        .sort({ totalErrolled: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    app.get("/popular-instructors", async (req, res) => {
      try {
        // const allClasses = await usersCollections.find({}).toArray();
        // console.log("Classes Data:", allClasses);

        const pipeline = [
          // {
          //   $match: {
          //     instructorEmail: { $exists: true, $ne: null },
          //     totalEnrolled: { $exists: true, $ne: null },
          //   },
          // },
          {
            $group: {
              _id: "$instructorEmail",
              totalEnrolled: { $sum: "$totalEnrolled" },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "email",
              as: "instructor",
            },
          },
          {
            $project: {
              _id: 0,
              instructor: { $arrayElemAt: ["$instructor", 0] }, // Lấy object instructor đầu tiên từ mảng
              totalEnrolled: 1,
            },
          },
          {
            $sort: { totalEnrolled: -1 },
          },
          {
            $limit: 6,
          },
        ];

        const result = await classesCollections.aggregate(pipeline).toArray();
        console.log("Popular Instructors:", result);
        res.send(result);
      } catch (error) {
        console.error("Error fetching popular instructors:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    //admin status
    app.get("/admin-stats", async (req, res) => {
      const approvedClasses = (
        await (await classesCollections.find({ status: "approved" })).toArray()
      ).length;
      const pendingClasses = (
        await (await classesCollections.find({ status: "pending" })).toArray()
      ).length;
      const instructorsList = await usersCollections
        .find({ role: "instructor" })
        .toArray();
      console.log("Instructors:", instructorsList);
      const instructorCount = instructorsList.length;

      const totalClasses = (await (await classesCollections.find()).toArray())
        .length;
      const totalEnrolled = (await (await errolledCollections.find()).toArray())
        .length;

      const result = {
        approvedClasses,
        pendingClasses,
        instructorCount,
        totalClasses,
        totalEnrolled,
      };
      res.send(result);
    });

    //admin manage cart
    app.get("/api/manage-cart", async (req, res) => {
      try {
        // Tìm tất cả các user đã có lớp học trong cart của họ
        const usersWithClassesInCart = await database
          .collection("cart")
          .aggregate([
            {
              $lookup: {
                from: "users", // collection users
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
              },
            },
            {
              $unwind: "$userDetails",
            },
            {
              $project: {
                "userDetails.email": 1,
                "userDetails.username": 1,
                // các field khác bạn cần
              },
            },
          ])
          .toArray();

        res.json(usersWithClassesInCart); // Trả dữ liệu về cho client
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Lỗi khi lấy dữ liệu" });
      }
    });

    // get all intrustors
    app.get("/instructors", async (req, res) => {
      const result = await usersCollections
        .find({ role: "instructor" })
        .toArray();
      res.send(result);
    });

    app.get("/enrolled-classes/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      console.log("Email nhận vào:", email);
      console.log("Truy vấn MongoDB:", query);
      const pipeline = [
        {
          $match: query,
        },
        {
          $lookup: {
            from: "classes",
            localField: "classId",
            foreignField: "_id",
            as: "classes",
          },
        },
        {
          $unwind: "$classes",
        },
        {
          $lookup: {
            from: "users",
            localField: "classes.instrustorEmail",
            foreignField: "email",
            as: "intrustor",
          },
        },
        {
          $project: {
            _id: 0,
            intrustor: {
              $arrayElemAt: ["$intrustor", 0],
            },
            class: 1,
          },
        },
      ];

      const result = await errolledCollections.aggregate(pipeline).toArray();
      res.send(result);
    });

    // API để lấy tất cả các đơn đăng ký của người dùng theo email
    app.get("/applied-instrustion/user/:email", async (req, res) => {
      const { email } = req.params;

      try {
        const applications = await appliedCollection
          .find({ email: email })
          .toArray();
        res.status(200).json(applications);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ message: "Có lỗi xảy ra khi lấy danh sách đơn." });
      }
    });
    // get all applied instructor
    app.get("/applied-instrustion/all", async (req, res) => {
      try {
        const result = await appliedCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Lỗi khi lấy danh sách instructor" });
      }
    });

    // appliend for instrustors
    app.post("/ass-instrustor", async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    });

    app.get("/applied-instrustion/:email", async (req, res) => {
      const email = req.params.email;
      const result = await appliedCollection.findOne({ email });
      res.send(result);
    });

    // Update status của instructor application
    app.patch("/promote-to-instructor/:email", async (req, res) => {
      const email = req.params.email;

      try {
        const result = await usersCollections.updateOne(
          { email: { $regex: `^${email}$`, $options: "i" } }, // khớp không phân biệt hoa thường
          { $set: { role: "instructor" } }
        );

        console.log("Update result:", result);

        if (result.modifiedCount === 0) {
          console.log("❌ Không tìm thấy user có email:", email);
          return res
            .status(404)
            .send({ message: "Không tìm thấy user hoặc role không thay đổi" });
        }

        res.send({ message: "Cập nhật role thành công", result });
      } catch (err) {
        console.error("❌ Lỗi khi cập nhật role:", err);
        res.status(500).send({ error: "Lỗi server khi cập nhật role" });
      }
    });

    app.patch("/deny-instructor/:email", async (req, res) => {
      const email = req.params.email;

      try {
        const result = await usersCollections.updateOne(
          { email: { $regex: `^${email}$`, $options: "i" } },
          { $set: { role: "user" } }
        );
        // console.log("Đang từ chối quyền của email:", email);
        // console.log("Email khi deny:", req.params.email);
        // console.log("Reset role result:", result);

        if (result.modifiedCount === 0) {
          return res.status(200).send({
            message: "Quyền đã là 'user', không cần thay đổi thêm",
            alreadyUser: true,
          });
        }

        res.send({ message: "Đã từ chối và reset quyền thành công", result });
      } catch (err) {
        console.error("Lỗi khi reset role:", err);
        res.status(500).send({ error: "Lỗi server khi reset role" });
      }
    });

    app.patch("/update-instructor-status/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      // Tìm bản ghi hiện tại để so sánh trạng thái
      const currentRequest = await appliedCollection.findOne({
        _id: new ObjectId(id),
      });

      if (currentRequest.status === status) {
        return res.send({ message: "Trạng thái không thay đổi." });
      }

      const result = await appliedCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      res.send(result);
    });

    // router Change Pass

    app.post("/change-password", async (req, res) => {
      try {
        const { email, oldPassword, newPassword } = req.body;
        console.log("Data nhận được: ", req.body);

        // Kiểm tra xem có tất cả các trường cần thiết không
        if (!email || !oldPassword || !newPassword) {
          return res.status(400).json({ message: "Thiếu thông tin yêu cầu." });
        }

        // Tìm user trong database theo email
        const user = await usersCollections.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại." });
        }

        // Kiểm tra mật khẩu cũ: So sánh mật khẩu cũ với password đã hash trong cơ sở dữ liệu
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
          return res
            .status(400)
            .json({ message: "Mật khẩu cũ không chính xác." });
        }

        // Mật khẩu cũ đúng, tiến hành băm mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        console.log("Mật khẩu mới được băm: ", hashedNewPassword);

        // Cập nhật mật khẩu mới vào cơ sở dữ liệu
        await usersCollections.updateOne(
          { email },
          { $set: { password: hashedNewPassword } }
        );

        res.json({ message: "Đổi mật khẩu thành công!" });
      } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//run server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
