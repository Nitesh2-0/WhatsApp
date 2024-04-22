var express = require('express');
const passport = require('passport');
var router = express.Router();
const messageModel = require('./message')
const userModel = require('./users');
const localStrategy = require('passport-local');
const users = require('./users');
const path = require ('path')
const multer = require('multer');
passport.use(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/',  function(req, res, next) {
  res.redirect('/login')
});

// for file input 
router.get('/input',(req,res)=>{
  res.render('takeImageInput')
})

// Multer configuration

const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname,'../public/images'));
  },
  filename:function(req,file,cb){
    const name = Date.now() + "-"+file.originalname;
    cb(null,name)
  }
})

const upload = multer({ storage: storage });

router.post('/register', upload.single('profileImage'), async (req, res, next) => {
  try {
    let profileImage = '/images/mera.png'; 

    // Check if a file is uploaded
    if (req.file) {
      profileImage = req.file.filename; 
    }

    const newUser = {
      username: req.body.username,
      email: req.body.email,
      profileImage: profileImage, 
    };

    // Register the new user
    await userModel.register(newUser, req.body.password);

    // Authenticate the user and redirect to home upon successful registration
    passport.authenticate('local')(req, res, () => {
      res.redirect('/home');
    });
  } catch (err) {
    console.error(err.message);
    res.redirect('/login');
  }
});


/** Login Route */
router.post("/login",passport.authenticate("local",{
  successRedirect:"/home",
  failureRedirect:"/login"
}), function(req,res){});

/** isLoggedIn Middleware */
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

/** Logout */
router.get('/logout',function(req,res,next){
   if(req.isAuthenticated()){
    req.logout(function(err){
      if(err) {return next(err);} 
      res.redirect('/login');
    })
   }else{
    res.redirect('/')
   }
})

/** Routes */
router.get('/login',(req,res)=>{
  res.render('login');
})

router.get('/register',(req,res)=>{
  res.render('registration')
})

router.get('/home', isLoggedIn, async (req, res) => {
    const LoggedInUser = await userModel.findOne({ username: req.user.username }).populate('friends');
    res.render("home", {
      LoggedInUser,
    });
});

router.post('/searchUsers',isLoggedIn, async (req,res,next)=>{
  const data = req.body.data

  const allUsers = await userModel.find({
    username:{
      $regex:data,
      $options:'i'
    }
  })
  res.status(200).json(allUsers);
})

router.post('/addFriend', isLoggedIn, async (req, res, next) => {
  const friendId = req.body.friendId;

  try {
    const friendUser = await userModel.findOne({ _id: friendId });
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });

    if (!friendUser || !loggedInUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const indexOfFriendUser = loggedInUser.friends.indexOf(friendUser._id);
    if (indexOfFriendUser !== -1) {
      res.status(200).json({ message: 'Already friends' });
      return;
    }

    loggedInUser.friends.push(friendUser._id);
    friendUser.friends.push(loggedInUser._id);

    await loggedInUser.save();
    await friendUser.save();

    res.status(200).json({ message: "Friend added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/getMgessage", isLoggedIn, async (req,res,next)=>{
  const chats = await messageModel.find({
    $or:[
      {
        sender : req.user.username, 
        receiver: req.body. oppositeUser
      },
      {
        sender:req.body. oppositeUser , 
        receiver:req.user.username
      }
    ]
  })
  res.status(200).json(chats);
})


router.get('/profileImage', async (req, res) => {
  try {
    const username = req.query.username; 
    const user = await userModel.findOne({ username: username }); 
    if (!user) {
      return res.status(404).send("User not found");
    }
  
    res.render('viewProfileImage', { profileImage: user.profileImage });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// router.get('/user/removeImage', isLoggedIn ,async (req, res) => {
//   try {

//     const user = await userModel.findOne({username:req.user.username});
//     console.log(user)

//     if (!user) {
//       return res.status(404).send("User not found");
//     }

//     const newImage = "../public/images";
//     user.profileImage = newImage; 
//     await user.save();

//     res.redirect('/home')
  
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// });




// router.post('/user/setNewImage', isLoggedIn, async (req, res) => {
//   try {
//     const username = req.user.username; // Assuming username is stored in the session or request

//     // Assuming 'newProfileImage' is the field name for the new image URL in the request body
//     const newProfileImage = req.body.newProfileImage;

//     // Update the profileImage field in the database
//     await userModel.updateOne({ username: username }, { $set: { profileImage: newProfileImage }} , { new:true});

//     res.redirect(`/home?profileImage=${encodeURIComponent(newProfileImage)}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// });


router.get('/changeImag', (req,res)=>{
  res.send("Hello");
})


module.exports = router;
