import { Router } from "express";
import {loginUser, registerUser,logOutUser,refreshAccessToken } from "../controllers/user.controll.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router=Router()

router.route("/register").post(
      upload.fields([

          {  name:"avatar",
            maxCount:1
          },
          {
            name:"coverImage",
            maxCount:1
          }

      ]),
      registerUser)

      router.route("/login").post(loginUser)
      //secure route
      router.route("/logout").post(verifyJWT, logOutUser)
      router.route("/refresh-token").post(refreshAccessToken)
      

export default router