const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

exports.signup = async(req,res) => {
  const { username ,email, password } = req.body;

  if(!username ||!email || !password){
    return res.status(400).json({error:"All fileds are required"});   
  }

  if(!email.includes("@") || !email.endsWith(".com")){
  return res.status(400).json({error:"Email must contain @ and end with .com"});
  }

  try{
    const hashedPassword = await bcrypt.hash(password,10);

    db.query(
      "INSERT INTO users (username,email,password) VALUES (?,?,?)",
      [username, email, hashedPassword],
      err =>{
        if(err){
          if(err.code === "ER_DUP_ENTRY")
            return res.status(409).json({error:"Username or email already exist"});
          return res.status(500).json({error:"Database Error"});
        }
        res.json({message:"Signup Successfull"});
      }
    );
  }catch{
    res.status(500).json({error:"Hashing Failed"});
  }
};

exports.login = (req,res)=>{
  const { username , password } = req.body;
console.log("BODY RECEIVED:", req.body);
  db.query(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err,result)=>{
      if (err) {
        console.error("LOGIN SQL ERROR:", err);
        return res.status(500).json({ error: err.message });
      }
      if(result.length === 0)
        return res.status(401).json({error:"Invalid credentials"});

      const user = result[0];
      const match = await bcrypt.compare(password,user.password);
      if(!match)
        return res.status(401).json({error:"Invalid credentials"});

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn:"1h" }
      );

      res.json({token});
    }
  );
};


exports.forgotPassword = async (req,res)=>{
  const { email } = req.body;
   if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  db.query(
    "UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
    [hashed, expiry, email],
    async (err,result) =>{
      if(err) return res.status(500).json({error:"DB Error"});

      if(result.affectedRows === 0 ) return res.status(404).json({error:"Email not found"});

      const resetLink = `http://localhost:3000/reset.html?token=${token}`;

        try{
            await transporter.sendMail({
                to: email,
                subject: "Reset your password",
                html: `
                    <h3>Password Reset</h3>
                    <p>Click below:</p>
                    <a href="${resetLink}">${resetLink}</a>
                `
            });
            res.json({ message: "Reset email sent successfully" });

        }catch(mailErr){
            console.error("EMAIL ERROR:", mailErr);
            res.status(500).json({error:"Failed to send email"});
        }
    }
  );
};

exports.resetPassword = async(req,res)=>{
  const { token , newPassword } = req.body;

  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  if(newPassword.length < 6){
  return res.status(400).json({error:"Password too short"});
}
  db.query(
    "SELECT id FROM users WHERE reset_token=? AND reset_expires > NOW()",
    [hashed],
    async (err,result)=>{
      if(result.length === 0)
        return res.status(400).json({error:"Invalid or expired token"});

      const newHash = await bcrypt.hash(newPassword,10);

      db.query(
        "UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?",
        [newHash, result[0].id],
        ()=> res.json({message:"Password updated"})
      );
    }
  );
};

exports.logout = async(req,res) =>{
    try {
      const token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const exp = new Date(decoded.exp * 1000);

      db.query(
      "INSERT INTO token_blacklist (token, expires_at) VALUES (?, ?)",
      [token, new Date(exp)]
      );

      res.json({message:"Logged Out Securely"});
    }catch(err){
      res.status(500).json({error:"Logout Failed"});
    }
};