require("dotenv").config();

const teacherRoutes = require("./routes/teacherRoutes");
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use("/api/teacher", teacherRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "ExamPortal Backend is running!"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [result] = await db.query("SELECT DATABASE() AS db");

        res.json({
            success: true,
            message: "MySQL connected successfully!",
            database: result[0].db
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const studentRoutes = require("./routes/studentRoutes");
app.use("/api/student", studentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});