const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

const thunderPokt = require("./routes/api/thunderPokt");

var corsOptions = {
    origin: "*",
};
// Bodyparser middleware
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => {    
    console.log("MongoDB successfully connected ...");
})
.catch(err => console.log(err));

app.use("/thunderpokt", thunderPokt);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server runing on port ${PORT}`));