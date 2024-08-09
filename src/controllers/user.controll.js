import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async (req,res)=>{
      const {username,email,fullname,password}=req.body
      console.log("email: ",email);

      if ([fullname,username,email,password].some((field)=> field?.trim()==="")) {
            throw new ApiError(400, "All fields are required")     
      }
  const existedUser=await User.findOne({
            $or:[{username},{email}]
      })
      if(existedUser){
            throw new ApiError(409," email or username is Already exists")
      }
//     const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverfImageLocalPath=req.files?.coverImage[0]?.path;
//     if (!avatarLocalPath) {
//       throw new ApiError(400,"Avatar file is require")
//     }
//    const avatar=await uploadOnCloudinary(avatarLocalPath)

  const coverImage=await uploadOnCloudinary(coverfImageLocalPath)

//   if (!avatar) {
//       throw new ApiError(400,"Avatar file is require"); 
//   }

  const user=await User.create({
      fullname,
      // avatar:avatar.url,
     
      coverImage:coverImage?.url|| "",
      email,
      password,
      username:username.toLowerCase()
  })
 const createUser=await User.findById(user._id).select(
      "-password -refreshToken"
 );
 if (!createUser) {
      throw new ApiError(500,"something went wrong while registering the user")
 }

 return res.status(201).json(
      new ApiResponse(200,createUser,"user registered successfully")
 )
})
export {registerUser}