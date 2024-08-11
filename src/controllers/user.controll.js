import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefereshTokens=async(userId)=>{
      try {
            const user=await User.findById(userId)
           const accessToken= user.generateAccessToken()
           const refreshToken= user.generateRefreshToken()
           user.refreshToken=refreshToken
          await user.save({validateBeforeSave:false})

           return {accessToken,refreshToken}
            
      } catch (error) {
            throw new ApiError(500,"something went wrong while generation refresh and access token");
      }
}

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
      username:username.toLowerCase(),
  });
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

const loginUser=asyncHandler(async (req,res)=>{
      const {username,email,password}=req.body

      if (!username || !email) {
            throw new ApiError(400,"username or email is required")            
      }
    const user=User.findOne({
            $or:[{username},{email}]
      })
      if (!user) {
            throw new ApiError(404,"User does not exist");
      }
     const isPasswordValid=await user.isPasswordCorrect(password)
     if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials")
     }

    const {accessToken,refreshToken}= await generateAccessAndRefereshTokens(user._id);
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
      httpOnly:true,
      secure:true,
    };
    return res
    .status(200).
    cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
            200,
            {
                  user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
      )
    )
})

const logOutUser=asyncHandler(async (req,res)=>{
   await User.findByIdAndUpdate(
            req.User._id,{
                  $set:{
                        refreshToken:undefined
                  }
            },
            {
               new:true
            }
      )
      const options={
            httpOnly:true,
            secure:true
      }

      return res.status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"User logged Out"))
});

const refreshAccessToken=asyncHandler(async(req,res)=>{
     const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken
     if (!incomingRefreshToken) {
      throw new ApiError(401,"Unauthorized request");
     }
   try {
       const decodedToken= jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET)
      const user=await User.findById(decodedToken?._id);
   
      if (!user) {
         throw new ApiError(401,"Invalid refresh token");
      }
      if (incomingRefreshToken !=user?.refreshToken) {
         throw new ApiError(401,"Refresh token is expired or used");      
      }
   
      const options ={
         httpOnly:true,
         secure:true
      }
     const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id)
     return res
     .status(200)
     .cookie("accssToken",accessToken)
     .cookie("refereshToken",newRefreshToken)
     .json(
         new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed")
     )
   } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token");
   }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
      const {oldPassword,newPassword}=req.body;
      const user= User.findById(req.user?._id);
     const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
     if (!isPasswordCorrect) {
      throw new ApiError(400,"Invalid old password")
     }
     user.password=newPassword
     user.save({validateBeforeSave:false})

     return res
     .status(200)
     .json(new ApiResponse(200,{},"password changed successful"))

})
     const getCurrentUser=asyncHandler(async(req,res)=>{
      return res.status(200).json(200,req.user,"current user fetched successfully")
     
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
      const {fullname,email}=req.body
      if (!fullname || !email) {
            throw new ApiError(400,"All fields are required")
      }
     const user= User.findByIdAndUpdate(req.user?._id,{
      $set:{
            fullname,email:email
      }
     },{new:true}).select("-password")
     return res.status(200)
     .json(new ApiError(200,user,"Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
 const avatarLocalPath= req.files?.path
 if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is missing");
 }
const avatar= await uploadOnCloudinary(avatarLocalPath)

if (!avatar.url) {
      throw new ApiError(400,"Error while uploading on avatar");
}
const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
            $set:{
                  avatar:avatar.url
            }
      },
      {new:true}
).select("-password")
return res.status(200)
.json(
 new ApiResponse(200,user,"avatar updated successfully")
)
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
      const coverfImageLocalPath= req.file?.path
      if (!coverfImageLocalPath) {
           throw new ApiError(400,"coverimage file is missing");
      }
     const coverImage= await uploadOnCloudinary(coverfImageLocalPath)
     
     if (!coverImage.url) {
           throw new ApiError(400,"Error while uploading on coverImage");
     }
    const user= await User.findByIdAndUpdate(
           req.user?._id,
           {
                 $set:{
                       coverImage:coverImage.url
                 }
           },
           {new:true}
     ).select("-password")

     return res.status(200)
     .json(
      new ApiResponse(200,user,"cover image updated successfully")
     )
     })

export {registerUser,loginUser,logOutUser,refreshAccessToken,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage }