const User =
  require("../models/User");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

/* =========================
   GENERATE JWT
========================= */

const generateToken = (id) => {

  return jwt.sign(

    { id },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d"
    }

  );

};

/* =========================
   REGISTER USER
========================= */

const registerUser =
  async (req, res) => {

    try {

      const {
        username,
        email,
        password
      } = req.body;

      /* CHECK EXISTING */

      const existingUser =
        await User.findOne({
          email
        });

      if (existingUser) {

        return res.status(400)
          .json({
            message:
              "User already exists"
          });

      }

      /* HASH PASSWORD */

      const salt =
        await bcrypt.genSalt(10);

      const hashedPassword =
        await bcrypt.hash(
          password,
          salt
        );

      /* CREATE USER */

      const user =
        await User.create({

          username,

          email,

          password:
            hashedPassword

        });

      /* RESPONSE */

      res.status(201).json({

        _id: user._id,

        username:
          user.username,

        email:
          user.email,

        token:
          generateToken(
            user._id
          )

      });

    }

    catch (error) {

      res.status(500).json({

        message:
          "Registration failed",

        error:
          error.message

      });

    }

};

/* =========================
   LOGIN USER
========================= */

const loginUser =
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      /* FIND USER */

      const user =
        await User.findOne({
          email
        });

      if (!user) {

        return res.status(400)
          .json({
            message:
              "Invalid credentials"
          });

      }

      /* CHECK PASSWORD */

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {

        return res.status(400)
          .json({
            message:
              "Invalid credentials"
          });

      }

      /* RESPONSE */

      res.status(200).json({

        _id: user._id,

        username:
          user.username,

        email:
          user.email,

        token:
          generateToken(
            user._id
          )

      });

    }

    catch (error) {

      res.status(500).json({

        message:
          "Login failed",

        error:
          error.message

      });

    }

};

module.exports = {

  registerUser,

  loginUser

};