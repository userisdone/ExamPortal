
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER STUDENT
exports.register = async (req, res) => {
    try {
        const { full_name, email, password, course_id, current_sem } = req.body;

        if (!full_name || !email || !password || !course_id || !current_sem) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        const [existing] = await db.query(
            "SELECT user_id FROM Users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [userResult] = await connection.query(
                `INSERT INTO Users (full_name, email, password_hash, role)
                 VALUES (?, ?, ?, 'STUDENT')`,
                [full_name, email, hashedPassword]
            );

            await connection.query(
                `INSERT INTO Student (user_id, course_id, current_sem)
                 VALUES (?, ?, ?)`,
                [userResult.insertId, course_id, current_sem]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: "Student registered successfully"
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [users] = await db.query(
            `SELECT user_id, full_name, email, password_hash, role
             FROM Users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};
