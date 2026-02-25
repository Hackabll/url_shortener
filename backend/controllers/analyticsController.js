const db  = require("../config/db");

exports.getAnalytics = (req,res)=>{
    db.query(
        "SELECT DATE(created_at) AS day, COUNT(*) AS clicks FROM click_logs WHERE short_url = ? AND short_url IN (SELECT short_url FROM urls WHERE user_id = ?) GROUP BY day ORDER BY day",
        [req.params.shortCode, req.user.userId],
        (err,result) =>{
            if(err) return res.status(500).json(err);
            res.json(result);
        }
    );
};