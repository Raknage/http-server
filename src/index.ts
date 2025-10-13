import express from "express";

const app = express();
const PORT = 8080;

app.use(express.static("."));

app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
