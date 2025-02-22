require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

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
        console.log("Connected to MongoDB!");

        const database = client.db("TaskFlow");
        const tasksCollection = database.collection("TaskCollection");

        app.get("/tasks", async (req, res) => {
            try {
                const tasks = await tasksCollection.find().toArray();
                res.send(tasks);
            } catch (error) {
                res.status(500).send({ message: "Error fetching tasks", success: false });
            }
        });

        app.post("/tasks", async (req, res) => {
            try {
                const task = req.body;
                const result = await tasksCollection.insertOne(task);
                res.send({ message: "Task added successfully", success: true, insertedId: result.insertedId });
            } catch (error) {
                res.status(500).send({ message: "Error adding task", success: false });
            }
        });

        // Update task (title, description, and status)
        app.put("/tasks/:id", async (req, res) => {
            const id = req.params.id;
            const { title, description, status } = req.body;

            // Validate the ID
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid task ID", success: false });
            }

            // Ensure at least one field is provided for update
            if (!title && !description && !status) {
                return res.status(400).send({
                    message: "At least one field (title, description, or status) is required.",
                    success: false,
                });
            }

            // Only update provided fields
            const updateFields = {};
            if (title) updateFields.title = title;
            if (description) updateFields.description = description;
            if (status) updateFields.status = status;

            try {
                const result = await tasksCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateFields }
                );

                if (result.modifiedCount > 0) {
                    res.send({ message: "Task updated successfully", success: true });
                } else {
                    res.send({ message: "Task not found or no changes made", success: false });
                }
            } catch (error) {
                console.error("Error updating task:", error);
                res.status(500).send({ message: "Error updating task", success: false });
            }
        });

        app.delete("/tasks/:id", async (req, res) => {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid task ID", success: false });
            }

            try {
                const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount > 0) {
                    res.send({ message: "Task deleted successfully", success: true });
                } else {
                    res.status(404).send({ message: "Task not found", success: false });
                }
            } catch (error) {
                res.status(500).send({ message: "Error deleting task", success: false });
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
