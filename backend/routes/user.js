const express = require("express");
const zod = require("zod");
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const router = express.Router();
const {authMiddleware} = require("../middleware");

const signupSchema = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string(),
})

const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

router.post("/signup", async (req,res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(req.body);
    if (!success) {
        return res.json({
            message:"Email already taken / Incorrect inputs"
        })
    }

    // Check if the user already exists 
    const user = await User.findOne({
        username: body.username
    })

    if (user._id) {
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10); // 10 is the salt rounds for bcrypt

    const dbUser = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    });
    const token =  jwt.sign({
        userId: dbUser._id
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})

router.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    // Find the user by username
    const user = await User.findOne({ username: body.username });

    if (!user) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    // Compare the provided password with the stored hashed password
    const validPassword = await bcrypt.compare(body.password, user.password);

    if (!validPassword) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    // Generate JWT token
    const token = jwt.sign({
        userId: user._id
    }, JWT_SECRET);

    return res.status(200).json({
        token
    });
});

const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()

})

router.put("/",authMiddleware, async (req,res) => {
    const { success } = updateBody.safeParse(req.body)

    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }
    await User.updateOne({_id: req.userId },req.body);

    res.json({
        message: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})





module.exports = router;