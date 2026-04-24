import express from "express";

const app = express();
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Webhook route
app.post("/webhook", (req, res) => {
  console.log("Webhook received!");
  //console.log(JSON.stringify(req.body, null, 2));

  res.send("OK");
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
