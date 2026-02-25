const db = require("../config/db");

exports.redirectUrl = (req, res) => {
  const { shortCode } = req.params;

  db.query(
    "SELECT long_url, expires_at FROM urls WHERE short_url = ?",
    [shortCode],
    (err, result) => {
      if (err) return res.status(500).send("Server Error");
      if (result.length === 0) return res.status(404).send("Short URL not found");

      if (result[0].expires_at && new Date() > result[0].expires_at)
        return res.status(410).send("Link expired");

      db.query("UPDATE urls SET clicks = clicks + 1 WHERE short_url = ?", [shortCode]);

      db.query(
        "INSERT INTO click_logs(short_url, ip, user_agent) VALUES (?, ?, ?)",
        [shortCode, req.ip, req.headers["user-agent"]]
      );

      res.redirect(result[0].long_url);
    }
  );
};