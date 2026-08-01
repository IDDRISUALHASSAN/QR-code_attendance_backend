import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import attendanceRouter from "./routes/attendanceRouter.js";

app.use("/api/attendance", attendanceRouter);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});