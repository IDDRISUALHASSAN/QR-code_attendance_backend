import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import attendanceRouter from "./routes/attendanceRouter.js";
import dashboardRouter from "./routes/dashboardRouter.js";

app.use("/api/attendance", attendanceRouter);
app.use("/api/dashboard", dashboardRouter);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});