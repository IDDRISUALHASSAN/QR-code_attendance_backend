import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import courseRouter from "./routes/courseRouter.js";
import courseAssignmentRouter from "./routes/courseAssignmentRouter.js";
import userRouter from "./routes/userRouter.js";
import attendanceSessionRouter from "./routes/attendanceSessionRouter.js";
import lecturerRouter from "./routes/lecturerRouter.js";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Attendance Management API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRouter);
app.use("/api/course-assignments", courseAssignmentRouter);
app.use("/api/users", userRouter);
app.use("/api/attendance-sessions", attendanceSessionRouter);
app.use("/api/lecturers", lecturerRouter );





export default app;