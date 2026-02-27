const db = require("../config/db");
const generateCode = require("../utils/codeGenerator");
const isValidUrl = require("../utils/validateUrl");
const checkUrl = require("../utils/malwareCheck");
const axios = require("axios");

async function verifyCaptcha(token) {
  const response = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET,
        response: token
      }
    }
  );

  return response.data.success;
}

exports.createUrls = async (req,res) => {
console.log("BODY RECEIVED:", req.body);
    const{longUrl , customCode , expiryDays} = req.body;
    if(!longUrl){
        return res.status(400).json({error : "Error Url is required"});
    }
    if(!isValidUrl(longUrl)){
        return res.status(400).json({error:"Invalid Url Format"});
    }

    const{ captchaToken } = req.body;
    if(!captchaToken){
      return res.status(400).json({error:"Captcha Is required"});
    }
    const isHuman = await verifyCaptcha(captchaToken);
    if(!isHuman){
      return res.status(400).json({error:"Captcha verification failed"});
    }

    try {
        const threats = await checkUrl(longUrl);

        if (threats) {
            return res.status(400).json({
                error: "This URL is dangerous and has been blocked for security reasons"
            });
        }
    } catch (error) {
        console.error("Malware scan failed:", error.response?.data || error.message);
        return res.status(500).json({ error: "Security scan failed" });
    }
    if(customCode){
        if(!/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)){
        return res.status(400).json({error:"Custom code must be 3-20 characters (letters, numbers, _ - only)"});
        }
    }
    const shortCode = customCode || generateCode();
    let expiresAt;

    if(expiryDays){
        expiresAt = new Date(expiryDays);
    } else {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);
    }

    if(expiresAt <= new Date()){
        return res.status(400).json({error:"Expiry must be in future"});
    }

   db.query(
        "SELECT short_url FROM urls WHERE short_url = ?",
        [shortCode],
        (err, result) => {

            if(err){
                console.error(err);
                return res.status(500).json({ error: "Database error" });
            }

            if(result.length > 0){
                return res.status(409).json({ error: "Short code already exists" });
            }

        db.query(
                "INSERT INTO urls (long_url, short_url , expires_at,user_id) VALUES (?, ? , ?, ?)",
                [longUrl, shortCode , expiresAt,req.user.userId],
                (err) => {

                    if(err){
                        console.error(err);
                        return res.status(500).json({ error: "Database error" });
                    }

                    res.status(201).json({
                        short_url: `http://localhost:3000/${shortCode}`,
                        code: shortCode
                    });
        });
   });

};

exports.redirectUrl = (req,res) => {
    const shortCode = req.params.shortCode;

    const sql = "SELECT long_url, clicks ,expires_at FROM urls WHERE short_url = ?"; 

        db.query(sql,[shortCode],(err,result) =>{
            if(err){
                console.error(err);
                return res.status(500).send("Server Error");
            }

            if(result.length === 0){
                return res.status(404).send("Short Url not found");
            }

            const expiresAt = result[0].expires_at;
            if(expiresAt && new Date() > expiresAt){
                return res.status(410).send("Link has expired");
            }

            const longUrl = result[0].long_url;

            db.query(
                "UPDATE urls SET clicks = clicks + 1 WHERE short_url = ?",
                [shortCode]
            );
            db.query(
                "INSERT INTO click_logs(short_url,ip,user_agent) VALUES(? ,? ,?)",
                [shortCode,req.ip,req.headers["user-agent"]]
            );
            res.redirect(result[0].long_url);
        });

};

exports.updateUrl = (req, res) => {
  const { shortCode } = req.params;
  const { newLongUrl, newExpiryDays } = req.body;

  if (!isValidUrl(newLongUrl))
    return res.status(400).json({ error: "Invalid URL" });

  const newExpiry = newExpiryDays ? new Date(newExpiryDays) : null;

  db.query(
    "SELECT user_id FROM urls WHERE short_url = ?",
    [shortCode],
    (err, result) => {
      if (result.length === 0)
        return res.status(404).json({ error: "Not found" });

      if (result[0].user_id !== req.user.userId)
        return res.status(403).json({ error: "Forbidden" });

      db.query(
        "UPDATE urls SET long_url=?, expires_at=? WHERE short_url=?",
        [newLongUrl, newExpiry, shortCode],
        () => res.json({ message: "Updated successfully" })
      );
    }
  );
};

exports.deleteUrl = (req, res) => {
  const { shortCode } = req.params;

  db.query(
    "SELECT user_id FROM urls WHERE short_url=?",
    [shortCode],
    (err, result) => {
      if (result.length === 0)
        return res.status(404).json({ error: "Not found" });

      if (result[0].user_id !== req.user.userId)
        return res.status(403).json({ error: "Forbidden" });

      db.query(
        "DELETE FROM urls WHERE short_url=?",
        [shortCode],
        () => res.json({ message: "Deleted successfully" })
      );
    }
  );
};

exports.getMyUrls = (req, res) => {

  db.query(
    "SELECT long_url, short_url, clicks FROM urls WHERE user_id=?",
    [req.user.userId],
    (err, result) => {
      console.log("DB RESULT:", result);
      res.json(result);
    }
  );
};

exports.getStats = (req, res) => {
  db.query(
    "SELECT short_url, clicks FROM urls WHERE short_url=?",
    [req.params.shortCode],
    (err, result) => res.json(result[0])
  );
};