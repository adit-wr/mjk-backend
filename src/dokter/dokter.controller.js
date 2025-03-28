const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const Dokter = require("./dokter.model");

router.post("/create", async (req, res, next) => {
  try {
    const {
      nama_dokter,
      username_dokter,
      password_dokter,
      email_dokter,
      spesialis_dokter,
      notlp_dokter,
      str_dokter,
      rating_dokter,
      foto_profil_dokter,
    } = req.body;

    if (await Dokter.exists({ username_dokter })) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    if (await Dokter.exists({ str_dokter })) {
      return res.status(400).json({ message: "STR sudah terdaftar" });
    }

    if (await Dokter.exists({ email_dokter })) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password_dokter, 10);
    const newDokter = new Dokter({
      nama_dokter,
      username_dokter,
      password_dokter: hashedPassword,
      email_dokter,
      spesialis_dokter,
      notlp_dokter,
      str_dokter,
      rating_dokter: rating_dokter >= 0 && rating_dokter <= 5 ? rating_dokter : 0,
      foto_profil_dokter,
    });

    await newDokter.save();
    res.status(201).json({ message: "Dokter berhasil didaftarkan", dokter: newDokter });
  } catch (e) {
    next(e);
  }
});

router.get("/getall", async (req, res, next) => {
  try {
    const dokterList = await Dokter.find().select("-password_dokter");
    res.status(200).json(dokterList);
  } catch (e) {
    next(e);
  }
});

router.get("/getbyid/:id", async (req, res, next) => {
  try {
    const dokter = await Dokter.findById(req.params.id).select("-password_dokter");
    if (!dokter) {
      return res.status(404).json({ message: "Dokter tidak ditemukan" });
    }
    res.status(200).json(dokter);
  } catch (e) {
    next(e);
  }
});

router.patch("/update/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { str_dokter, password_dokter, rating_dokter } = req.body;

    if (!(await Dokter.exists({ _id: id }))) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    if (username_dokter) {
        const usernameExist = await masyarakat.exists({ username_dokter, _id: { $ne: id } });
        if (usernameExist) { return res.status(400).json({ message: "Username sudah terdaftar oleh pengguna lain." }) }
    }

    if (str_dokter) {
      const strExist = await Dokter.exists({ str_dokter, _id: { $ne: id } });
      if (strExist) { return res.status(400).json({ message: "STR sudah terdaftar oleh pengguna lain." }) }
    }    

    if (email_dokter) {
      const emailExist = await Dokter.exists({ email_dokter, _id: { $ne: id } });
      if (emailExist) { return res.status(400).json({ message: "Email sudah terdaftar oleh pengguna lain." }) }
    }    

    if (password_dokter) {
      req.body.password_dokter = await bcrypt.hash(password_dokter, 10);
    }
    
    if (rating_dokter) {
      req.body.rating_dokter = rating_dokter >= 0 && rating_dokter <= 5 ? rating_dokter : 0
    }

    const updatedDokter = await Dokter.findByIdAndUpdate(id, req.body, { new: true }).select("-password_dokter");
    res.status(200).json(updatedDokter);
  } catch (e) {
    next(e);
  }
});

router.delete("/delete/:id", async (req, res, next) => {
  try {
    const deletedDokter = await Dokter.findByIdAndDelete(req.params.id);
    if (!deletedDokter) {
      return res.status(404).json({ message: "Dokter tidak ditemukan" });
    }
    res.status(200).json({ message: "Dokter berhasil dihapus" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
