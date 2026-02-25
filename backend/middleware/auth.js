const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = function(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({error:"No Token Provided"});

  const token = header.split(" ")[1];

db.query(
  "SELECT id FROM token_blacklist WHERE token = ?",
    [token],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database Error" });

      if (rows.length > 0) {
        return res.status(401).json({ error: "Token Revoked" });
      }
        try{
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded;
          next();
        }catch{
          res.status(403).json({error:"Invalid Token"});
        }
    }
  );
};