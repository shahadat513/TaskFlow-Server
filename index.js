require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aqw27.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const database = client.db("TaskFlow");
        const usersCollection = database.collection("User");
        const tasksCollection = database.collection("TaskCollection");

        // Save user to database
        app.post("/user", async (req, res) => {
            const user = req.body;
            const existingUser = await usersCollection.findOne({ email: user.email });

            if (existingUser) {
                return res.send({ message: "User already exists", success: false });
            }

            const result = await usersCollection.insertOne(user);
            res.send({ message: "User added successfully", success: true, result });
        });

        // Get all tasks
        app.get("/tasks", async (req, res) => {
            const tasks = await tasksCollection.find().toArray();
            res.send(tasks);
        });

        // Add new task
        app.post("/tasks", async (req, res) => {
            const task = req.body;
            const result = await tasksCollection.insertOne(task);
            res.send({ message: "Task added successfully", success: true, insertedId: result.insertedId });
        });

        // Update task status
        app.patch("/tasks/:id", async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;

            const result = await tasksCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status } }
            );

            if (result.modifiedCount > 0) {
                res.send({ message: "Task updated successfully", success: true });
            } else {
                res.send({ message: "Task not found or no changes made", success: false });
            }
        });

        // Delete task
        app.delete("/tasks/:id", async (req, res) => {
            const id = req.params.id;

            const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount > 0) {
                res.send({ message: "Task deleted successfully", success: true });
            } else {
                res.send({ message: "Task not found", success: false });
            }
        });

    } catch (error) {
        console.error("Database connection error:", error);
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("TaskFlow Backend is Running!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
