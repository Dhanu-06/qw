import express from "express"
import "dotenv/config"
import { connectDatabase } from "./infrastructure/database"
import surveyRoutes from "./presentation/surveyRoutes"
import cors from "cors"

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.use("/api/surveys", surveyRoutes)

app.get("/", (req, res) => {
  res.send("QW Survey API is running!")
})

async function startServer() {
  try {
    await connectDatabase()

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()