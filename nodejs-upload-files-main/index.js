require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { s3Uploadv2, find, deleteOne, downloadOne } = require("./s3Service");
const app = express();
app.use(express.json())

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(file.mimetype)
  if (file.mimetype.split("/")[0] === "image" || file.mimetype === "application/pdf" || file.mimetype === "application/zip") {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1000000000, files: 10 },
});
app.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const results = await s3Uploadv2(req.files);
    console.log(results);
    return res.json({ status: "success", "results": results });
  } catch (err) {
    console.log(err);
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "file is too large",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "File limit reached",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "File must be an image or pdf or zip file ",
      });
    }
  }
});

app.get("/getAll", async (req, res) => {
  try {

    const results = await find();
    return res.json(results);
  } catch (err) {
    console.log(err);
  }
});

app.delete("/deleteOne", async (req, res) => {
  try {
    const filename = req.body.filename;
    const key = `uploads/${filename}`
    const s = await deleteOne(key)
    res.send(s)
  } catch (err) {
    console.log(err)
  }
})

app.get("/downloadOne", async (req, res) => {
  try {
    const filename = req.body.filename;
    const key = `uploads/${filename}`
    const r = await downloadOne(key)
    console.log(r)
    res.send(r);
  } catch (err) {
    console.log(err)
  }
})

app.listen(4000, () => console.log("listening on port 4000"));
